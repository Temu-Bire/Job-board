import express from 'express';
import User from '../models/User.js';
import Job from '../models/Job.js';
import Application from '../models/Application.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/public', async (req, res) => {
  try {
    const [totalJobseekers, totalCompanies, totalPlacements] = await Promise.all([
      User.countDocuments({ role: 'jobseeker' }),
      User.countDocuments({ role: 'recruiter' }),
      Application.countDocuments({ status: 'accepted' })
    ]);
    res.json({
      jobseekers: totalJobseekers,
      companies: totalCompanies,
      placements: totalPlacements
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/admin', async (req, res) => {
  try {
    const now = new Date();
    const days30Ago = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalJobseekers,
      totalRecruiters,
      pendingRecruiters,
      totalJobs,
      activeJobs,
      totalApplications,
      jobseekerRegistrationsLast30,
      newJobsLast30,
      applicationsLast30,
    ] = await Promise.all([
      User.countDocuments({ role: 'jobseeker' }),
      User.countDocuments({ role: 'recruiter' }),
      User.countDocuments({ role: 'recruiter', approved: false }),
      Job.countDocuments({}),
      Job.countDocuments({ status: 'active' }),
      Application.countDocuments({}),
      User.countDocuments({ role: 'jobseeker', createdAt: { $gte: days30Ago } }),
      Job.countDocuments({ createdAt: { $gte: days30Ago } }),
      Application.countDocuments({ createdAt: { $gte: days30Ago } }),
    ]);

    res.json({
      totalJobseekers,
      totalRecruiters,
      pendingRecruiters,
      totalJobs,
      activeJobs,
      totalApplications,
      jobseekerRegistrationsLast30,
      newJobsLast30,
      applicationsLast30,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/jobseeker', protect, async (req, res) => {
  try {
    if (req.user.role !== 'jobseeker') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const [totalJobs, appliedJobs, pendingApplications, acceptedApplications] = await Promise.all([
      Job.countDocuments({ status: 'active' }),
      Application.countDocuments({ studentId: req.user._id }),
      Application.countDocuments({ studentId: req.user._id, status: 'pending' }),
      Application.countDocuments({ studentId: req.user._id, status: 'accepted' }),
    ]);

    res.json({
      totalJobs,
      appliedJobs,
      pendingApplications,
      acceptedApplications,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/recruiter', protect, async (req, res) => {
  try {
    if (req.user.role !== 'recruiter') {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const jobs = await Job.find({ recruiterId: req.user._id }).select('_id status');
    const jobIds = jobs.map((j) => j._id);
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter((j) => j.status === 'active').length;

    const totalApplicants = jobIds.length
      ? await Application.countDocuments({ jobId: { $in: jobIds } })
      : 0;

    // No view tracking implemented yet
    const totalViews = 0;

    res.json({
      totalJobs,
      activeJobs,
      totalApplicants,
      totalViews,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
