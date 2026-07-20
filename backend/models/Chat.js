const mongoose = require('mongoose');

const chatSchema = new mongoose.Schema({
  participants: [
    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  ],
  lastMessage: { type: String },
  lastMessageTime: { type: Date },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

// Ensure only 2 participants and no duplicates among active chats
chatSchema.pre('save', async function (next) {
  if (this.participants.length !== 2) {
    return next(new Error('Chat must have exactly 2 participants'));
  }

  if (this.isNew) {
    const existingChat = await mongoose.model('Chat').findOne({
      participants: { $all: this.participants },
      isArchived: false
    });

    if (existingChat) {
      return next(new Error('Chat already exists between these participants'));
    }
  }

  next();
});

module.exports = mongoose.model('Chat', chatSchema);
