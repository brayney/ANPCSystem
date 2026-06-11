const mongoose = require('mongoose');
require('dotenv').config();

async function testUpdate() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const Counterweight = require('../models/Counterweight');
    
    console.log('Testing updateMany for location field...');
    const result = await Counterweight.updateMany(
      { _id: { $in: ['6a0a5b6b6a04e8c370bac8e1'] } }, 
      { $set: { location: 'TEST LOCATION' } }
    );
    console.log('Update result:', result);
    
    const cw = await Counterweight.findById('6a0a5b6b6a04e8c370bac8e1');
    console.log('After update - location:', cw.location, 'status:', cw.status);
    
    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testUpdate();
