import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  getConversation,
  sendMessage,
  getConversations,
  editMessage,
  deleteMessage,
} from '../controllers/messages.controller.js';
import { validate, objectIdSchema } from '../middleware/validate.middleware.js';
import { z } from 'zod';

const router = express.Router();

router.get('/', protect, getConversations);
router.get('/:userId', protect, validate({ params: z.object({ userId: objectIdSchema }) }), getConversation);
router.post(
  '/:userId',
  protect,
  validate({
    params: z.object({ userId: objectIdSchema }),
    body: z.object({ message: z.string().min(1).max(5000) }),
  }),
  sendMessage
);
router.put(
  '/:messageId',
  protect,
  validate({
    params: z.object({ messageId: objectIdSchema }),
    body: z.object({ message: z.string().min(1).max(5000) }),
  }),
  editMessage
);
router.delete(
  '/:messageId',
  protect,
  validate({ params: z.object({ messageId: objectIdSchema }) }),
  deleteMessage
);

export default router;

