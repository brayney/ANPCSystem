const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  // Company-level administrators manage branches; all other accounts belong to a branch.
  role: { type: String, enum: ['super_admin', 'admin', 'manager', 'viewer'], default: 'viewer' },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch', default: null, index: true },
  language: { type: String, enum: ['en', 'es', 'fr', 'de', 'pt', 'ar', 'zh', 'ja'], default: 'en' },
  isActive: { type: Boolean, default: true },
  isLoggedIn: { type: Boolean, default: false },
  lastLogin: { type: Date },
  loginAttempts: { type: Number, default: 5 },
  loginStage: { type: String, enum: ['standard', 'reduced'], default: 'standard' },
  lockedUntil: { type: Date },
  avatar: {
    cloudinaryPublicId: { type: String },
    cloudinaryUrl: { type: String },
    fileName: { type: String },
  },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
