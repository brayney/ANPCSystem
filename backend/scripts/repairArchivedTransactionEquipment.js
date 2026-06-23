require('dotenv').config();

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');

const DEFAULT_STATE = { status: 'Available', location: 'RAG YARD', client: '-' };

const add = (set, value) => {
  if (value) set.add(String(value));
};

const collectRefs = (transactions) => {
  const refs = {
    craneIds: new Set(),
    craneNos: new Set(),
    counterweights: new Set(),
    boomSections: new Set(),
    hooks: new Set(),
  };

  transactions.forEach((txn) => {
    add(refs.craneIds, txn.craneId);
    add(refs.craneNos, txn.crane);
    (txn.cranes || []).forEach((crane) => {
      add(refs.craneIds, crane.craneId);
      add(refs.craneNos, crane.equipmentNo);
    });
    (txn.counterweights || []).forEach((id) => add(refs.counterweights, id));
    (txn.boomSections || []).forEach((id) => add(refs.boomSections, id));
    (txn.hooks || []).forEach((id) => add(refs.hooks, id));
  });

  return refs;
};

const difference = (source, used) => (
  Array.from(source).filter((value) => !used.has(value))
);

const updateByIds = async (Model, ids) => {
  if (!ids.length) return 0;
  const result = await Model.updateMany(
    { _id: { $in: ids }, status: { $ne: 'Available' } },
    { $set: DEFAULT_STATE }
  );
  return result.modifiedCount || 0;
};

const run = async () => {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required');

  await mongoose.connect(process.env.MONGODB_URI);

  const [archivedTransactions, activeTransactions] = await Promise.all([
    Transaction.find({ isArchived: true }),
    Transaction.find({ isArchived: false }),
  ]);

  const archived = collectRefs(archivedTransactions);
  const active = collectRefs(activeTransactions);

  const craneIds = difference(archived.craneIds, active.craneIds);
  const craneNos = difference(archived.craneNos, active.craneNos);
  const counterweights = difference(archived.counterweights, active.counterweights);
  const boomSections = difference(archived.boomSections, active.boomSections);
  const hooks = difference(archived.hooks, active.hooks);

  let cranesModified = 0;
  if (craneIds.length || craneNos.length) {
    const craneQuery = { status: { $ne: 'Available' }, $or: [] };
    if (craneIds.length) craneQuery.$or.push({ _id: { $in: craneIds } });
    if (craneNos.length) craneQuery.$or.push({ equipmentNo: { $in: craneNos } });
    const result = await Crane.updateMany(craneQuery, { $set: DEFAULT_STATE });
    cranesModified = result.modifiedCount || 0;
  }

  const result = {
    archivedTransactions: archivedTransactions.length,
    activeTransactions: activeTransactions.length,
    reset: {
      cranes: cranesModified,
      counterweights: await updateByIds(Counterweight, counterweights),
      boomSections: await updateByIds(BoomSection, boomSections),
      hooks: await updateByIds(Hook, hooks),
    },
    skippedBecauseStillActive: {
      cranesById: archived.craneIds.size - craneIds.length,
      cranesByEquipmentNo: archived.craneNos.size - craneNos.length,
      counterweights: archived.counterweights.size - counterweights.length,
      boomSections: archived.boomSections.size - boomSections.length,
      hooks: archived.hooks.size - hooks.length,
    },
  };

  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
