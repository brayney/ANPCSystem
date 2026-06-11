require('dotenv').config();
const mongoose = require('mongoose');
const Crane = require('../models/Crane');

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const result = await Crane.updateMany(
      {},
      { $set: { location: 'RAG YARD' } }
    );

    console.log(`✅ Updated ${result.modifiedCount} cranes`);
    console.log(`⏭️  Matched ${result.matchedCount} cranes total`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

migrate();
