const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  transactionNo: { type: String, unique: true },
  type: { type: String, enum: ['Rental', 'Transfer', 'Return', 'Maintenance'], default: 'Rental' },

  // Crane & Attachments
  crane: { type: String, required: true },
  craneModel: { type: String },
  capacity: { type: String },
  weightKg: { type: String },
  counterweights: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Counterweight' }],
  boomSections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BoomSection' }],
  hooks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Hook' }],

  // Company Information
  companyName: { type: String, required: true, trim: true },
  companyAddress: { type: String, trim: true },
  contactPerson: { type: String, trim: true },
  contactNumber: { type: String, trim: true },

  // Driver & Vehicle
  driverName: { type: String, trim: true },
  vehicleType: { type: String, trim: true },
  vehiclePlateNo: { type: String, trim: true },

  // Location & Dates
  pullOutLocation: { type: String, trim: true },
  deliveryLocation: { type: String, trim: true },
  transactionDate: { type: Date, default: Date.now },
  transactionTime: { type: String },
  expectedReturnDate: { type: Date },
  actualReturnDate: { type: Date },

  // Other
  purpose: { type: String, trim: true },
  remarks: { type: String, trim: true },
  status: { type: String, enum: ['Active', 'Returned', 'Overdue', 'Cancelled'], default: 'Active' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived: { type: Boolean, default: false },
}, { timestamps: true });

transactionSchema.pre('save', async function (next) {
  if (!this.transactionNo) {
    const count = await mongoose.model('Transaction').countDocuments();
    const pad = String(count + 1).padStart(5, '0');
    this.transactionNo = `ANPC-TXN-${pad}-${new Date().getFullYear()}`;
  }
  next();
});

module.exports = mongoose.model('Transaction', transactionSchema);
