import Message from '../models/Message.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
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

    const notification = await Notification.create({
      userId: receiver._id,
      type: 'new_message',
      message: `New message from ${req.user.name || req.user.email || 'User'}: "${msg.message.length > 20 ? msg.message.substring(0,20)+'...' : msg.message}"`
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

      io.to(`user:${receiver._id.toString()}`).emit('new_message_notification', {
        id: notification._id,
        message: notification.message,
        createdAt: notification.createdAt,
        read: false,
        type: notification.type,
      });
    }

    res.status(201).json(msg);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get all active conversations for the current user
// @route   GET /api/messages
// @access  Private
export const getConversations = async (req, res) => {
  try {
    const me = req.user._id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ senderId: me }, { receiverId: me }],
    })
      .sort({ createdAt: -1 }) // Sort by newest first
      .populate('senderId', '_id name email role avatarUrl')
      .populate('receiverId', '_id name email role avatarUrl')
      .lean();

    // Map to find unique partners
    const conversationsMap = new Map();

    messages.forEach((msg) => {
      // Determine the partner (who is NOT the current user)
      const isSender = msg.senderId._id.toString() === me.toString();
      const partner = isSender ? msg.receiverId : msg.senderId;

      // Extract the partner ID as string for uniqueness
      const partnerId = partner._id.toString();

      // Since we sorted by newest first, the first time we see a partner, 
      // it's the latest message between them
      if (!conversationsMap.has(partnerId)) {
        conversationsMap.set(partnerId, {
          partner: {
            _id: partner._id,
            name: partner.name,
            email: partner.email,
            role: partner.role,
            avatarUrl: partner.avatarUrl || (partner.profile && partner.profile.avatarUrl) || ''
          },
          lastMessage: {
            message: msg.message,
            createdAt: msg.createdAt,
            isMine: isSender,
          },
        });
      }
    });

    // Convert map to array and sort by most recent lastMessage
    const conversations = Array.from(conversationsMap.values());
    conversations.sort((a, b) => new Date(b.lastMessage.createdAt) - new Date(a.lastMessage.createdAt));

    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


