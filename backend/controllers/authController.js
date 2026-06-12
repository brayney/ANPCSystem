const jwt = require('jsonwebtoken');
const User = require('../models/User');

const LOGIN_TIERS = {
  standard: { attempts: 5, lockMs: 60 * 1000, nextStage: 'reduced' },
  reduced: { attempts: 3, lockMs: 60 * 60 * 1000, nextStage: 'standard' },
};

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

const getLoginStage = (user) => user.loginStage || 'standard';
const resetLoginState = (user, stage = 'standard') => {
  user.loginStage = stage;
  user.loginAttempts = LOGIN_TIERS[stage].attempts;
  user.lockedUntil = null;
};

const PRIMARY_ADMIN_EMAIL = (process.env.PRIMARY_ADMIN_EMAIL || 'admin@anpc.com').toLowerCase();

// POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: 'Email and password required' });

    const normalizedEmail = email.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user)
      return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const stage = getLoginStage(user);
    const now = new Date();

    if (user.lockedUntil && user.lockedUntil > now) {
      return res.status(403).json({
        success: false,
        message: 'Account locked. Try again later.',
        attemptsRemaining: user.loginAttempts,
        lockUntil: user.lockedUntil,
      });
    }

    if (user.lockedUntil && user.lockedUntil <= now) {
      user.lockedUntil = null;
      if (!user.loginStage) user.loginStage = 'standard';
      if (user.loginAttempts <= 0) {
        user.loginAttempts = LOGIN_TIERS[user.loginStage].attempts;
      }
      await user.save({ validateBeforeSave: false });
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      user.loginAttempts -= 1;
      if (user.loginAttempts <= 0) {
        const tier = LOGIN_TIERS[stage];
        const nextStage = tier.nextStage;
        user.loginStage = nextStage;
        user.loginAttempts = LOGIN_TIERS[nextStage].attempts;
        user.lockedUntil = new Date(Date.now() + tier.lockMs);
      }
      await user.save({ validateBeforeSave: false });
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        attemptsRemaining: user.loginAttempts,
        lockUntil: user.lockedUntil,
      });
    }

    if (!user.isActive)
      return res.status(401).json({ success: false, message: 'Account deactivated' });

    user.lastLogin = new Date();
    user.isLoggedIn = true;
    resetLoginState(user, 'standard');
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, token: generateToken(user._id), user });
  } catch (error) { next(error); }
};

// POST /api/auth/logout
exports.logout = async (req, res, next) => {
  try {
    if (!req.user) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.isLoggedIn = false;
    resetLoginState(user, 'standard');
    await user.save({ validateBeforeSave: false });

    res.json({ success: true, message: 'Logged out' });
  } catch (error) { next(error); }
};

// GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    res.json({ success: true, user: req.user });
  } catch (error) { next(error); }
};

// GET /api/auth/users (admin only)
exports.getUsers = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required to review accounts' });
    }

    const users = await User.find()
      .select('-password')
      .sort({ createdAt: -1 });

    res.json({ success: true, users });
  } catch (error) { next(error); }
};

// GET /api/auth/attempts?email=...
exports.getAttemptState = async (req, res, next) => {
  try {
    const { email } = req.query;
    if (!email) return res.json({ success: true, attemptsRemaining: null, lockUntil: null });
    const normalized = email.toLowerCase();
    const user = await User.findOne({ email: normalized });
    if (!user) return res.json({ success: true, attemptsRemaining: null, lockUntil: null });

    const now = new Date();
    if (user.lockedUntil && user.lockedUntil <= now) {
      user.lockedUntil = null;
      if (user.loginAttempts <= 0) user.loginAttempts = LOGIN_TIERS[user.loginStage || 'standard'].attempts;
      await user.save({ validateBeforeSave: false });
    }

    res.json({ success: true, attemptsRemaining: user.loginAttempts, lockUntil: user.lockedUntil });
  } catch (error) { next(error); }
};

// DELETE /api/auth/users/:id (admin only)
exports.deleteUser = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Administrator access required to delete accounts' });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Primary admin account cannot delete itself' });
    }

    const account = await User.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'Primary admin account cannot be deleted' });
    }

    await account.deleteOne();
    res.json({ success: true, message: 'Account deleted' });
  } catch (error) { next(error); }
};

// POST /api/auth/register (admin only)
exports.register = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required to create users' });
    }

    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }

    const exists = await User.findOne({ email });
    if (exists)
      return res.status(400).json({ success: false, message: 'Email already registered' });

    const user = await User.create({ name, email, password, role: 'manager' });
    res.status(201).json({ success: true, user });
  } catch (error) { next(error); }
};

// PUT /api/auth/update-password
exports.updatePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id);
    if (!(await user.comparePassword(currentPassword)))
      return res.status(401).json({ success: false, message: 'Current password incorrect' });
    user.password = newPassword;
    await user.save();
    res.json({ success: true, message: 'Password updated' });
  } catch (error) { next(error); }
};

// PUT /api/auth/users/:id/toggle-status (admin only)
exports.toggleUserStatus = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    if (req.user._id.toString() === req.params.id) {
      return res.status(400).json({ success: false, message: 'Cannot change your own account status' });
    }

    const account = await User.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    if (account.email?.toLowerCase() === PRIMARY_ADMIN_EMAIL) {
      return res.status(400).json({ success: false, message: 'Primary admin account status cannot be changed' });
    }

    account.isActive = !account.isActive;
    await account.save({ validateBeforeSave: false });

    res.json({ 
      success: true, 
      message: account.isActive ? 'Account activated' : 'Account deactivated', 
      user: account 
    });
  } catch (error) { next(error); }
};
