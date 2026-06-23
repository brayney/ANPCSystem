require('dotenv').config();

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');

const isDefault = (item) => (
  item.status === 'Available' &&
  item.location === 'RAG YARD' &&
  item.client === '-'
);

const add = (set, value) => {
  if (value) set.add(String(value));
};

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);

  const archived = await Transaction.find({ isArchived: true });
  const refs = {
    craneIds: new Set(),
    craneNos: new Set(),
    counterweights: new Set(),
    boomSections: new Set(),
    hooks: new Set(),
  };

  archived.forEach((txn) => {
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

  const [cranes, counterweights, boomSections, hooks] = await Promise.all([
    Crane.find({
      $or: [
        { _id: { $in: Array.from(refs.craneIds) } },
        { equipmentNo: { $in: Array.from(refs.craneNos) } },
      ],
    }).select('equipmentNo status location client'),
    Counterweight.find({ _id: { $in: Array.from(refs.counterweights) } }).select('itemName status location client'),
    BoomSection.find({ _id: { $in: Array.from(refs.boomSections) } }).select('itemName boomCode status location client'),
    Hook.find({ _id: { $in: Array.from(refs.hooks) } }).select('itemName hookSerialNo status location client'),
  ]);

  const remaining = {
    cranes: cranes.filter((item) => !isDefault(item)),
    counterweights: counterweights.filter((item) => !isDefault(item)),
    boomSections: boomSections.filter((item) => !isDefault(item)),
    hooks: hooks.filter((item) => !isDefault(item)),
  };

  console.log(JSON.stringify(remaining, null, 2));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
