import express from 'express';
import { registerUser, loginUser, getMe, forgotPassword, resetPassword, googleAuth } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema, googleAuthSchema } from '../validators/auth.validators.js';

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), registerUser);
router.post('/login', validate({ body: loginSchema }), loginUser);
router.post('/forgot-password', validate({ body: forgotPasswordSchema }), forgotPassword);
router.post('/reset-password', validate({ body: resetPasswordSchema }), resetPassword);
router.post('/google', validate({ body: googleAuthSchema }), googleAuth);
router.get('/me', protect, getMe);

export default router;
