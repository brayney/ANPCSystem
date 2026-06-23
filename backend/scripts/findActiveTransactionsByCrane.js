require('dotenv').config();

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');

const equipmentNo = process.argv[2];

const run = async () => {
  if (!equipmentNo) throw new Error('Usage: node scripts/findActiveTransactionsByCrane.js EQUIPMENT_NO');

  await mongoose.connect(process.env.MONGODB_URI);
  const transactions = await Transaction.find({
    isArchived: false,
    $or: [
      { crane: equipmentNo },
      { 'cranes.equipmentNo': equipmentNo },
    ],
  }).select('transactionNo companyName status sourceTransactionId counterweights boomSections hooks');

  console.log(JSON.stringify(transactions, null, 2));
  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  try {
    await mongoose.disconnect();
  } catch {}
  process.exit(1);
});
