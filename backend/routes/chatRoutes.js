const express = require('express');
const { protect } = require('../middleware/auth');
const { getChats, getOrCreateChat, getMessages, sendMessage, markAsRead } = require('../controllers/chatController');

const router = express.Router();

// All chat routes require authentication
router.use(protect);

router.get('/chats', getChats);
router.post('/chats', getOrCreateChat);
router.get('/chats/:chatId/messages', getMessages);
router.post('/chats/:chatId/messages', sendMessage);
router.put('/chats/:chatId/read', markAsRead);

module.exports = router;
