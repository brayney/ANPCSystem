const mongoose = require('mongoose');

const counterweightSchema = new mongoose.Schema({
  itemName: { type: String, trim: true },
  serialNo: { type: String, trim: true },
  assignedCrane: { type: String, trim: true, index: true },
  weightKg: { type: Number },
  capacity: { type: String, trim: true },
  location: { type: String, trim: true, default: 'RAG YARD' },
  client: { type: String, trim: true, default: '-' },
  condition: { type: String, enum: ['OK', 'NOT OK', 'For Repair', 'Unknown'], default: 'OK' },
  status: { type: String, enum: ['Available', 'In Use', 'Under Maintenance', 'Out of Yard'], default: 'Available' },
  comments: { type: String, trim: true },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Counterweight', counterweightSchema);
