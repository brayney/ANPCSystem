const mongoose = require('mongoose');

const boomSectionSchema = new mongoose.Schema({
  assignedCrane: { type: String, trim: true, index: true },
  boomCode: { type: String, trim: true },
  itemName: { type: String, trim: true },
  length: { type: String, trim: true },
  weightKg: { type: String, trim: true },
  location: { type: String, trim: true, default: 'RAG YARD' },
  client: { type: String, trim: true, default: '-' },
  condition: { type: String, enum: ['Ok', 'NOT OK', 'For Repair', 'Unknown'], default: 'Ok' },
  status: { type: String, enum: ['Available', 'In Use', 'Under Maintenance', 'Out of Yard'], default: 'Available' },
  comments: { type: String, trim: true },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('BoomSection', boomSectionSchema);
