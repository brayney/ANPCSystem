const mongoose = require('mongoose');

const craneSchema = new mongoose.Schema({
  equipmentNo: { type: String, required: true, trim: true },
  craneModel: { type: String, trim: true },
  yearModel: { type: String, trim: true },
  capacity: { type: String, trim: true },
  weightKg: { type: String, trim: true },
  location: { type: String, trim: true, default: 'RAG YARD' },
  client: { type: String, trim: true, default: '-' },
  status: {
    type: String,
    enum: ['Available', 'On Hire', 'Standby', 'Under Maintenance', 'Out of Yard', 'Reserved'],
    default: 'Available'
  },
  startingDate: { type: Date },
  releaseDate: { type: Date },
  supervisor: { type: String, trim: true },
  division: { type: String, trim: true },
  comments: { type: String, trim: true },
  image: { type: String },
  isArchived: { type: Boolean, default: false },
  qrCode: { type: String },
}, { timestamps: true });

craneSchema.virtual('counterweights', {
  ref: 'Counterweight',
  localField: 'equipmentNo',
  foreignField: 'assignedCrane',
});
craneSchema.virtual('boomSections', {
  ref: 'BoomSection',
  localField: 'equipmentNo',
  foreignField: 'assignedCrane',
});
craneSchema.virtual('hooks', {
  ref: 'Hook',
  localField: 'equipmentNo',
  foreignField: 'assignedCrane',
});

craneSchema.set('toObject', { virtuals: true });
craneSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Crane', craneSchema);
