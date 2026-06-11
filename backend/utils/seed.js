require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');

const craneData = [
  { equipmentNo: 'SSN-CC-018', sarensNo: '8682', id: 'CC', equipmentType: 'Lattice Boom Crane', craneModel: 'LR1280', yearModel: '2007', capacity: '280t', plateNo: '8668-EAA', serialNumber: '136099', manufacturer: 'Liebherr', maxConfiguration: '58.1m MB + 59,0m LF', workingConfiguration: '58.1m Main Boom', location: 'BAHRAIN', client: 'SNME-BAHRAIN', status: 'On Hire', startingDate: new Date('2024-12-07'), supervisor: 'SNME-BAHRAIN', division: 'OPS' },
  { equipmentNo: 'SSN-AT-033', sarensNo: '8818', id: 'AT', equipmentType: 'All Terrain Crane', craneModel: 'LTM1055/3', yearModel: '2007', capacity: '55t', plateNo: '2000 KAA', serialNumber: '84602', manufacturer: 'Liebherr', maxConfiguration: '40,0m MB + 16,0m Fly jib', location: 'HARADTH', client: 'OSB-904', status: 'On Hire', startingDate: new Date('2024-12-23'), supervisor: 'MADHI', division: 'SPD' },
  { equipmentNo: 'SSN-CC-034', sarensNo: '8686', id: 'CC', equipmentType: 'Lattice Boom Crane', craneModel: 'LR1200', yearModel: '2007', capacity: '200t', plateNo: '5373-SAA', serialNumber: '135060', manufacturer: 'Liebherr', maxConfiguration: '74,0m MB + 59,0m LF', location: 'RAG YARD', status: 'Standby', startingDate: new Date('2024-02-17'), releaseDate: new Date('2025-03-29'), division: 'OPS' },
  { equipmentNo: 'SSN-AT-037', sarensNo: '8819', id: 'AT', equipmentType: 'All Terrain Crane', craneModel: 'LTM1055/3', yearModel: '2007', capacity: '55t', plateNo: '7289 EBA', serialNumber: '84628', manufacturer: 'Liebherr', maxConfiguration: '40,0m MB + 16,0m Fly jib', location: 'HAWIYAH', client: 'SAUDI ARAMCO', status: 'On Hire', startingDate: new Date('2023-12-01'), supervisor: 'MADHI', division: 'SPD' },
  { equipmentNo: 'SSN-CC-057', sarensNo: 'K-8833', id: 'CC', equipmentType: 'Lattice Boom Crane', craneModel: 'LR1100', capacity: '100t', location: 'SNME-DUBAI UAE', status: 'On Hire' },
  { equipmentNo: 'SSN-AT-307', id: 'AT', equipmentType: 'All Terrain Crane', craneModel: 'LTM1160-5.2', location: 'JIZAN', status: 'On Hire' },
  { equipmentNo: 'SSN-AT-308', id: 'AT', equipmentType: 'All Terrain Crane', craneModel: 'LTM1160-5.2', location: 'ABU ALI', status: 'On Hire' },
  { equipmentNo: 'SSN-CC-313', id: 'CC', equipmentType: 'Lattice Boom Crane', craneModel: 'LR1300', capacity: '300t', location: 'RAG YARD', status: 'Available' },
];

const counterweightData = [
  { itemName: 'Counterweight 3,0T', serialNo: 'SSN-CW-022', weightKg: 3000, capacity: '3T', location: 'TRAINING AREA', condition: 'OK', assignedCrane: null },
  { itemName: 'Counterweight 3,0T', serialNo: 'SSN-CW-024', weightKg: 3000, capacity: '3T', location: 'TRAINING AREA', condition: 'OK', assignedCrane: null },
  { itemName: 'Counterweight 3,0T', serialNo: 'SSN-CW-021', weightKg: 3000, capacity: '3T', location: 'SCRAP AREA', condition: 'NOT OK', assignedCrane: null },
  { itemName: 'Counterweight 1,7T', weightKg: 1700, location: 'JUBAIL YARD', condition: 'OK', assignedCrane: null },
  { itemName: 'Superlift Counterweight 100T', weightKg: 100000, capacity: '100T', location: 'RAG YARD', condition: 'OK', assignedCrane: 'SSN-CC-313' },
  { itemName: 'Counterweight 20T', weightKg: 20000, capacity: '20T', location: 'RAG YARD', condition: 'OK', assignedCrane: 'SSN-CC-313' },
];

