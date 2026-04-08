import express from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob, getRecruiterJobs } from '../controllers/jobs.controller.js';
import { protect, recruiter } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/recruiter/my-jobs', protect, recruiter, getRecruiterJobs);

router.route('/')
  .get(getJobs)
  .post(protect, recruiter, createJob);

router.route('/:id')
  .get(getJobById)
  .put(protect, recruiter, updateJob)
  .delete(protect, recruiter, deleteJob);

export default router;
