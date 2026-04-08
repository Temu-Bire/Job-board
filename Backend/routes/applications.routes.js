import express from 'express';
import { 
  applyForJob, 
  getMyApplications, 
  getJobApplications, 
  updateApplicationStatus 
} from '../controllers/applications.controller.js';
import { protect, recruiter } from '../middleware/auth.middleware.js';

const router = express.Router();

// Aliases to match frontend calls
router.post('/job/:jobId', protect, applyForJob);
router.get('/student/my-applications', protect, getMyApplications);
router.get('/job/:jobId/applicants', protect, recruiter, getJobApplications);

router.post('/', protect, applyForJob);
router.get('/myapplications', protect, getMyApplications);
router.get('/job/:jobId', protect, recruiter, getJobApplications);
router.put('/:id/status', protect, recruiter, updateApplicationStatus);

export default router;
