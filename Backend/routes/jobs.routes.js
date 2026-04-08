import express from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob, getRecruiterJobs, saveJob, unsaveJob } from '../controllers/jobs.controller.js';
import { protect, recruiter } from '../middleware/auth.middleware.js';
import { validate, objectIdSchema } from '../middleware/validate.middleware.js';
import { jobCreateSchema, jobUpdateSchema } from '../validators/jobs.validators.js';
import { z } from 'zod';

const router = express.Router();

router.get('/recruiter/my-jobs', protect, recruiter, getRecruiterJobs);

router.route('/')
  .get(getJobs)
  .post(protect, recruiter, validate({ body: jobCreateSchema }), createJob);

router.route('/:id')
  .get(validate({ params: z.object({ id: objectIdSchema }) }), getJobById)
  .put(protect, recruiter, validate({ params: z.object({ id: objectIdSchema }), body: jobUpdateSchema }), updateJob)
  .delete(protect, recruiter, deleteJob);

router.post('/:id/save', protect, validate({ params: z.object({ id: objectIdSchema }) }), saveJob);
router.delete('/:id/save', protect, validate({ params: z.object({ id: objectIdSchema }) }), unsaveJob);

export default router;
