const Counterweight = require('../models/Counterweight');
const AuditLog = require('../models/AuditLog');

exports.getCounterweights = async (req, res, next) => {
  try {
    const { search, assignedCrane, condition, status, page = 1, limit = 20 } = req.query;
    const query = { isArchived: false };
    if (assignedCrane) query.assignedCrane = assignedCrane;
    if (condition) query.condition = condition;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { itemName: { $regex: search, $options: 'i' } },
        { serialNo: { $regex: search, $options: 'i' } },
        { assignedCrane: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Counterweight.countDocuments(query);
    const items = await Counterweight.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    res.json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

exports.getCounterweight = async (req, res, next) => {
  try {
    const item = await Counterweight.findById(req.params.id);
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.createCounterweight = async (req, res, next) => {
  try {
    const item = await Counterweight.create(req.body);
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'CREATE', module: 'Counterweight', targetId: item._id, details: `Created counterweight ${item.itemName}` });
    res.status(201).json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.updateCounterweight = async (req, res, next) => {
  try {
    const item = await Counterweight.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'UPDATE', module: 'Counterweight', targetId: item._id, details: `Updated counterweight ${item.itemName}` });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.deleteCounterweight = async (req, res, next) => {
  try {
    const item = await Counterweight.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Archived' });
  } catch (error) { next(error); }
};

exports.importCounterweights = async (req, res, next) => {
  try {
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
        
        // Skip if no itemName (completely empty row)
        if (!row.itemName || !String(row.itemName).trim()) {
          throw new Error('itemName is required');
        }
        
        // Delete any existing record (archived or active) with same itemName
        await Counterweight.deleteOne({ itemName: row.itemName });
        
        await Counterweight.create({ 
          ...row, 
          location: row.location || 'RAG YARD', 
          client: row.client || '-' 
        });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    console.log(`✅ Import complete - Success: ${results.success}, Failed: ${results.failed}, Total: ${rows.length}`);
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
};
