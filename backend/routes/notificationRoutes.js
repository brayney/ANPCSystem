const express = require('express');
const { protect } = require('../middleware/auth');
const { getNotifications, markNotificationsRead } = require('../controllers/notificationController');
const router = express.Router();

router.use(protect);
router.get('/', getNotifications);
router.put('/read', markNotificationsRead);

module.exports = router;
