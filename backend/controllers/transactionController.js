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

const craneEquipmentNosFromTransaction = (txn) => {
  const equipmentNos = [];
  if (txn.crane) equipmentNos.push(txn.crane);
  if (Array.isArray(txn.cranes)) {
    txn.cranes.forEach(item => {
      if (item.equipmentNo) equipmentNos.push(item.equipmentNo);
    });
  }
  return [...new Set(equipmentNos.map(equipmentNo => String(equipmentNo)))];
};

const attachmentBelongsToCrane = (item, equipmentNos) => {
  const assignedCrane = String(item.assignedCrane || '').trim();
  if (!assignedCrane || /^(all|none|n\/a|na|not assigned|unassigned)$/i.test(assignedCrane)) return true;
  return equipmentNos.includes(assignedCrane);
};

const craneUpdateQuery = (txn) => {
  const ids = craneIdsFromTransaction(txn);
  if (ids.length > 0) return { _id: { $in: ids } };
  return craneLookup(txn);
};

const findChildTransactions = (sourceId, publicOnly = false) => {
  const query = Transaction.find({ isArchived: false, sourceTransactionId: sourceId });
  if (publicOnly) {
    return query
      .populate('counterweights', 'itemName serialNo weightKg')
      .populate('boomSections', 'itemName boomCode length weightKg')
      .populate('hooks', 'itemName hookSerialNo weightKg')
      .sort({ createdAt: 1 });
  }
  return query
    .populate('counterweights')
    .populate('boomSections')
    .populate('hooks')
    .populate('createdBy', 'name email')
    .sort({ createdAt: 1 });
};

const defaultEquipmentState = { status: 'Available', location: 'RAG YARD', client: '-' };
const returnedEquipmentState = { status: 'Under Maintenance', location: 'RAG YARD', client: '-' };

const restoreEquipmentToDefaults = async (transactions, includeCranes = true) => {
  const txns = Array.isArray(transactions) ? transactions : [transactions];
  const craneIds = new Set();
  const craneNos = new Set();
  const counterweightIds = new Set();
  const boomSectionIds = new Set();
  const hookIds = new Set();

  txns.forEach(txn => {
    if (!txn) return;
    craneIdsFromTransaction(txn).forEach(id => craneIds.add(id));
    craneEquipmentNosFromTransaction(txn).forEach(no => craneNos.add(no));
    (txn.counterweights || []).forEach(id => counterweightIds.add(String(id)));
    (txn.boomSections || []).forEach(id => boomSectionIds.add(String(id)));
    (txn.hooks || []).forEach(id => hookIds.add(String(id)));
  });

  if (includeCranes && (craneIds.size > 0 || craneNos.size > 0)) {
    const craneQuery = { $or: [] };
    if (craneIds.size > 0) craneQuery.$or.push({ _id: { $in: Array.from(craneIds) } });
    if (craneNos.size > 0) craneQuery.$or.push({ equipmentNo: { $in: Array.from(craneNos) } });
    await Crane.updateMany(craneQuery, { $set: defaultEquipmentState });
  }
  if (counterweightIds.size > 0) {
    await Counterweight.updateMany({ _id: { $in: Array.from(counterweightIds) } }, { $set: defaultEquipmentState });
  }
  if (boomSectionIds.size > 0) {
    await BoomSection.updateMany({ _id: { $in: Array.from(boomSectionIds) } }, { $set: defaultEquipmentState });
  }
  if (hookIds.size > 0) {
    await Hook.updateMany({ _id: { $in: Array.from(hookIds) } }, { $set: defaultEquipmentState });
  }
};

