const mongoose = require('mongoose');
require('dotenv').config();

const Crane = require('../models/Crane');

async function resetAllCraneClients() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const result = await Crane.updateMany({}, { $set: { client: '-' } });
    console.log(`✅ Updated ${result.modifiedCount} cranes to client: "-"`);
    console.log(`📊 Matched ${result.matchedCount} total cranes`);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetAllCraneClients();
