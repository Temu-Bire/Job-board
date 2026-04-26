import express from 'express';
import rateLimit from 'express-rate-limit';
import { registerUser, loginUser, getMe, forgotPassword, resetPassword, googleAuth } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, googleAuthSchema } from '../validators/auth.validators.js';

const router = express.Router();

const authBurstLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP. Please try again in a few minutes.' },
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again later.' },
});

router.post('/register', authBurstLimiter, validate({ body: registerSchema }), registerUser);
router.post('/login', loginLimiter, validate({ body: loginSchema }), loginUser);
router.post('/forgot-password', authBurstLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', authBurstLimiter, validate({ body: resetPasswordSchema }), resetPassword);
router.post('/google', authBurstLimiter, validate({ body: googleAuthSchema }), googleAuth);
router.get('/me', protect, getMe);

export default router;
