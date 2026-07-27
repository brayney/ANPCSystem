const Notification = require('../models/Notification');

exports.createNotification = async ({ userId, title, message, type = 'info', category = 'general', link = '' }) => {
  if (!userId || !title || !message) return null;
  try {
    return await Notification.create({ userId, title, message, type, category, link });
  } catch (err) {
    console.error('Notification creation failed:', err.message);
    return null;
  }
};
