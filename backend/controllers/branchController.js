const Branch = require('../models/Branch');
const User = require('../models/User');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const Transaction = require('../models/Transaction');

exports.getBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find().sort({ name: 1 }).populate('createdBy', 'name email');
    const branchIds = branches.map(branch => branch._id);
    const counts = await User.aggregate([
      { $match: { branch: { $in: branchIds } } },
      { $group: { _id: '$branch', accounts: { $sum: 1 } } },
    ]);
    const byBranch = new Map(counts.map(item => [item._id.toString(), item.accounts]));
    res.json({ success: true, branches: branches.map(branch => ({ ...branch.toJSON(), accountCount: byBranch.get(branch._id.toString()) || 0 })) });
  } catch (error) { next(error); }
};

exports.createBranchAdmin = async (req, res, next) => {
  try {
    const { branchName, branchCode, branchAddress, name, email, password } = req.body;
    if (![branchName, branchCode, name, email, password].every(Boolean)) {
      return res.status(400).json({ success: false, message: 'Branch name, branch code, administrator name, email, and password are required' });
    }
    if (password.length < 6) return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
    const normalizedEmail = email.toLowerCase().trim();
    const code = branchCode.trim().toUpperCase();
    const [existingBranch, existingUser] = await Promise.all([
      Branch.findOne({ $or: [{ name: branchName.trim() }, { code }] }),
      User.findOne({ email: normalizedEmail }),
    ]);
    if (existingBranch) return res.status(400).json({ success: false, message: 'That branch name or code already exists' });
    if (existingUser) return res.status(400).json({ success: false, message: 'Email already registered' });

    const branch = await Branch.create({ name: branchName.trim(), code, address: branchAddress?.trim(), createdBy: req.user._id });
    const user = await User.create({ name: name.trim(), email: normalizedEmail, password, role: 'admin', branch: branch._id });
    res.status(201).json({ success: true, branch, user, message: 'Branch and its independent administrator account created' });
  } catch (error) { next(error); }
};

exports.toggleBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    branch.isActive = !branch.isActive;
    await branch.save();
    await User.updateMany({ branch: branch._id }, { $set: { isActive: branch.isActive } });
    res.json({ success: true, branch, message: branch.isActive ? 'Branch activated' : 'Branch and its accounts deactivated' });
  } catch (error) { next(error); }
};

exports.updateBranch = async (req, res, next) => {
  try {
    const { name, code, address } = req.body;
    if (!name || !code) return res.status(400).json({ success: false, message: 'Branch name and code are required' });
    const normalizedCode = code.trim().toUpperCase();
    const duplicate = await Branch.findOne({ _id: { $ne: req.params.id }, $or: [{ name: name.trim() }, { code: normalizedCode }] });
    if (duplicate) return res.status(400).json({ success: false, message: 'That branch name or code already exists' });
    const branch = await Branch.findByIdAndUpdate(req.params.id, { name: name.trim(), code: normalizedCode, address: address?.trim() }, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, branch, message: 'Branch details updated' });
  } catch (error) { next(error); }
};

exports.getBranchSummary = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    const scope = { branch: branch._id, isArchived: false };
    const [cranes, counterweights, boomSections, hooks, activeTransactions, completedTransactions, recentTransactions, statusBreakdown, users] = await Promise.all([
      Crane.countDocuments(scope), Counterweight.countDocuments(scope), BoomSection.countDocuments(scope), Hook.countDocuments(scope),
      Transaction.countDocuments({ ...scope, status: 'Active' }),
      Transaction.countDocuments({ ...scope, status: { $in: ['Returned', 'Cancelled'] } }),
      Transaction.find(scope).sort({ createdAt: -1 }).limit(8).select('transactionNo companyName crane type status transactionDate expectedReturnDate').lean(),
      Transaction.aggregate([{ $match: scope }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
      User.find({ branch: branch._id }).select('name email role isActive lastLogin').sort({ role: 1, name: 1 }).lean(),
    ]);
    res.json({ success: true, data: { branch, summary: { cranes, counterweights, boomSections, hooks, activeTransactions, completedTransactions }, statusBreakdown, recentTransactions, users } });
  } catch (error) { next(error); }
};
