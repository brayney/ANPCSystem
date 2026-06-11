const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

exports.getDashboard = async (req, res, next) => {
  try {
    const [
      totalCranes, totalCounterweights, totalBoomSections, totalHooks,
      activeRentals, availableCranes, maintenanceCranes,
      recentTransactions, recentLogs,
      craneStatusDist, transactionsByMonth
    ] = await Promise.all([
      Crane.countDocuments({ isArchived: false }),
      Counterweight.countDocuments({ isArchived: false }),
      BoomSection.countDocuments({ isArchived: false }),
      Hook.countDocuments({ isArchived: false }),
      Transaction.countDocuments({ status: 'Active', isArchived: false }),
      Crane.countDocuments({ status: 'Available', isArchived: false }),
      Crane.countDocuments({ status: 'Under Maintenance', isArchived: false }),
      Transaction.find({ isArchived: false }).sort({ createdAt: -1 }).limit(5)
        .populate('createdBy', 'name'),
      AuditLog.find().sort({ createdAt: -1 }).limit(10),
      Crane.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { isArchived: false, createdAt: { $gte: new Date(Date.now() - 180 * 24 * 3600 * 1000) } } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } }
      ])
    ]);

    res.json({
      success: true,
      data: {
        summary: { totalCranes, totalCounterweights, totalBoomSections, totalHooks, activeRentals, availableCranes, maintenanceCranes },
        recentTransactions,
        recentLogs,
        charts: { craneStatusDist, transactionsByMonth }
      }
    });
  } catch (error) { next(error); }
};
