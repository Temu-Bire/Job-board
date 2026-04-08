import express from 'express';
const router = express.Router();

router.get('/admin', (req, res) => {
  res.json({
    totalStudents: 0,
    totalRecruiters: 0,
    pendingRecruiters: 0,
    totalJobs: 0,
    activeJobs: 0,
    totalApplications: 0,
  });
});

router.get('/student', (req, res) => {
  res.json({
    totalJobs: 0,
    appliedJobs: 0,
    pendingApplications: 0,
    acceptedApplications: 0,
  });
});

router.get('/recruiter', (req, res) => {
  // Although not currently used in the dashboard, providing it for completeness
  res.json({
    totalJobs: 0,
    activeJobs: 0,
    totalApplicants: 0,
    totalViews: 0,
  });
});

export default router;
