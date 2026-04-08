import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import {
  getUsers,
  updateUserBasic,
  updateStudentProfile,
  approveRecruiter,
  blockUser,
  uploadStudentAvatar,
  uploadStudentResume,
} from '../controllers/users.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const safeExt = path.extname(file.originalname || '').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
  },
});

const upload = multer({ storage });

const router = express.Router();

router.get('/', protect, admin, getUsers);
router.put('/:id', protect, updateUserBasic);
router.put('/:id/student-profile', protect, updateStudentProfile);
router.put('/:id/approve', protect, admin, approveRecruiter);
router.put('/:id/block', protect, admin, blockUser);

router.post('/:id/student-profile/avatar', protect, upload.single('avatar'), uploadStudentAvatar);
router.post('/:id/student-profile/resume', protect, upload.single('resume'), uploadStudentResume);

export default router;

