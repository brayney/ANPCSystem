const Branch = require('../models/Branch');
const User = require('../models/User');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const Transaction = require('../models/Transaction');

const geocodeAddress = async (address) => {
  const response = await fetch(`https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=${encodeURIComponent(address)}`, { headers: { 'User-Agent': 'ANPC-Yard-Branch-Map/1.0' } });
  if (!response.ok) throw new Error('Location lookup failed');
  const [location] = await response.json();
  if (!location) throw new Error('Location was not found on the map');
  return { latitude: Number(location.lat), longitude: Number(location.lon) };
};

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

exports.geocodeMissingBranches = async (req, res, next) => {
  try {
    const branches = await Branch.find({
      $or: [
        { latitude: { $exists: false } },
        { longitude: { $exists: false } },
        { latitude: null },
        { longitude: null },
      ],
    });
    let updated = 0;
    let skipped = 0;

    for (const branch of branches) {
      const address = branch.address || [branch.city, branch.province, branch.region, branch.country].filter(Boolean).join(', ');
      if (!address) {
        skipped += 1;
        continue;
      }

      try {
        const coordinates = await geocodeAddress(address);
        branch.address = address;
        branch.latitude = coordinates.latitude;
        branch.longitude = coordinates.longitude;
        await branch.save();
        updated += 1;
      } catch {
        skipped += 1;
      }
    }

    res.json({ success: true, updated, skipped, message: `${updated} branch location${updated === 1 ? '' : 's'} updated` });
  } catch (error) { next(error); }
};

exports.createBranchAdmin = async (req, res, next) => {
  try {
    const { branchName, branchCode, country, region, province, city, name, email, password } = req.body;
    if (![branchName, branchCode, country, region, city, name, email, password].every(Boolean)) {
      return res.status(400).json({ success: false, message: 'Complete branch address and administrator details are required' });
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

    const address = [city, province, region, country].filter(Boolean).map(value => value.trim()).join(', ');
    let coordinates;
    try { coordinates = await geocodeAddress(address); } catch (error) { return res.status(400).json({ success: false, message: error.message || 'Unable to locate the branch address' }); }
    const branch = await Branch.create({ name: branchName.trim(), code, address, country: country.trim(), region: region.trim(), province: province?.trim(), city: city.trim(), ...coordinates, createdBy: req.user._id });
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
    const { name, code, country, region, province, city } = req.body;
    if (![name, code, country, region, city].every(Boolean)) return res.status(400).json({ success: false, message: 'Complete branch details and address are required' });
    const normalizedCode = code.trim().toUpperCase();
    const duplicate = await Branch.findOne({ _id: { $ne: req.params.id }, $or: [{ name: name.trim() }, { code: normalizedCode }] });
    if (duplicate) return res.status(400).json({ success: false, message: 'That branch name or code already exists' });
    const address = [city, province, region, country].filter(Boolean).map(value => value.trim()).join(', ');
    let coordinates;
    try { coordinates = await geocodeAddress(address); } catch (error) { return res.status(400).json({ success: false, message: error.message || 'Unable to locate the branch address' }); }
    const branch = await Branch.findByIdAndUpdate(req.params.id, { name: name.trim(), code: normalizedCode, address, country: country.trim(), region: region.trim(), province: province?.trim(), city: city.trim(), ...coordinates }, { new: true, runValidators: true });
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });
    res.json({ success: true, branch, message: 'Branch details updated' });
  } catch (error) { next(error); }
};

exports.deleteBranch = async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    if (!branch) return res.status(404).json({ success: false, message: 'Branch not found' });

    const [users, cranes, counterweights, boomSections, hooks, transactions] = await Promise.all([
      User.countDocuments({ branch: branch._id }), Crane.countDocuments({ branch: branch._id }),
      Counterweight.countDocuments({ branch: branch._id }), BoomSection.countDocuments({ branch: branch._id }),
      Hook.countDocuments({ branch: branch._id }), Transaction.countDocuments({ branch: branch._id }),
    ]);
    if (users + cranes + counterweights + boomSections + hooks + transactions > 0) {
      return res.status(400).json({ success: false, message: 'A branch with accounts or operational records cannot be deleted. Deactivate it instead.' });
    }

    await branch.deleteOne();
    res.json({ success: true, message: 'Branch deleted' });
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
