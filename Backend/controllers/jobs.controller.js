import Job from '../models/Job.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { getIO } from '../socket.js';

// @desc    Get jobs with pagination & filters
// @route   GET /api/jobs
// @access  Public
export const getJobs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      search,
      location,
      salaryMin,
      salaryMax,
      type,
    } = req.query;

    const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
    const pageSize = Math.max(parseInt(limit, 10) || 10, 1);

    const query = {};

    const text = (keyword || search || '').trim();
    if (text) {
      query.$or = [
        { title: { $regex: text, $options: 'i' } },
        { company: { $regex: text, $options: 'i' } },
      ];
    }

    if (location) {
      query.location = { $regex: String(location), $options: 'i' };
    }

    if (type) {
      query.type = type;
    }

    const min = Number(salaryMin);
    const max = Number(salaryMax);
    // Salary filtering (range overlap):
    // - if salaryMin is provided: job.salaryMax >= salaryMin
    // - if salaryMax is provided: job.salaryMin <= salaryMax
    // This keeps salary constraints AND-ed with other filters (instead of weakening keyword $or).
    const and = [];
    if (!Number.isNaN(min) && min > 0) {
      and.push({ salaryMax: { $gte: min } });
    }
    if (!Number.isNaN(max) && max > 0) {
      and.push({ salaryMin: { $lte: max } });
    }
    if (and.length > 0) {
      query.$and = [...(query.$and || []), ...and];
    }

    const total = await Job.countDocuments(query);
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .populate('recruiterId', 'name profile');

    const pages = Math.ceil(total / pageSize) || 1;

    res.json({
      jobs,
      page: pageNumber,
      pages,
      total,
    });
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
      status,
    } = req.body;

    const companyName = req.user.company || req.user.profile?.companyName || 'Unknown Company';
    const companyLocation = req.user.profile?.location || 'Remote';
    const companyWebsite = req.user.website || req.user.profile?.website || '';

    const job = new Job({
      recruiterId: req.user._id,
      title,
      company: companyName,
      location: companyLocation,
      type,
      category,
      description,
      requirements,
      salaryMin: salaryMin === '' ? null : salaryMin,
      salaryMax: salaryMax === '' ? null : salaryMax,
      openings: openings === '' ? 1 : openings,
      applicationStart: applicationStart === '' ? null : applicationStart,
      applicationEnd: applicationEnd === '' ? null : applicationEnd,
      contactEmail,
      contactWebsite: companyWebsite,
      status,
    });

    const createdJob = await job.save();

    // Notify all jobseekers (frontend shows a bell to the currently logged-in user)
    const jobseekers = await User.find({ role: 'jobseeker', blocked: { $ne: true } }).select('_id');
    const notifications = jobseekers.map((u) => ({
      userId: u._id,
      type: 'job_posted',
      message: `New job posted: "${createdJob.title}" at ${createdJob.company}.`,
    }));
    if (notifications.length > 0) {
      const createdNotifications = await Notification.insertMany(notifications);
      const io = getIO();
      if (io) {
        createdNotifications.forEach((n) => {
          io.to(`user:${n.userId.toString()}`).emit('new_job_posted', {
            id: n._id,
            message: n.message,
            createdAt: n.createdAt,
            read: false,
            type: n.type,
          });
        });
      }
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
      job.company = req.user.company || req.user.profile?.companyName || job.company;
      job.location = req.user.profile?.location || job.location;
      job.type = req.body.type || job.type;
      job.category = req.body.category ?? job.category;
      job.description = req.body.description || job.description;
      job.requirements = req.body.requirements || job.requirements;
      job.salaryMin = req.body.salaryMin === '' ? null : (req.body.salaryMin ?? job.salaryMin);
      job.salaryMax = req.body.salaryMax === '' ? null : (req.body.salaryMax ?? job.salaryMax);
      job.openings = req.body.openings === '' ? 1 : (req.body.openings ?? job.openings);
      job.applicationStart = req.body.applicationStart === '' ? null : (req.body.applicationStart ?? job.applicationStart);
      job.applicationEnd = req.body.applicationEnd === '' ? null : (req.body.applicationEnd ?? job.applicationEnd);
      job.contactEmail = req.body.contactEmail ?? job.contactEmail;
      job.contactWebsite = req.user.website || req.user.profile?.website || job.contactWebsite;
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

// @desc    Save a job (bookmark)
// @route   POST /api/jobs/:id/save
// @access  Private/Jobseeker
export const saveJob = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const jobId = req.params.id;
    const job = await Job.findById(jobId).select('_id');
    if (!job) return res.status(404).json({ message: 'Job not found' });

    await User.findByIdAndUpdate(
      req.user._id,
      { $addToSet: { savedJobs: jobId } },
      { new: true }
    );

    res.json({ saved: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Unsave a job (remove bookmark)
// @route   DELETE /api/jobs/:id/save
// @access  Private/Jobseeker
export const unsaveJob = async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const jobId = req.params.id;
    await User.findByIdAndUpdate(
      req.user._id,
      { $pull: { savedJobs: jobId } },
      { new: true }
    );

    res.json({ saved: false });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
