const mongoose = require('mongoose');

const hookSchema = new mongoose.Schema({
  itemName: { type: String, trim: true },
  hookSerialNo: { type: String, trim: true },
  capacity: { type: String, trim: true },
  assignedCrane: { type: String, trim: true, index: true },
  location: { type: String, trim: true, default: 'RAG YARD' },
  client: { type: String, trim: true, default: '-' },
  status: { type: String, enum: ['Available', 'Allocated', 'In Use', 'Under Maintenance', 'Out of Yard'], default: 'Available' },
  weightKg: { type: Number },
  condition: { type: String, enum: ['OK', 'NOT OK', 'For Repair', 'Unknown'], default: 'OK' },
  comments: { type: String, trim: true },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Hook', hookSchema);