exports.getTransactions = async (req, res, next) => {
  try {
    const { search, status, type, page = 1, limit = 20 } = req.query;
    const tabStatus = ['Active', 'Returned'].includes(status) ? status : null;
    const mainTransactionFilter = {
      $or: [
        { sourceTransactionId: { $exists: false } },
        { sourceTransactionId: null },
      ],
    };
    const query = {
      isArchived: false,
      $and: [mainTransactionFilter],
    };
    if (status && !tabStatus) query.status = status;
    if (type) query.type = type;
    if (search) {
      query.$and.push({
        $or: [
          { transactionNo: { $regex: search, $options: 'i' } },
          { companyName: { $regex: search, $options: 'i' } },
          { crane: { $regex: search, $options: 'i' } },
          { 'cranes.equipmentNo': { $regex: search, $options: 'i' } },
        ],
      });
    }
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const shouldFilterAfterChildren = !!tabStatus;
    const total = shouldFilterAfterChildren ? 0 : await Transaction.countDocuments(query);
    const items = await Transaction.find(query)
      .populate('counterweights', 'itemName serialNo weightKg capacity')
      .populate('boomSections', 'itemName boomCode length')
      .populate('hooks', 'itemName hookSerialNo capacity')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(shouldFilterAfterChildren ? 0 : (pageNumber - 1) * limitNumber)
      .limit(shouldFilterAfterChildren ? 0 : limitNumber);
    
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

    const itemObjects = items.map(item => item.toObject ? item.toObject() : item);
    const itemIds = itemObjects.map(item => item._id);
    let filteredItemObjects = itemObjects;
    if (itemIds.length > 0) {
      const childTransactions = await Transaction.find({ isArchived: false, sourceTransactionId: { $in: itemIds } })
        .populate('counterweights', 'itemName serialNo weightKg capacity')
        .populate('boomSections', 'itemName boomCode length')
        .populate('hooks', 'itemName hookSerialNo capacity')
        .sort({ createdAt: 1 });
      const childMap = {};
      childTransactions.forEach(child => {
        const sourceId = String(child.sourceTransactionId);
        if (!childMap[sourceId]) childMap[sourceId] = [];
        childMap[sourceId].push(child.toObject ? child.toObject() : child);
      });
      itemObjects.forEach(item => {
        item.childTransactions = childMap[String(item._id)] || [];
      });

      if (tabStatus === 'Active') {
        filteredItemObjects = itemObjects.filter(item => {
          const hasActiveChildren = (item.childTransactions || []).some(child => child.status === 'Active');
          return item.status === 'Active' || (item.status === 'Returned' && hasActiveChildren);
        });
      } else if (tabStatus === 'Returned') {
        filteredItemObjects = itemObjects.filter(item => {
          const hasReturnedChildren = (item.childTransactions || []).some(child => child.status !== 'Active');
          return item.status === 'Returned' || hasReturnedChildren;
        });
      }
    }

    const filteredTotal = shouldFilterAfterChildren ? filteredItemObjects.length : total;
    const pagedItems = shouldFilterAfterChildren
      ? filteredItemObjects.slice((pageNumber - 1) * limitNumber, pageNumber * limitNumber)
      : filteredItemObjects;
    
    res.json({ success: true, data: pagedItems, total: filteredTotal, page: pageNumber, pages: Math.ceil(filteredTotal / limitNumber) });
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

    const itemObject = item.toObject ? item.toObject() : item;
    const rootId = itemObject.sourceTransactionId || itemObject._id;
    const childTransactions = await findChildTransactions(rootId);
    itemObject.childTransactions = childTransactions.map(child => child.toObject ? child.toObject() : child);
    
    res.json({ success: true, data: itemObject });
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

    if (item.sourceTransactionId) {
      item = await Transaction.findById(item.sourceTransactionId)
        .populate('counterweights', 'itemName serialNo weightKg')
        .populate('boomSections', 'itemName boomCode length weightKg')
        .populate('hooks', 'itemName hookSerialNo weightKg');
      if (!item) return res.status(404).json({ success: false, message: 'Main transaction not found' });
    }
    
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
    const rootId = sanitized.sourceTransactionId || sanitized._id;
    const childTransactions = await findChildTransactions(rootId, true);
    sanitized.childTransactions = childTransactions.map(child => {
      const childObject = child.toObject ? child.toObject() : child;
      delete childObject.createdBy;
      delete childObject.__v;
      return childObject;
    });
    delete sanitized.createdBy;
    delete sanitized.__v;
    
    res.json({ success: true, data: sanitized });
  } catch (error) { next(error); }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const { crane, craneId, cranes = [], counterweights, boomSections, hooks, sourceTransactionId } = req.body;
    const restrictedStatuses = ['Out of Yard', 'Under Maintenance', 'On Hire'];
    let sourceTransaction = null;

    if (sourceTransactionId) {
      if (!mongoose.Types.ObjectId.isValid(sourceTransactionId)) {
        return res.status(400).json({ success: false, message: 'Invalid source transaction' });
      }

      sourceTransaction = await Transaction.findOne({
        _id: sourceTransactionId,
        status: 'Active',
        isArchived: false,
      });

      if (!sourceTransaction) {
        return res.status(404).json({ success: false, message: 'Active source transaction not found' });
      }
      if (sourceTransaction.sourceTransactionId) {
        return res.status(400).json({ success: false, message: 'Added transactions can only be created from a main transaction' });
      }
    }

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
      const isSourceCrane = sourceTransaction && (
        craneIdsFromTransaction(sourceTransaction).includes(String(craneData._id)) ||
        craneEquipmentNosFromTransaction(sourceTransaction).includes(String(craneData.equipmentNo))
      );
      if (restrictedStatuses.includes(craneData.status) && !isSourceCrane) {
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

    if (sourceTransaction) {
      const allowedCraneIds = craneIdsFromTransaction(sourceTransaction);
      const allowedEquipmentNos = craneEquipmentNosFromTransaction(sourceTransaction);
      const invalidCrane = craneDocs.find(item => (
        !allowedCraneIds.includes(String(item._id)) &&
        !allowedEquipmentNos.includes(String(item.equipmentNo))
      ));
      if (invalidCrane) {
        return res.status(400).json({ success: false, message: `Only crane ${sourceTransaction.crane} can be used from this active transaction` });
      }

    }

    // Validate counterweights status
    if (counterweights?.length) {
      const cwData = await Counterweight.find({ _id: { $in: counterweights } });
      const sourceIds = new Set((sourceTransaction?.counterweights || []).map(id => String(id)));
      const allowedEquipmentNos = craneEquipmentNosFromTransaction(sourceTransaction || {});
      const invalid = sourceTransaction && cwData.find(cw => (
        !sourceIds.has(String(cw._id)) &&
        !attachmentBelongsToCrane(cw, allowedEquipmentNos)
      ));
      if (invalid) {
        return res.status(400).json({ success: false, message: `Counterweight ${invalid.itemName} must belong to crane ${sourceTransaction.crane}` });
      }
      const alreadyUsed = sourceTransaction && cwData.find(cw => sourceIds.has(String(cw._id)));
      if (alreadyUsed) {
        return res.status(400).json({ success: false, message: `Counterweight ${alreadyUsed.itemName} is already in the source transaction` });
      }
      const unavailable = cwData.filter(cw => restrictedStatuses.includes(cw.status));
      if (unavailable.length > 0) {
        return res.status(400).json({ success: false, message: `Counterweight ${unavailable[0].itemName} cannot be added to transaction (Status: ${unavailable[0].status})` });
      }
    }

    // Validate boom sections status
    if (boomSections?.length) {
      const bsData = await BoomSection.find({ _id: { $in: boomSections } });
      const sourceIds = new Set((sourceTransaction?.boomSections || []).map(id => String(id)));
      const allowedEquipmentNos = craneEquipmentNosFromTransaction(sourceTransaction || {});
      const invalid = sourceTransaction && bsData.find(bs => (
        !sourceIds.has(String(bs._id)) &&
        !attachmentBelongsToCrane(bs, allowedEquipmentNos)
      ));
      if (invalid) {
        return res.status(400).json({ success: false, message: `Boom Section ${invalid.itemName} must belong to crane ${sourceTransaction.crane}` });
      }
      const alreadyUsed = sourceTransaction && bsData.find(bs => sourceIds.has(String(bs._id)));
      if (alreadyUsed) {
        return res.status(400).json({ success: false, message: `Boom Section ${alreadyUsed.itemName} is already in the source transaction` });
      }
      const unavailable = bsData.filter(bs => restrictedStatuses.includes(bs.status));
      if (unavailable.length > 0) {
        return res.status(400).json({ success: false, message: `Boom Section ${unavailable[0].itemName} cannot be added to transaction (Status: ${unavailable[0].status})` });
      }
    }

    // Validate hooks status
    if (hooks?.length) {
      const hData = await Hook.find({ _id: { $in: hooks } });
      const sourceIds = new Set((sourceTransaction?.hooks || []).map(id => String(id)));
      const allowedEquipmentNos = craneEquipmentNosFromTransaction(sourceTransaction || {});
      const invalid = sourceTransaction && hData.find(h => (
        !sourceIds.has(String(h._id)) &&
        !attachmentBelongsToCrane(h, allowedEquipmentNos)
      ));
      if (invalid) {
        return res.status(400).json({ success: false, message: `Hook ${invalid.itemName} must belong to crane ${sourceTransaction.crane}` });
      }
      const alreadyUsed = sourceTransaction && hData.find(h => sourceIds.has(String(h._id)));
      if (alreadyUsed) {
        return res.status(400).json({ success: false, message: `Hook ${alreadyUsed.itemName} is already in the source transaction` });
      }
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
    const isNowReturned = req.body.status === 'Returned';

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
    if (wasReturned && isNowActive) {
      txn.actualReturnDate = undefined;
    } else if (!wasReturned && isNowReturned) {
      txn.actualReturnDate = txn.actualReturnDate || new Date();
    }
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
    const scope = req.body?.scope === 'linked' ? 'linked' : 'this';
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Not found' });

    const transactionsToReturn = [txn];
    if (scope === 'linked') {
      if (txn.sourceTransactionId) {
        const parentTxn = await Transaction.findOne({ _id: txn.sourceTransactionId, isArchived: false });
        if (parentTxn) transactionsToReturn.push(parentTxn);
      } else {
        const childTransactions = await Transaction.find({ sourceTransactionId: txn._id, isArchived: false });
        transactionsToReturn.push(...childTransactions);
      }
    }

    const uniqueTransactions = [];
    const seenIds = new Set();
    transactionsToReturn.forEach(item => {
      const id = String(item._id);
      if (!seenIds.has(id)) {
        seenIds.add(id);
        uniqueTransactions.push(item);
      }
    });

    for (const item of uniqueTransactions) {
      if (item.status === 'Returned') continue;

      item.status = 'Returned';
      item.actualReturnDate = item.actualReturnDate || new Date();
      await item.save();

      await Crane.updateMany(
        craneUpdateQuery(item),
        { $set: returnedEquipmentState }
      );
      if (item.counterweights?.length)
        await Counterweight.updateMany({ _id: { $in: item.counterweights } }, { $set: returnedEquipmentState });
      if (item.boomSections?.length)
        await BoomSection.updateMany({ _id: { $in: item.boomSections } }, { $set: returnedEquipmentState });
      if (item.hooks?.length)
        await Hook.updateMany({ _id: { $in: item.hooks } }, { $set: returnedEquipmentState });

      await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'RETURN', module: 'Transaction', targetId: item.transactionNo, details: `Returned transaction ${item.transactionNo}` });
    }

    res.json({ success: true, data: { target: txn, updatedCount: uniqueTransactions.length } });
  } catch (error) { next(error); }
};

