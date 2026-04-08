import Application from '../models/Application.js';
import Job from '../models/Job.js';
import Notification from '../models/Notification.js';

const normalizeApplication = (app) => {
  if (!app) return app;
  const obj = typeof app.toObject === 'function' ? app.toObject() : app;
  // Frontend expects `student` and `job`
  if (obj.studentId && !obj.student) obj.student = obj.studentId;
  if (obj.jobId && !obj.job) obj.job = obj.jobId;
  delete obj.studentId;
  delete obj.jobId;

  if (obj.student) {
    const p = obj.student.profile || {};
    obj.student = {
      ...obj.student,
      avatarUrl: obj.student.avatarUrl || p.avatarUrl || '',
      resumeUrl: obj.student.resumeUrl || p.resumeUrl || '',
      university: obj.student.university || p.university || '',
      degree: obj.student.degree || p.degree || '',
      graduationYear: obj.student.graduationYear || p.graduationYear || null,
      skills: obj.student.skills || p.skills || [],
      githubUrl: obj.student.githubUrl || p.githubUrl || '',
      linkedinUrl: obj.student.linkedinUrl || p.linkedinUrl || '',
    };
  }

  if (obj.job) {
    // Keep compatibility if job only has legacy `salary` field
    if ((obj.job.salaryMin == null || obj.job.salaryMax == null) && obj.job.salary) {
      const parts = String(obj.job.salary).split('-').map((s) => Number(String(s).trim()));
      if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
        obj.job.salaryMin = obj.job.salaryMin ?? parts[0];
        obj.job.salaryMax = obj.job.salaryMax ?? parts[1];
      }
    }
  }
  return obj;
};

// @desc    Apply for a job
// @route   POST /api/applications
// @access  Private/Student
export const applyForJob = async (req, res) => {
  try {
    // Support both:
    // - POST /api/applications   with { jobId, coverLetter }
    // - POST /api/applications/job/:jobId with { coverLetter }
    const jobId = req.body.jobId || req.params.jobId;
    const { coverLetter } = req.body;

    const job = await Job.findById(jobId);
    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    // Check if already applied
    const existingApplication = await Application.findOne({
      studentId: req.user._id,
      jobId
    });

    if (existingApplication) {
      res.status(400);
      throw new Error('You have already applied for this job');
    }

    const application = new Application({
      studentId: req.user._id,
      jobId,
      coverLetter
    });

    const createdApp = await application.save();

    // Notify recruiter who posted the job
    await Notification.create({
      userId: job.recruiterId,
      type: 'application_submitted',
      message: `New application submitted for "${job.title}" by ${req.user.name || req.user.email}.`,
    });

    res.status(201).json(normalizeApplication(createdApp));
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get student's applications
// @route   GET /api/applications/myapplications
// @access  Private/Student
export const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ studentId: req.user._id })
      .populate('jobId')
      .sort({ createdAt: -1 });
    res.json(applications.map(normalizeApplication));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get applications for a job (recruiter only)
// @route   GET /api/applications/job/:jobId
// @access  Private/Recruiter
export const getJobApplications = async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    
    if (!job) {
      res.status(404);
      throw new Error('Job not found');
    }

    if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to view these applications');
    }

    const applications = await Application.find({ jobId: req.params.jobId })
      .populate(
        'studentId',
        'name email profile role approved blocked university degree graduationYear phone githubUrl linkedinUrl avatarUrl resumeUrl'
      );
      
    res.json(applications.map(normalizeApplication));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update application status
// @route   PUT /api/applications/:id/status
// @access  Private/Recruiter
export const updateApplicationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const application = await Application.findById(req.params.id);

    if (!application) {
      res.status(404);
      throw new Error('Application not found');
    }

    const job = await Job.findById(application.jobId);
    
    if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      res.status(401);
      throw new Error('Not authorized to update this application');
    }

    application.status = status;
    const updatedApplication = await application.save();
    
    res.json(updatedApplication);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
