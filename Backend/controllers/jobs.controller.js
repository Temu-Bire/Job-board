import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    const jobs = await Job.find().populate('recruiterId', 'name profile');
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get recruiter's jobs
// @route   GET /api/jobs/recruiter/my-jobs
// @access  Private/Recruiter
export const getRecruiterJobs = async (req, res) => {
  try {
    const jobs = await Job.find({ recruiterId: req.user._id }).sort({ createdAt: -1 });
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get job by ID
// @route   GET /api/jobs/:id
// @access  Public
export const getJobById = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id).populate('recruiterId', 'name profile');
    if (job) {
      res.json(job);
    } else {
      res.status(404);
      throw new Error('Job not found');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create a job
// @route   POST /api/jobs
// @access  Private/Recruiter
export const createJob = async (req, res) => {
  try {
    const {
      title,
      company,
      location,
      type,
      category,
      description,
      requirements,
      salaryMin,
      salaryMax,
      openings,
      applicationStart,
      applicationEnd,
      contactEmail,
      contactWebsite,
      status,
    } = req.body;

    const job = new Job({
      recruiterId: req.user._id,
      title,
      company,
      location,
      type,
      category,
      description,
      requirements,
      salaryMin,
      salaryMax,
      openings,
      applicationStart,
      applicationEnd,
      contactEmail,
      contactWebsite,
      status,
    });

    const createdJob = await job.save();

    // Notify all students (frontend shows a bell to the currently logged-in user)
    const students = await User.find({ role: 'student', blocked: { $ne: true } }).select('_id');
    const notifications = students.map((u) => ({
      userId: u._id,
      type: 'job_posted',
      message: `New job posted: "${createdJob.title}" at ${createdJob.company}.`,
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json(createdJob);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a job
// @route   PUT /api/jobs/:id
// @access  Private/Recruiter
export const updateJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      // Check if user is the job creator
      if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to update this job');
      }

      job.title = req.body.title || job.title;
      job.company = req.body.company || job.company;
      job.location = req.body.location || job.location;
      job.type = req.body.type || job.type;
      job.category = req.body.category ?? job.category;
      job.description = req.body.description || job.description;
      job.requirements = req.body.requirements || job.requirements;
      job.salaryMin = req.body.salaryMin ?? job.salaryMin;
      job.salaryMax = req.body.salaryMax ?? job.salaryMax;
      job.openings = req.body.openings ?? job.openings;
      job.applicationStart = req.body.applicationStart ?? job.applicationStart;
      job.applicationEnd = req.body.applicationEnd ?? job.applicationEnd;
      job.contactEmail = req.body.contactEmail ?? job.contactEmail;
      job.contactWebsite = req.body.contactWebsite ?? job.contactWebsite;
      job.status = req.body.status ?? job.status;

      const updatedJob = await job.save();
      res.json(updatedJob);
    } else {
      res.status(404);
      throw new Error('Job not found');
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a job
// @route   DELETE /api/jobs/:id
// @access  Private/Recruiter
export const deleteJob = async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);

    if (job) {
      if (job.recruiterId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        res.status(401);
        throw new Error('Not authorized to delete this job');
      }
      await job.deleteOne();
      res.json({ message: 'Job removed' });
    } else {
      res.status(404);
      throw new Error('Job not found');
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
