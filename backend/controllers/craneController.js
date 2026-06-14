const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const AuditLog = require('../models/AuditLog');

const sharedAttachmentQuery = (equipmentNo) => ({
  isArchived: false,
  $or: [
    { assignedCrane: equipmentNo },
    { assignedCrane: '' },
    { assignedCrane: null },
    { assignedCrane: { $exists: false } },
  ],
});

// GET /api/cranes
exports.getCranes = async (req, res, next) => {
  try {
    const { search, status, page = 1, limit = 20 } = req.query;
    const query = { isArchived: false };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { equipmentNo: { $regex: search, $options: 'i' } },
        { craneModel: { $regex: search, $options: 'i' } },
        { client: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Crane.countDocuments(query);
    const cranes = await Crane.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: cranes, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

// GET /api/cranes/:id
exports.getCrane = async (req, res, next) => {
  try {
    const crane = await Crane.findById(req.params.id)
      .populate('counterweights')
      .populate('boomSections')
      .populate('hooks');
    if (!crane) return res.status(404).json({ success: false, message: 'Crane not found' });

    if (req.query.includeShared === 'true') {
      const [counterweights, boomSections, hooks] = await Promise.all([
        Counterweight.find(sharedAttachmentQuery(crane.equipmentNo)),
        BoomSection.find(sharedAttachmentQuery(crane.equipmentNo)),
        Hook.find(sharedAttachmentQuery(crane.equipmentNo)),
      ]);

      return res.json({ success: true, data: { ...crane.toJSON(), counterweights, boomSections, hooks } });
    }

    res.json({ success: true, data: crane });
  } catch (error) { next(error); }
};

// GET /api/cranes/by-equipment/:equipmentNo
exports.getCraneByEquipmentNo = async (req, res, next) => {
  try {
    const crane = await Crane.findOne({ equipmentNo: req.params.equipmentNo, isArchived: false });
    if (!crane) return res.status(404).json({ success: false, message: 'Crane not found' });

    const [counterweights, boomSections, hooks] = await Promise.all([
      Counterweight.find(sharedAttachmentQuery(crane.equipmentNo)),
      BoomSection.find(sharedAttachmentQuery(crane.equipmentNo)),
      Hook.find(sharedAttachmentQuery(crane.equipmentNo)),
    ]);

    res.json({ success: true, data: { ...crane.toJSON(), counterweights, boomSections, hooks } });
  } catch (error) { next(error); }
};

// POST /api/cranes
exports.createCrane = async (req, res, next) => {
  try {
    const crane = await Crane.create(req.body);
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'CREATE', module: 'Crane', targetId: crane.equipmentNo, details: `Created crane ${crane.equipmentNo}` });
    res.status(201).json({ success: true, data: crane });
  } catch (error) { next(error); }
};

// PUT /api/cranes/:id
exports.updateCrane = async (req, res, next) => {
  try {
    const crane = await Crane.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!crane) return res.status(404).json({ success: false, message: 'Crane not found' });
    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'UPDATE', module: 'Crane', targetId: crane.equipmentNo, details: `Updated crane ${crane.equipmentNo}` });
    res.json({ success: true, data: crane });
  } catch (error) { next(error); }
};

// DELETE /api/cranes/:id (soft delete)
exports.deleteCrane = async (req, res, next) => {
  try {
    const crane = await Crane.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
    if (!crane) return res.status(404).json({ success: false, message: 'Crane not found' });
    res.json({ success: true, message: 'Crane archived' });
  } catch (error) { next(error); }
};

// GET /api/cranes/:equipmentNo/attachments
exports.getCraneAttachments = async (req, res, next) => {
  try {
    const { equipmentNo } = req.params;
    const [counterweights, boomSections, hooks] = await Promise.all([
      Counterweight.find(sharedAttachmentQuery(equipmentNo)),
      BoomSection.find(sharedAttachmentQuery(equipmentNo)),
      Hook.find(sharedAttachmentQuery(equipmentNo)),
    ]);
    res.json({ success: true, data: { counterweights, boomSections, hooks } });
  } catch (error) { next(error); }
};

exports.importCranes = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Import file is required' });
    }

    const { parseImportFile } = require('../utils/importParser');
    const fs = require('fs');
    
    const rows = parseImportFile(req.file.path, req.file.originalname);
    fs.unlinkSync(req.file.path);
    
    const results = { success: 0, failed: 0, errors: [] };

    for (let i = 0; i < rows.length; i++) {
      try {
        const row = rows[i];
        if (!row.equipmentNo) throw new Error('equipmentNo is required');
        
        await Crane.create({ ...row, location: row.location || 'RAG YARD', client: row.client || '-' });
        results.success++;
      } catch (err) {
        results.failed++;
        results.errors.push(`Row ${i + 2}: ${err.message}`);
      }
    }

    console.log('📊 Import results:', results);
    res.json({ success: true, data: results });
  } catch (error) { 
    console.error('💥 Import error:', error.message);
    next(error); 
  }
};
