const Hook = require('../models/Hook');
const AuditLog = require('../models/AuditLog');

exports.getHooks = async (req, res, next) => {
  try {
    const { search, assignedCrane, condition, status, page = 1, limit = 20 } = req.query;
    const query = { isArchived: false };
    if (assignedCrane) query.assignedCrane = assignedCrane;
    if (condition) query.condition = condition;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { hookSerialNo: { $regex: search, $options: 'i' } },
        { assignedCrane: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Hook.countDocuments(query);
    const items = await Hook.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

exports.getHook = async (req, res, next) => {
  try {
    const item = await Hook.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.createHook = async (req, res, next) => {
  try {
    const item = await Hook.create(req.body);
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'CREATE', module: 'Hook', targetId: item._id, details: `Created hook ${item.itemName}` });
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.updateHook = async (req, res, next) => {
  try {
    const item = await Hook.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'UPDATE', module: 'Hook', targetId: item._id, details: `Updated hook ${item.itemName}` });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.deleteHook = async (req, res, next) => {
  try {
    const item = await Hook.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Archived' });
  } catch (error) { next(error); }
};

exports.importHooks = async (req, res, next) => {
  try {
    console.log('📖 Hook import received');
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Import file is required' });
    }

    const { parseImportFile } = require('../utils/importParser');
    const fs = require('fs');
    
    const rows = parseImportFile(req.file.path, req.file.originalname);
    fs.unlinkSync(req.file.path);
    
    console.log(`📦 Total rows parsed: ${rows.length}`);
    
    const results = { success: 0, failed: 0, errors: [], totalRows: rows.length };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row.itemName || !String(row.itemName).trim()) throw new Error('itemName is required');
        
        await Hook.create({ ...row, location: row.location || 'RAG YARD', client: row.client || '-' });
        results.success++;
      } catch (err) {
        results.failed++;
        if (results.errors.length < 10) {
          results.errors.push(`Row ${i + 2}: ${err.message}`);
        }
      }
    }

    console.log(`✅ Import complete - Success: ${results.success}, Failed: ${results.failed}, Total: ${rows.length}`);
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
};
