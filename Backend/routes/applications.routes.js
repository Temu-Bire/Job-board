import express from 'express';
import { 
  applyForJob, 
  getMyApplications, 
  getJobApplications, 
  updateApplicationStatus 
} from '../controllers/applications.controller.js';
import { protect, recruiter } from '../middleware/auth.middleware.js';
import { validate, objectIdSchema } from '../middleware/validate.middleware.js';
import { applySchema, updateStatusSchema } from '../validators/applications.validators.js';
import { z } from 'zod';

const router = express.Router();

// Aliases to match frontend calls
router.post('/job/:jobId', protect, validate({ params: z.object({ jobId: objectIdSchema }), body: applySchema }), applyForJob);
router.get('/jobseeker/my-applications', protect, getMyApplications);
router.get('/job/:jobId/applicants', protect, recruiter, getJobApplications);

router.post('/', protect, validate({ body: applySchema }), applyForJob);
router.get('/myapplications', protect, getMyApplications);
router.get('/job/:jobId', protect, recruiter, getJobApplications);
router.put('/:id/status', protect, recruiter, validate({ params: z.object({ id: objectIdSchema }), body: updateStatusSchema }), updateApplicationStatus);

export default router;