const boomSectionData = [
  { sarensNo: 'K-8833', assignedCrane: 'SSN-CC-057', boomCode: '1311.22', itemName: 'MAIN BOOM INSERT 6,0m', length: '6,0m', craneModel: 'LR1100', weightKg: '880 kg', capacity: '100t', location: 'SNME-DUBAI UAE', condition: 'Ok' },
  { sarensNo: 'K-8833', assignedCrane: 'SSN-CC-057', boomCode: '1311.21', itemName: 'MAIN BOOM INSERT 12,0m', length: '12,0m', craneModel: 'LR1100', weightKg: '1320 kg', capacity: '100t', location: 'SNME-DUBAI UAE', condition: 'Ok' },
  { sarensNo: 'K-8833', assignedCrane: 'SSN-CC-057', boomCode: '1311.21', itemName: 'Main Boom Head 8.5m', length: '8,5m', craneModel: 'LR1100', weightKg: '2300 kg', capacity: '100t', location: 'SNME-DUBAI UAE', condition: 'Ok' },
  { assignedCrane: 'SSN-CC-313', boomCode: 'LF-001', itemName: 'Luffing Fly Jib 24m', length: '24m', craneModel: 'LR1300', location: 'RAG YARD', condition: 'Ok' },
  { assignedCrane: 'SSN-CC-313', boomCode: 'MB-001', itemName: 'Main Boom Section 12m', length: '12m', craneModel: 'LR1300', location: 'RAG YARD', condition: 'Ok' },
];

const hookData = [
  { itemName: 'Hook block 63t swl', hookSerialNo: '910439708E / 412978-04', capacity: '63t', assignedCrane: 'SSN-AT-307', location: 'SSN-AT-169 - JIZAN', status: 'Allocated', craneModel: 'LTM1160-5.2', ropeDia: '21mm', sheaveNo: '3', weightKg: 700 },
  { itemName: 'Auxillary Hook 10T', hookSerialNo: '919311808E / 9299-14', capacity: '10t', assignedCrane: 'SSN-AT-307', location: 'INSTALL', status: 'Allocated', craneModel: 'LTM1160-5.2', ropeDia: '21mm', sheaveNo: '0', weightKg: 350 },
  { itemName: 'Hook block 63t swl', hookSerialNo: '910439708E / 413476-04', capacity: '63t', assignedCrane: 'SSN-AT-308', location: 'ABU ALI-BORROW TO-AT-168', status: 'Allocated', craneModel: 'LTM1160-5.2', ropeDia: '21mm', sheaveNo: '3', weightKg: 700 },
  { itemName: 'Hook block 30t swl', hookSerialNo: '914867808E /392498-02', capacity: '30t', assignedCrane: 'SSN-AT-308', location: 'RAG YARD', status: 'Allocated', craneModel: 'LTM1160-5.2', ropeDia: '21mm', sheaveNo: '1', weightKg: 650 },
  { itemName: 'Hook block 100t swl', hookSerialNo: 'HK-CC-313-001', capacity: '100t', assignedCrane: 'SSN-CC-313', location: 'RAG YARD', status: 'Available', craneModel: 'LR1300', weightKg: 1200 },
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Crane.deleteMany({}),
      Counterweight.deleteMany({}),
      BoomSection.deleteMany({}),
      Hook.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // Create admin user
    await User.create({
      name: 'ANPC Admin',
      email: 'admin@anpc.com',
      password: 'admin123',
      role: 'admin',
    });
    console.log('👤 Admin user created: admin@anpc.com / admin123');

    // Seed cranes
    await Crane.insertMany(craneData);
    console.log(`🏗️  ${craneData.length} cranes seeded`);

    // Seed counterweights
    await Counterweight.insertMany(counterweightData);
    console.log(`⚖️  ${counterweightData.length} counterweights seeded`);

    // Seed boom sections
    await BoomSection.insertMany(boomSectionData);
    console.log(`📏 ${boomSectionData.length} boom sections seeded`);

    // Seed hooks
    await Hook.insertMany(hookData);
    console.log(`🪝 ${hookData.length} hooks seeded`);

    console.log('\n✅ Database seeded successfully!');
    console.log('🔐 Login: admin@anpc.com / admin123');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err);
    process.exit(1);
  }
};

seed();
