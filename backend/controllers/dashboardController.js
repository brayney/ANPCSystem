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
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalCranes, totalCounterweights, totalBoomSections, totalHooks,
      activeRentals, availableCranes, maintenanceCranes,
      recentTransactions, recentLogs,
      craneStatusDist, transactionsByMonth, weeklyJobActivity,
      thisMonthTransactions, lastMonthTransactions,
      pendingReturnsTxns, avgRentalDurationResult
    ] = await Promise.all([
      Crane.countDocuments({ isArchived: false }),
      Counterweight.countDocuments({ isArchived: false }),
      BoomSection.countDocuments({ isArchived: false }),
      Hook.countDocuments({ isArchived: false }),
      Transaction.countDocuments({ status: 'Active', isArchived: false }),
      Crane.countDocuments({ status: 'Available', isArchived: false }),
      Crane.countDocuments({ status: 'Under Maintenance', isArchived: false }),
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
      Transaction.aggregate([
        { $match: { isArchived: false, transactionDate: { $gte: oneWeekAgo } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$transactionDate'
              }
            },
            jobs: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      Transaction.countDocuments({ createdAt: { $gte: thisMonthStart }, isArchived: false }),
      Transaction.countDocuments({ createdAt: { $gte: lastMonthStart, $lt: thisMonthStart }, isArchived: false }),
      Transaction.countDocuments({ status: 'Active', expectedReturnDate: { $lt: now }, isArchived: false }),
      Transaction.aggregate([
        {
          $match: {
            isArchived: false,
            returnDate: { $exists: true }
          }
        },
        {
          $project: {
            durationDays: {
              $divide: [
                { $subtract: ['$returnDate', '$transactionDate'] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$durationDays' }
          }
        }
      ])
    ]);

    const utilizationRate = totalCranes > 0 ? ((activeRentals / totalCranes) * 100).toFixed(1) : 0;
    const prevMonthTxns = lastMonthTransactions || 1;
    const txnGrowth = ((thisMonthTransactions - prevMonthTxns) / prevMonthTxns * 100).toFixed(1);
    const operationalCranes = (availableCranes || 0) + (activeRentals || 0);
    const underMaintenanceCranes = maintenanceCranes || 0;
    const totalAssets = (totalCranes || 0) + (totalCounterweights || 0) + (totalBoomSections || 0) + (totalHooks || 0);
    const avgRentalDuration = avgRentalDurationResult?.[0]?.avgDuration || 0;
    
    const kpiTiles = [
      { label: 'Avg Rental Duration', value: Math.round(avgRentalDuration), unit: 'days', color: '#1f6feb' },
      { label: 'Utilization Rate', value: parseFloat(utilizationRate), unit: '%', color: '#1a7f37' },
      { label: 'Under Maintenance', value: underMaintenanceCranes, unit: 'units', color: '#9a6700' },
      { label: 'Assets Tracked', value: totalAssets, unit: 'total', color: '#6e40c9' }
    ];
    
    const fleetHealthBreakdown = [

      { name: 'Operational', value: operationalCranes, color: '#1a7f37' },
      { name: 'Under Maintenance', value: underMaintenanceCranes, color: '#9a6700' }
    ];

    const weeklyActivity = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      const match = (weeklyJobActivity || []).find(item => item._id === key);
      return {
        day: date.toLocaleDateString('en', { weekday: 'short' }),
        jobs: match?.jobs || 0
      };
    });
    const maxJobs = Math.max(...weeklyActivity.map(a => a.jobs), 1);
    const peakDayIndex = weeklyActivity.findIndex(a => a.jobs === maxJobs);

    const filteredRecentLogs = (recentLogs || []).filter(log => {
      const detail = (log.details || '').trim();
      return !(
        detail.includes('Deleted transaction ANPC-TXN-00001-2026') ||
        detail.includes('Transaction ANPC-TXN-00001-2026 for Bryne Corp.')
      );
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalCranes, totalCounterweights, totalBoomSections, totalHooks,
          activeRentals, availableCranes, maintenanceCranes,
          utilizationRate: parseFloat(utilizationRate),
          pendingReturns: pendingReturnsTxns,
          monthlyTransactions: thisMonthTransactions,
          monthlyGrowth: parseFloat(txnGrowth)
        },
        recentTransactions,
        recentLogs: filteredRecentLogs,
        charts: {
          craneStatusDist,
          transactionsByMonth,
          fleetHealthBreakdown,
          weeklyJobActivity: weeklyActivity,
          peakDayIndex,
          kpiTiles
        }
      }
    });
  } catch (error) { next(error); }
};
