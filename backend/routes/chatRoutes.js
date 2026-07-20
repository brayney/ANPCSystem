const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const { getAvailableUsers, getChats, getOrCreateChat, getMessages, sendMessage, markAsRead, getMedia, clearAllChats } = require('../controllers/chatController');

const router = express.Router();

const upload = multer({
  dest: path.join(__dirname, '..', 'uploads', 'chat-tmp'),
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB
});

// All chat routes require authentication
router.use(protect);

router.get('/available-users', getAvailableUsers);
router.get('/chats', getChats);
router.post('/chats', getOrCreateChat);
router.delete('/chats/clear-all', clearAllChats);
router.get('/chats/:chatId/messages', getMessages);
router.post('/chats/:chatId/messages', upload.single('media'), sendMessage);
router.put('/chats/:chatId/read', markAsRead);
router.get('/chats/media/:filename', getMedia);

module.exports = router;
