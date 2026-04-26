import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  getUsers,
  updateUserBasic,
  updateJobseekerProfile,
  approveRecruiter,
  blockUser,
  resetUserPassword,
  uploadJobseekerAvatar,
  uploadJobseekerResume,
  getSavedJobs,
  updateRecruiterProfile,
  uploadRecruiterLogo,
  createAdminUser,
  updatePassword,
} from '../controllers/users.controller.js';
import { isCloudinaryConfigured } from '../utils/cloudinaryUpload.js';
import { protect, admin } from '../middleware/auth.middleware.js';
import { validate, objectIdSchema } from '../middleware/validate.middleware.js';
import { resetPasswordSchema } from '../validators/users.validators.js';
import { z } from 'zod';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

// Cloudinary uses in-memory buffers; disk keeps files under /uploads for local/PUBLIC_URL setups.
const uploadStorage = isCloudinaryConfigured() ? multer.memoryStorage() : diskStorage;

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2MB
const MAX_RESUME_BYTES = 5 * 1024 * 1024; // 5MB

const imageFileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid avatar file type. Allowed: jpg, png, webp.'));
  }
  cb(null, true);
};

const resumeFileFilter = (req, file, cb) => {
  const allowed = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error('Invalid resume file type. Allowed: pdf, doc, docx.'));
  }
  cb(null, true);
};

const uploadAvatar = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: imageFileFilter,
});
const uploadResume = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_RESUME_BYTES },
  fileFilter: resumeFileFilter,
});
const uploadLogo = multer({
  storage: uploadStorage,
  limits: { fileSize: MAX_AVATAR_BYTES },
  fileFilter: imageFileFilter,
});

const router = express.Router();

router.get('/', protect, admin, getUsers);
router.put('/:id', protect, updateUserBasic);
router.put('/:id/jobseeker-profile', protect, updateJobseekerProfile);
router.put('/:id/approve', protect, admin, approveRecruiter);
router.put('/:id/block', protect, admin, blockUser);
router.put(
  '/:id/reset-password',
  protect,
  admin,
  validate({ params: z.object({ id: objectIdSchema }), body: resetPasswordSchema }),
  resetUserPassword
);

router.post('/:id/jobseeker-profile/avatar', protect, uploadAvatar.single('avatar'), uploadJobseekerAvatar);
router.post('/:id/jobseeker-profile/resume', protect, uploadResume.single('resume'), uploadJobseekerResume);

// Recruiter Profile
router.put('/:id/recruiter-profile', protect, updateRecruiterProfile);
router.post('/:id/recruiter-profile/logo', protect, uploadLogo.single('logo'), uploadRecruiterLogo);

// Password Update
router.put('/:id/password', protect, updatePassword);

// Admin Account Creation
router.post('/admin', protect, admin, createAdminUser);

// Saved jobs for current jobseeker
router.get('/saved-jobs', protect, getSavedJobs);

export default router;

