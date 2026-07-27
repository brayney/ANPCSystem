const Notification = require('../models/Notification');

exports.getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(30);
    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });
    res.json({ success: true, data: notifications, unreadCount });
  } catch (error) {
    next(error);
  }
};

exports.markNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    res.json({ success: true, message: 'Notifications marked as read' });
  } catch (error) {
    next(error);
  }
};
