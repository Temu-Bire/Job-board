import express from 'express';
import rateLimit from 'express-rate-limit';
import sanitizeHtml from 'sanitize-html';
import { handleContactForm } from '../controllers/contact.controller.js';

const router = express.Router();

// 1. Rate limiter: Spambot Protection (Max 5 requests per 15 minutes per IP)
const contactRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 5,
  message: { success: false, message: 'Too many requests from this IP. Please try again after 15 minutes.' }
});

// 2. Middleware to prevent XSS by sanitizing incoming request body strings
const xssSanitizer = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    for (let key in req.body) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeHtml(req.body[key], {
          allowedTags: [], // Strips absolutely all HTML tags (<script>, <iframe> etc)
          allowedAttributes: {}
        });
      }
    }
  }
  next();
};

// 3. Mount the cleanly factored route
router.post('/', contactRateLimiter, xssSanitizer, handleContactForm);

export default router;
