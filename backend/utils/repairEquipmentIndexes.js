const Crane = require('../models/Crane');
const Counterweight = require('../models/Counterweight');
const BoomSection = require('../models/BoomSection');
const Hook = require('../models/Hook');

const INDEX_REPAIRS = [
  {
    model: Crane,
    label: 'cranes',
    shouldDrop: index => index.name === 'equipmentNo_1' && index.unique,
    reason: 'allow duplicate crane equipment numbers during import',
  },
  {
    model: Counterweight,
    label: 'counterweights',
    shouldDrop: index => index.unique && index.key && index.key['transactions.transactionNo'] === 1,
    reason: 'remove stale transaction number uniqueness from equipment imports',
  },
  {
    model: BoomSection,
    label: 'boom sections',
    shouldDrop: index => index.unique && index.key && index.key['transactions.transactionNo'] === 1,
    reason: 'remove stale transaction number uniqueness from equipment imports',
  },
  {
    model: Hook,
    label: 'hooks',
    shouldDrop: index => index.unique && index.key && index.key['transactions.transactionNo'] === 1,
    reason: 'remove stale transaction number uniqueness from equipment imports',
  },
];

const repairEquipmentIndexes = async () => {
  for (const repair of INDEX_REPAIRS) {
    try {
      const indexes = await repair.model.collection.indexes();
      const indexesToDrop = indexes.filter(repair.shouldDrop);

      for (const index of indexesToDrop) {
        await repair.model.collection.dropIndex(index.name);
        console.log(` Dropped ${repair.label} index ${index.name} to ${repair.reason}`);
      }
    } catch (err) {
      console.warn(` Could not verify ${repair.label} indexes:`, err.message);
    }
  }
};

module.exports = repairEquipmentIndexes;
