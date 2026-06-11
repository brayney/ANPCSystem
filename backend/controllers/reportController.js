const Transaction = require('../models/Transaction');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');

exports.getRentalHistory = async (req, res, next) => {
  try {
    const { startDate, endDate, crane, company } = req.query;
    const query = { isArchived: false };
    if (crane) query.crane = crane;
    if (company) query.companyName = { $regex: company, $options: 'i' };
    if (startDate || endDate) {
      query.transactionDate = {};
      if (startDate) query.transactionDate.$gte = new Date(startDate);
      if (endDate) query.transactionDate.$lte = new Date(endDate);
    }
    const items = await Transaction.find(query)
      .populate('counterweights', 'itemName')
      .populate('boomSections', 'itemName')
      .populate('hooks', 'itemName')
      .sort({ transactionDate: -1 });
    res.json({ success: true, data: items, total: items.length });
  } catch (error) { next(error); }
};

exports.getInventoryReport = async (req, res, next) => {
  try {
    const [cranes, counterweights, boomSections, hooks] = await Promise.all([
      Crane.find({ isArchived: false }),
      Counterweight.find({ isArchived: false }),
      BoomSection.find({ isArchived: false }),
      Hook.find({ isArchived: false }),
    ]);
    res.json({ success: true, data: { cranes, counterweights, boomSections, hooks } });
  } catch (error) { next(error); }
};

exports.getCraneUtilization = async (req, res, next) => {
  try {
    const utilization = await Transaction.aggregate([
      { $match: { isArchived: false } },
      { $group: { _id: '$crane', totalRentals: { $sum: 1 }, companies: { $addToSet: '$companyName' } } },
      { $sort: { totalRentals: -1 } },
      { $limit: 20 }
    ]);
    res.json({ success: true, data: utilization });
  } catch (error) { next(error); }
};