exports.deleteTransaction = async (req, res, next) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ success: false, message: 'Not found' });

    const isAddedTransaction = !!txn.sourceTransactionId;
    if (isAddedTransaction) {
      txn.isArchived = true;
      await txn.save();

      await restoreEquipmentToDefaults(txn, false);

      const sourceTxn = await Transaction.findOne({ _id: txn.sourceTransactionId, isArchived: false });
      if (sourceTxn && sourceTxn.status === 'Active') {
        await Crane.updateMany(
          craneUpdateQuery(sourceTxn),
          { $set: { status: 'Out of Yard', location: sourceTxn.deliveryLocation || sourceTxn.companyAddress || 'In Transit', client: sourceTxn.companyName } }
        );
      } else {
        await restoreEquipmentToDefaults(txn, true);
      }

      await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'DELETE_TRANSACTION', module: 'Transaction', targetId: txn.transactionNo, details: `Deleted added transaction ${txn.transactionNo}` });
      return res.json({ success: true, message: 'Archived and equipment restored' });
    }

    const childTransactions = await Transaction.find({ sourceTransactionId: txn._id, isArchived: false });
    const relatedTransactions = [txn, ...childTransactions];

    await Transaction.updateMany(
      { _id: { $in: relatedTransactions.map(item => item._id) } },
      { $set: { isArchived: true } }
    );
    await restoreEquipmentToDefaults(relatedTransactions, true);

    await AuditLog.create({ user: req.user._id, userName: req.user.name, action: 'DELETE_TRANSACTION', module: 'Transaction', targetId: txn.transactionNo, details: `Deleted transaction ${txn.transactionNo} and ${childTransactions.length} added transaction(s)` });
    res.json({ success: true, message: 'Archived and equipment restored' });
  } catch (error) { next(error); }
};
