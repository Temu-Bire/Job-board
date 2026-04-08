import Notification from '../models/Notification.js';

const toNotificationDTO = (n) => {
  const obj = typeof n.toObject === 'function' ? n.toObject() : n;
  return {
    id: obj._id,
    message: obj.message,
    createdAt: obj.createdAt,
    read: !!obj.readAt,
  };
};

// GET /api/notifications
export const listNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(notifications.map(toNotificationDTO));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/notifications/unread-count
export const unreadCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      readAt: null,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// PUT /api/notifications/:id/read
export const markRead = async (req, res) => {
  try {
    const { id } = req.params;
    await Notification.updateOne(
      { _id: id, userId: req.user._id },
      { $set: { readAt: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// PUT /api/notifications/mark-all-read
export const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, readAt: null },
      { $set: { readAt: new Date() } }
    );
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

