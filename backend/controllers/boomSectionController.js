const BoomSection = require('../models/BoomSection');
const AuditLog = require('../models/AuditLog');

exports.getBoomSections = async (req, res, next) => {
  try {
    const { search, assignedCrane, condition, status, page = 1, limit = 20 } = req.query;
    const query = { isArchived: false };
    if (assignedCrane) query.assignedCrane = assignedCrane;
    if (condition) query.condition = condition;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { boomCode: { $regex: search, $options: 'i' } },
        { assignedCrane: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await BoomSection.countDocuments(query);
    const items = await BoomSection.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

exports.getBoomSection = async (req, res, next) => {
  try {
    const item = await BoomSection.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.createBoomSection = async (req, res, next) => {
  try {
    const item = await BoomSection.create(req.body);
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'CREATE', module: 'BoomSection', targetId: item._id, details: `Created boom section ${item.itemName}` });
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.updateBoomSection = async (req, res, next) => {
  try {
    const item = await BoomSection.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'UPDATE', module: 'BoomSection', targetId: item._id, details: `Updated boom section ${item.itemName}` });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.deleteBoomSection = async (req, res, next) => {
  try {
    const item = await BoomSection.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Archived' });
  } catch (error) { next(error); }
};

exports.importBoomSections = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'CSV file is required' });
    }

    const { parseCSV } = require('../utils/csvParser');
    const fs = require('fs');
    
    const csvContent = fs.readFileSync(req.file.path, 'utf-8');
    const rows = parseCSV(csvContent);
    fs.unlinkSync(req.file.path);
    
    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row.itemName) throw new Error('itemName is required');
        
        // Delete any existing record (archived or active) with same itemName
        await BoomSection.deleteOne({ itemName: row.itemName });
        
        await BoomSection.create({ ...row, location: row.location || 'RAG YARD' });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    res.json({ success: true, data: results });
  } catch (error) { next(error); }
};
