const Branch = require('../models/Branch');
const User = require('../models/User');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const Transaction = require('../models/Transaction');

// Moves records created before multi-branch support into one branch exactly once.
// New branches are unaffected and therefore remain completely fresh.
exports.assignLegacyAccountToBranch = async (user) => {
  if (user.branch || user.role === 'super_admin') return user;

  let branch = await Branch.findOne({ code: 'HEAD-OFFICE' });
  if (!branch) {
    branch = await Branch.create({
      name: 'Head Office',
      code: 'HEAD-OFFICE',
      createdBy: user._id,
    });
  }

  await Promise.all([
    Crane.updateMany({ branch: { $exists: false } }, { $set: { branch: branch._id } }),
    Counterweight.updateMany({ branch: { $exists: false } }, { $set: { branch: branch._id } }),
    BoomSection.updateMany({ branch: { $exists: false } }, { $set: { branch: branch._id } }),
    Hook.updateMany({ branch: { $exists: false } }, { $set: { branch: branch._id } }),
    Transaction.updateMany({ branch: { $exists: false } }, { $set: { branch: branch._id } }),
    User.updateMany({ branch: { $exists: false }, role: { $ne: 'super_admin' } }, { $set: { branch: branch._id } }),
  ]);

  return User.findById(user._id).select('-password');
};
