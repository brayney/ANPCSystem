const Chat = require('../models/Chat');
const Message = require('../models/Message');
const User = require('../models/User');

// Get available users for chatting (admin can chat with managers, managers with admin)
exports.getAvailableUsers = async (req, res, next) => {
  try {
    const currentUserId = req.user._id;
    const isCurrentAdmin = req.user.role === 'admin';

    // If admin, get all active managers. If manager, get admin user.
    let query = {};
    if (isCurrentAdmin) {
      query = { role: 'manager', isActive: true, _id: { $ne: currentUserId } };
    } else {
      query = { role: 'admin', isActive: true, _id: { $ne: currentUserId } };
    }

    const availableUsers = await User.find(query).select('_id name email role');

    // Get existing chat IDs for current user
    const existingChats = await Chat.find({
      participants: currentUserId,
      isArchived: false
    }).select('participants');

    const existingChatUserIds = new Set();
    existingChats.forEach(chat => {
      chat.participants.forEach(pid => {
        if (pid.toString() !== currentUserId.toString()) {
          existingChatUserIds.add(pid.toString());
        }
      });
    });

    // Mark which users already have chats
    const usersWithChatStatus = availableUsers.map(user => ({
      ...user.toObject(),
      hasChat: existingChatUserIds.has(user._id.toString())
    }));

    res.json({ success: true, data: usersWithChatStatus });
  } catch (error) { next(error); }
};

// Get all chats for current user
exports.getChats = async (req, res, next) => {
  try {
    const chats = await Chat.find({
      participants: req.user._id,
      isArchived: false
    })
      .populate('participants', 'name email role')
      .sort({ lastMessageTime: -1 });

    // Add unread count for each chat
    const chatsWithUnread = await Promise.all(chats.map(async (chat) => {
      const unreadCount = await Message.countDocuments({
        chat: chat._id,
        sender: { $ne: req.user._id },
        isRead: false
      });
      return { ...chat.toObject(), unreadCount };
    }));

    res.json({ success: true, data: chatsWithUnread });
  } catch (error) { next(error); }
};

// Get or create chat between two users
exports.getOrCreateChat = async (req, res, next) => {
  try {
    const { userId } = req.body;
    const currentUserId = req.user._id;

    if (userId === currentUserId.toString()) {
      return res.status(400).json({ success: false, message: 'Cannot chat with yourself' });
    }

    // Check if user exists and is admin or manager
    const otherUser = await User.findById(userId);
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Allow chat only if one is admin and other is manager
    const isCurrentAdmin = req.user.role === 'admin';
    const isOtherAdmin = otherUser.role === 'admin';
    if (!((isCurrentAdmin && !isOtherAdmin) || (!isCurrentAdmin && isOtherAdmin))) {
      return res.status(400).json({ success: false, message: 'Only admins and managers can chat' });
    }

    // Find existing chat or create new one
    let chat = await Chat.findOne({
      participants: { $all: [currentUserId, userId] }
    }).populate('participants', 'name email role');

    if (!chat) {
      chat = await Chat.create({
        participants: [currentUserId, userId]
      });
      chat = await chat.populate('participants', 'name email role');
    }

    res.json({ success: true, data: chat });
  } catch (error) { next(error); }
};

// Get messages for a chat
exports.getMessages = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const total = await Message.countDocuments({ chat: chatId });
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({
      success: true,
      data: messages.reverse(),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) { next(error); }
};

// Send message
exports.sendMessage = async (req, res, next) => {
  try {
    const { chatId } = req.params;
    const { text } = req.body;

    if (!text?.trim()) {
      return res.status(400).json({ success: false, message: 'Message cannot be empty' });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const message = await Message.create({
      chat: chatId,
      sender: req.user._id,
      text: text.trim()
    });

    // Update chat's last message
    await Chat.findByIdAndUpdate(chatId, {
      lastMessage: text.trim().substring(0, 100),
      lastMessageTime: new Date()
    });

    const populatedMessage = await message.populate('sender', 'name email role');

    res.status(201).json({ success: true, data: populatedMessage });
  } catch (error) { next(error); }
};

// Mark messages as read
exports.markAsRead = async (req, res, next) => {
  try {
    const { chatId } = req.params;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ success: false, message: 'Chat not found' });
    }

    // Verify user is participant
    if (!chat.participants.includes(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    // Mark all messages from other user as read
    await Message.updateMany(
      {
        chat: chatId,
        sender: { $ne: req.user._id },
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) { next(error); }
};
