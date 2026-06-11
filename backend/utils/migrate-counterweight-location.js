const mongoose = require('mongoose');
require('dotenv').config();

const Counterweight = require('../models/Counterweight');

async function migrateCounterweightLocation() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Updating all counterweights to location "RAG YARD"...');
    const result = await Counterweight.updateMany({}, { $set: { location: 'RAG YARD' } });
    console.log(`✅ Updated ${result.modifiedCount} counterweights`);
    console.log(`📊 Matched ${result.matchedCount} total counterweights`);

    await mongoose.connection.close();
    console.log('✅ Migration complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateCounterweightLocation();
