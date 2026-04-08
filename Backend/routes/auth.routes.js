import express from 'express';
import { registerUser, loginUser, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validators.js';

const router = express.Router();

router.post('/register', validate({ body: registerSchema }), registerUser);
router.post('/login', validate({ body: loginSchema }), loginUser);
router.get('/me', protect, getMe);

export default router;
