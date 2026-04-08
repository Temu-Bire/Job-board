import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { listNotifications, unreadCount, markRead, markAllRead } from '../controllers/notifications.controller.js';

const router = express.Router();

router.get('/unread-count', protect, unreadCount);

router.get('/', protect, listNotifications);

router.put('/:id/read', protect, markRead);

router.put('/mark-all-read', protect, markAllRead);

export default router;
