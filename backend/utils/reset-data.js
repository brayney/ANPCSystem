const mongoose = require('mongoose');
require('dotenv').config();

async function resetData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Counterweight = require('../models/Counterweight');
    const Hook = require('../models/Hook');
    const BoomSection = require('../models/BoomSection');
    
    await Counterweight.updateMany(
      { _id: { $in: ['6a0a5b6b6a04e8c370bac8e1'] } },
      { $set: { location: 'RAG YARD', status: 'Available' } }
    );
    await Hook.updateMany(
      { _id: { $in: ['6a0a5b6b6a04e8c370bac8ed'] } },
      { $set: { location: 'RAG YARD', status: 'Available' } }
    );
    await BoomSection.updateMany(
      { _id: { $in: ['6a0a5b6b6a04e8c370bac8e7'] } },
      { $set: { location: 'RAG YARD', status: 'Available' } }
    );
    console.log('✅ Reset complete - all items back to RAG YARD with Available status');
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetData();
