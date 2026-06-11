const mongoose = require('mongoose');
require('dotenv').config();

const BoomSection = require('../models/BoomSection');

async function migrateBoomSectionLocation() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Updating all boom sections to location "RAG YARD"...');
    const result = await BoomSection.updateMany({}, { $set: { location: 'RAG YARD' } });
    console.log(`✅ Updated ${result.modifiedCount} boom sections`);
    console.log(`📊 Matched ${result.matchedCount} total boom sections`);

    await mongoose.connection.close();
    console.log('✅ Migration complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateBoomSectionLocation();
