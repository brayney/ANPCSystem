const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');

exports.getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCranes, totalCounterweights, totalBoomSections, totalHooks,
      activeRentals, availableCranes, maintenanceCranes, retiredCranes,
      recentTransactions, recentLogs,
      craneStatusDist, transactionsByMonth,
      thisMonthTransactions, lastMonthTransactions,
      pendingReturnsTxns, overdueTxns,
      totalRevenue, monthRevenue
    ] = await Promise.all([
      Crane.countDocuments({ isArchived: false }),
      Counterweight.countDocuments({ isArchived: false }),
      BoomSection.countDocuments({ isArchived: false }),
      Hook.countDocuments({ isArchived: false }),
      Transaction.countDocuments({ status: 'Active', isArchived: false }),
      Crane.countDocuments({ status: 'Available', isArchived: false }),
      Crane.countDocuments({ status: 'Under Maintenance', isArchived: false }),
      Crane.countDocuments({ status: 'Retired', isArchived: false }),
      Transaction.find({ isArchived: false }).sort({ createdAt: -1 }).limit(8)
        .populate('createdBy', 'name')
        .lean(),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).lean(),
      Crane.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Transaction.aggregate([
        { $match: { isArchived: false, createdAt: { $gte: sixMonthsAgo } } },
        { $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } },
        { $sort: { '_id': 1 } }
      ]),
      Transaction.countDocuments({ createdAt: { $gte: thisMonthStart }, isArchived: false }),
      Transaction.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart }, isArchived: false }),
      Transaction.countDocuments({ status: 'Active', returnDate: { $exists: false, $eq: null }, isArchived: false }),
      Transaction.countDocuments({ status: 'Active', returnDate: { $lt: now }, isArchived: false }),
      Transaction.aggregate([
        { $match: { isArchived: false } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$rentalDays', '$dailyRate'] } } } }
      ]),
      Transaction.aggregate([
        { $match: { createdAt: { $gte: thisMonthStart }, isArchived: false } },
        { $group: { _id: null, total: { $sum: { $multiply: ['$rentalDays', '$dailyRate'] } } } }
      ])
    ]);

    const utilizationRate = totalCranes > 0 ? ((activeRentals / totalCranes) * 100).toFixed(1) : 0;
    const prevMonthTxns = lastMonthTransactions || 1;
    const txnGrowth = ((thisMonthTransactions - prevMonthTxns) / prevMonthTxns * 100).toFixed(1);

    res.json({
      success: true,
      data: {
        summary: {
          totalCranes, totalCounterweights, totalBoomSections, totalHooks,
          activeRentals, availableCranes, maintenanceCranes, retiredCranes,
          utilizationRate: parseFloat(utilizationRate),
          pendingReturns: pendingReturnsTxns,
          overdueRentals: overdueTxns,
          monthlyTransactions: thisMonthTransactions,
          monthlyGrowth: parseFloat(txnGrowth),
          totalRevenue: totalRevenue?.[0]?.total || 0,
          monthRevenue: monthRevenue?.[0]?.total || 0
        },
        recentTransactions,
        recentLogs,
        charts: { craneStatusDist, transactionsByMonth }
      }
    });
  } catch (error) { next(error); }
};
