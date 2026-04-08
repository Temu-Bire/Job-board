import Message from '../models/Message.js';
import User from '../models/User.js';
import { getIO } from '../socket.js';

// @desc    Get messages between current user and another user
// @route   GET /api/messages/:userId
// @access  Private
export const getConversation = async (req, res) => {
  try {
    const { userId } = req.params;
    const me = req.user._id;

    const other = await User.findById(userId).select('_id name email role');
    if (!other) return res.status(404).json({ message: 'User not found' });

    const messages = await Message.find({
      $or: [
        { senderId: me, receiverId: userId },
        { senderId: userId, receiverId: me },
      ],
    })
      .sort({ createdAt: 1 })
      .lean();

    res.json({ partner: other, messages });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Send a message to another user
// @route   POST /api/messages/:userId
// @access  Private
export const sendMessage = async (req, res) => {
  try {
    const { userId } = req.params;
    const { message } = req.body;
    const me = req.user._id;

    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Message cannot be empty' });
    }

    const receiver = await User.findById(userId).select('_id');
    if (!receiver) return res.status(404).json({ message: 'User not found' });

    const msg = await Message.create({
      senderId: me,
      receiverId: userId,
      message: message.trim(),
    });

    const io = getIO();
    if (io) {
      io.to(`user:${receiver._id.toString()}`).emit('chat_message', {
        _id: msg._id,
        senderId: msg.senderId,
        receiverId: msg.receiverId,
        message: msg.message,
        createdAt: msg.createdAt,
      });
    }

    res.status(201).json(msg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

