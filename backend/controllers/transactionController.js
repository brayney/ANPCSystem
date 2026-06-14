const Transaction = require('../models/Transaction');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const AuditLog = require('../models/AuditLog');
const mongoose = require('mongoose');

const craneLookup = (txn) => {
  if (txn.craneId && mongoose.Types.ObjectId.isValid(txn.craneId)) {
    return { _id: txn.craneId };
  }
  return { equipmentNo: txn.crane };
};

const craneIdsFromTransaction = (txn) => {
  const ids = [];
  if (txn.craneId && mongoose.Types.ObjectId.isValid(txn.craneId)) ids.push(txn.craneId);
  if (Array.isArray(txn.cranes)) {
    txn.cranes.forEach(item => {
      if (item.craneId && mongoose.Types.ObjectId.isValid(item.craneId)) ids.push(item.craneId);
    });
  }
  return [...new Set(ids.map(id => String(id)))];
};

const craneUpdateQuery = (txn) => {
  const ids = craneIdsFromTransaction(txn);
  if (ids.length > 0) return { _id: { $in: ids } };
  return craneLookup(txn);
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { search, status, type, page = 1, limit = 20 } = req.query;
    const query = { isArchived: false };
    if (status) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$or = [
        { transactionNo: { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { crane: { $regex: search, $options: 'i' } },
        { 'cranes.equipmentNo': { $regex: search, $options: 'i' } },
      ];
    }
    const total = await Transaction.countDocuments(query);
    const items = await Transaction.find(query)
      .populate('counterweights', 'itemName serialNo weightKg capacity')
      .populate('boomSections', 'itemName boomCode length')
      .populate('hooks', 'itemName hookSerialNo capacity')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));
    
    // Fetch crane details for items missing capacity/weight
    const craneEquipmentNos = items
      .filter(item => !item.capacity || !item.weightKg)
      .map(item => item.crane);
    
    if (craneEquipmentNos.length > 0) {
      const cranes = await Crane.find({ equipmentNo: { $in: craneEquipmentNos } });
      const craneMap = {};
      cranes.forEach(c => { craneMap[c.equipmentNo] = c; });
      
      items.forEach((item, idx) => {
        if (!item.capacity || !item.weightKg) {
          const craneData = craneMap[item.crane];
          if (craneData) {
            items[idx] = item.toObject ? item.toObject() : item;
            items[idx].capacity = items[idx].capacity || craneData.capacity;
            items[idx].weightKg = items[idx].weightKg || craneData.weightKg;
            items[idx].craneModel = items[idx].craneModel || craneData.craneModel;
          }
        }
      });
    }
    
    res.json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

