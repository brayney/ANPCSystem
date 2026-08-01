const mongoose = require('mongoose');

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, unique: true },
  code: { type: String, required: true, trim: true, uppercase: true, unique: true },
  address: { type: String, trim: true },
  country: { type: String, trim: true },
  region: { type: String, trim: true },
  province: { type: String, trim: true },
  city: { type: String, trim: true },
  streetAddress: { type: String, trim: true },
  latitude: { type: Number, min: -90, max: 90 },
  longitude: { type: Number, min: -180, max: 180 },
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

module.exports = mongoose.model('Branch', branchSchema);
