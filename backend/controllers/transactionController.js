const Transaction = require('../models/Transaction');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');
const AuditLog = require('../models/AuditLog');

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
    res.json({ success: true, data: items, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (error) { next(error); }
};

exports.getTransaction = async (req, res, next) => {
  try {
    const item = await Transaction.findById(req.params.id)
      .populate('counterweights')
      .populate('boomSections')
      .populate('hooks')
      .populate('createdBy', 'name email');
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, data: item });
  } catch (error) { next(error); }
};

exports.createTransaction = async (req, res, next) => {
  try {
    const { crane, counterweights, boomSections, hooks } = req.body;
    const restrictedStatuses = ['Out of Yard', 'Under Maintenance', 'On Hire'];

    // Validate crane status
    const craneData = await Crane.findOne({ equipmentNo: crane });
    if (!craneData) return res.status(404).json({ success: false, message: `Crane ${crane} not found` });
    if (restrictedStatuses.includes(craneData.status)) {
      return res.status(400).json({ success: false, message: `Crane ${crane} cannot be added to transaction (Status: ${craneData.status})` });
    }

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

    const txn = await Transaction.create({ ...req.body, createdBy: req.user._id });

    const newLocation = txn.deliveryLocation || txn.companyAddress || 'In Transit';
    const clientName = txn.companyName;

    console.log('📝 Transaction created:', txn.transactionNo);
    console.log('  - Counterweights:', txn.counterweights);
    console.log('  - Boom Sections:', txn.boomSections);
    console.log('  - Hooks:', txn.hooks);
    console.log('  - New Location:', newLocation);
    console.log('  - Client Name:', clientName);

    // Mark crane and attachments as Out of Yard and update location and client to transaction details
    const craneUpdate = await Crane.findOneAndUpdate(
      { equipmentNo: txn.crane },
      { $set: { status: 'Out of Yard', location: newLocation, client: clientName } }
    );
    console.log('  ✓ Crane updated:', craneUpdate?.equipmentNo);

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
      await Crane.findOneAndUpdate(
        { equipmentNo: txn.crane },
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

    // Return crane and attachments to RAG YARD and mark as Available, reset client to "-"
    await Crane.findOneAndUpdate(
      { equipmentNo: txn.crane },
      { $set: { status: 'Available', location: 'RAG YARD', client: '-' } }
    );
    if (txn.counterweights?.length)
      await Counterweight.updateMany({ _id: { $in: txn.counterweights } }, { $set: { status: 'Available', location: 'RAG YARD', client: '-' } });
    if (txn.boomSections?.length)
      await BoomSection.updateMany({ _id: { $in: txn.boomSections } }, { $set: { status: 'Available', location: 'RAG YARD', client: '-' } });
    if (txn.hooks?.length)
      await Hook.updateMany({ _id: { $in: txn.hooks } }, { $set: { status: 'Available', location: 'RAG YARD', client: '-' } });

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
