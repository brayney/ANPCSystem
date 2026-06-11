const mongoose = require('mongoose');
require('dotenv').config();

const Crane = require('../models/Crane');

async function migrateCraneClient() {
  try {
    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔄 Updating all cranes client to "-"...');
    const result = await Crane.updateMany(
      { $or: [{ client: null }, { client: '' }, { client: { $exists: false } }] },
      { $set: { client: '-' } }
    );
    console.log(`✅ Updated ${result.modifiedCount} cranes`);
    console.log(`📊 Matched ${result.matchedCount} total cranes`);

    await mongoose.connection.close();
    console.log('✅ Migration complete');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

migrateCraneClient();
