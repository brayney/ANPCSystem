const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  chat: { type: mongoose.Schema.Types.ObjectId, ref: 'Chat', required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, trim: true, default: '' },
  media: {
    type: { type: String, enum: ['image', 'video'], default: null },
    url: { type: String, default: null },
    filename: { type: String, default: null },
    originalName: { type: String, default: null },
    mimeType: { type: String, default: null },
    size: { type: Number, default: 0 },
  },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date },
}, { timestamps: true });

messageSchema.index({ chat: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