exports.getTransaction = async (req, res, next) => {
  try {
    let item = await Transaction.findById(req.params.id)
      .populate('counterweights')
      .populate('boomSections')
      .populate('hooks')
      .populate('createdBy', 'name email');
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    
    // Fetch crane details if capacity/weight are missing
    if (!item.capacity || !item.weightKg) {
      const craneData = await Crane.findOne(craneLookup(item));
      if (craneData) {
        item = item.toObject ? item.toObject() : item;
        item.capacity = item.capacity || craneData.capacity;
        item.weightKg = item.weightKg || craneData.weightKg;
        item.craneModel = item.craneModel || craneData.craneModel;
      }
    }
    
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

// Public endpoint - returns sanitized transaction data (no user/audit info)
exports.getPublicTransaction = async (req, res, next) => {
  try {
    let item = await Transaction.findById(req.params.id)
      .populate('counterweights', 'itemName serialNo weightKg')
      .populate('boomSections', 'itemName boomCode length weightKg')
      .populate('hooks', 'itemName hookSerialNo weightKg');
    if (!item) return res.status(404).json({ success: false, message: 'Transaction not found' });
    
    // Fetch crane details if capacity/weight are missing
    if (!item.capacity || !item.weightKg) {
      const craneData = await Crane.findOne(craneLookup(item));
      if (craneData) {
        item = item.toObject ? item.toObject() : item;
        item.capacity = item.capacity || craneData.capacity;
        item.weightKg = item.weightKg || craneData.weightKg;
        item.craneModel = item.craneModel || craneData.craneModel;
      }
    }
    
    // Remove sensitive fields for public access
    const sanitized = item.toObject ? item.toObject() : item;
    delete sanitized.createdBy;
    delete sanitized.__v;
    
    res.json({ success: true, data: sanitized });
  } catch (error) { next(error); }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const { crane, craneId, cranes = [], counterweights, boomSections, hooks } = req.body;
    const restrictedStatuses = ['Out of Yard', 'Under Maintenance', 'On Hire'];

    const requestedCranes = Array.isArray(cranes) && cranes.length
      ? cranes
      : [{ craneId, equipmentNo: crane }];

    const craneDocs = [];
    for (const requestedCrane of requestedCranes) {
      const craneData = requestedCrane.craneId && mongoose.Types.ObjectId.isValid(requestedCrane.craneId)
        ? await Crane.findById(requestedCrane.craneId)
        : await Crane.findOne({ equipmentNo: requestedCrane.equipmentNo || requestedCrane.crane || crane });

      const craneLabel = requestedCrane.equipmentNo || requestedCrane.crane || crane;
      if (!craneData) return res.status(404).json({ success: false, message: `Crane ${craneLabel} not found` });
      if (restrictedStatuses.includes(craneData.status)) {
        return res.status(400).json({ success: false, message: `Crane ${craneData.equipmentNo} cannot be added to transaction (Status: ${craneData.status})` });
      }
      if (!craneDocs.some(item => String(item._id) === String(craneData._id))) craneDocs.push(craneData);
    }

    if (craneDocs.length === 0) {
      return res.status(400).json({ success: false, message: 'At least one crane is required' });
    }

    const primaryCrane = craneDocs[0];
    const craneItems = craneDocs.map(item => ({
      craneId: item._id,
      equipmentNo: item.equipmentNo,
      craneModel: item.craneModel,
      capacity: item.capacity,
      weightKg: item.weightKg,
    }));

    // Validate counterweights status
    if (counterweights?.length) {
      const cwData = await Counterweight.find({ _id: { $in: counterweights } });
      const unavailable = cwData.filter(cw => restrictedStatuses.includes(cw.status));
      if (unavailable.length > 0) {
        return res.status(400).json({ success: false, message: `Counterweight ${unavailable[0].itemName} cannot be added to transaction (Status: ${unavailable[0].status})` });
      }
    }

    // Validate boom sections status
    if (boomSections?.length) {
      const bsData = await BoomSection.find({ _id: { $in: boomSections } });
      const unavailable = bsData.filter(bs => restrictedStatuses.includes(bs.status));
      if (unavailable.length > 0) {
        return res.status(400).json({ success: false, message: `Boom Section ${unavailable[0].itemName} cannot be added to transaction (Status: ${unavailable[0].status})` });
      }
    }

    // Validate hooks status
    if (hooks?.length) {
      const hData = await Hook.find({ _id: { $in: hooks } });
      const unavailable = hData.filter(h => restrictedStatuses.includes(h.status));
      if (unavailable.length > 0) {
        return res.status(400).json({ success: false, message: `Hook ${unavailable[0].itemName} cannot be added to transaction (Status: ${unavailable[0].status})` });
      }
    }

    // Capture crane capacity and weight from the primary crane for backward compatibility.
    const txnData = {
      ...req.body,
      craneId: primaryCrane._id,
      crane: primaryCrane.equipmentNo,
      craneModel: primaryCrane.craneModel,
      capacity: primaryCrane.capacity,
      weightKg: primaryCrane.weightKg,
      cranes: craneItems,
      createdBy: req.user._id,
    };
    const txn = await Transaction.create(txnData);

    const newLocation = txn.deliveryLocation || txn.companyAddress || 'In Transit';
    const clientName = txn.companyName;

    console.log('📝 Transaction created:', txn.transactionNo);
    console.log('  - Counterweights:', txn.counterweights);
    console.log('  - Boom Sections:', txn.boomSections);
    console.log('  - Hooks:', txn.hooks);
    console.log('  - New Location:', newLocation);
    console.log('  - Client Name:', clientName);

    // Mark crane and attachments as Out of Yard and update location and client to transaction details
    const craneUpdate = await Crane.updateMany(
      craneUpdateQuery(txn),
      { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
    );
    console.log('  ✓ Cranes updated:', craneUpdate?.modifiedCount);

    if (txn.counterweights?.length) {
      const cwResult = await Counterweight.updateMany(
        { _id: { $in: txn.counterweights } },
        { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
      );
      console.log('  ✓ Counterweights updated:', cwResult.modifiedCount);
    }
    if (txn.boomSections?.length) {
      const bsResult = await BoomSection.updateMany(
        { _id: { $in: txn.boomSections } },
        { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
      );
      console.log('  ✓ Boom Sections updated:', bsResult.modifiedCount);
    }
    if (txn.hooks?.length) {
      const hResult = await Hook.updateMany(
        { _id: { $in: txn.hooks } },
        { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
      );
      console.log('  ✓ Hooks updated:', hResult.modifiedCount);
    }

    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'CREATE_TRANSACTION', module: 'Transaction', targetId: txn.transactionNo, details: `Transaction ${txn.transactionNo} for ${txn.companyName}` });
    res.status(201).json({ success: true, data: txn });
  } catch (error) { next(error); }
};

exports.updateTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Not found' });

    const wasReturned = txn.status === 'Returned';
    const isNowActive = req.body.status === 'Active';

    // If crane is being changed, fetch and validate the new crane's details
    if ((req.body.craneId && String(req.body.craneId) !== String(txn.craneId || '')) || (req.body.crane && req.body.crane !== txn.crane)) {
      const newCraneData = req.body.craneId && mongoose.Types.ObjectId.isValid(req.body.craneId)
        ? await Crane.findById(req.body.craneId)
        : await Crane.findOne({ equipmentNo: req.body.crane });
      if (!newCraneData) return res.status(404).json({ success: false, message: `Crane ${req.body.crane} not found` });
      
      // Validate new crane status
      const restrictedStatuses = ['Out of Yard', 'Under Maintenance', 'On Hire'];
      if (restrictedStatuses.includes(newCraneData.status)) {
        return res.status(400).json({ success: false, message: `Crane ${req.body.crane} cannot be assigned (Status: ${newCraneData.status})` });
      }
      
      req.body.craneId = newCraneData._id;
      req.body.crane = newCraneData.equipmentNo;
      req.body.capacity = newCraneData.capacity;
      req.body.weightKg = newCraneData.weightKg;
      req.body.craneModel = newCraneData.craneModel;
    }

    // Update transaction
    Object.assign(txn, req.body);
    await txn.save();

    // If changing from Returned back to Active, update associated items
    if (wasReturned && isNowActive) {
      const newLocation = txn.deliveryLocation || txn.companyAddress || 'In Transit';
      const clientName = txn.companyName;

      console.log('🔄 Reactivating transaction:', txn.transactionNo);
      console.log('  - New Location:', newLocation);
      console.log('  - Client Name:', clientName);

      // Update crane and attachments back to Out of Yard status
      await Crane.updateMany(
        craneUpdateQuery(txn),
        { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
      );
      if (txn.counterweights?.length)
        await Counterweight.updateMany(
          { _id: { $in: txn.counterweights } },
          { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
        );
      if (txn.boomSections?.length)
        await BoomSection.updateMany(
          { _id: { $in: txn.boomSections } },
          { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
        );
      if (txn.hooks?.length)
        await Hook.updateMany(
          { _id: { $in: txn.hooks } },
          { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
        );

      console.log('  ✓ Associated items updated to Out of Yard');
    }

    res.json({ success: true, data: txn });
  } catch (error) { next(error); }
};

exports.returnTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Not found' });

    txn.status = 'Returned';
    txn.actualReturnDate = new Date();
    await txn.save();

    // Return crane and attachments to RAG YARD and mark as Under Maintenance, reset client to "-"
    await Crane.updateMany(
      craneUpdateQuery(txn),
      { $set: { status: 'Under Maintenance', location: 'RAG YARD', client: '-' } }
    );
    if (txn.counterweights?.length)
      await Counterweight.updateMany({ _id: { $in: txn.counterweights } }, { $set: { status: 'Under Maintenance', location: 'RAG YARD', client: '-' } });
    if (txn.boomSections?.length)
      await BoomSection.updateMany({ _id: { $in: txn.boomSections } }, { $set: { status: 'Under Maintenance', location: 'RAG YARD', client: '-' } });
    if (txn.hooks?.length)
      await Hook.updateMany({ _id: { $in: txn.hooks } }, { $set: { status: 'Under Maintenance', location: 'RAG YARD', client: '-' } });

    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'RETURN', module: 'Transaction', targetId: txn.transactionNo, details: `Returned transaction ${txn.transactionNo}` });
    res.json({ success: true, data: txn });
  } catch (error) { next(error); }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findByIdAndUpdate(req.params.id, { isArchived: true }, { new: true });
    if (!txn) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, message: 'Archived' });
  } catch (error) { next(error); }
};
