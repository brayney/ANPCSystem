require('dotenv').config();
const mongoose = require('mongoose');
const Crane = require('./models/Crane');

async function deleteRecord() {
  try {
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/anpc-system';
    console.log('Connecting to:', dbUrl);
    
    await mongoose.connect(dbUrl);
    console.log('✅ Connected to database');
    
    const result = await Crane.deleteOne({ equipmentNo: 'CR-001' });
    console.log(`✅ Deleted ${result.deletedCount} record(s) with equipmentNo: CR-001`);
    
    await mongoose.connection.close();
    console.log('✅ Connection closed');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteRecord();
