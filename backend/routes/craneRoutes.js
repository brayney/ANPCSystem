const router = require('express').Router();
const c = require('../controllers/craneController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/', c.getCranes);
router.post('/import', adminOnly, c.importCranes);
router.get('/by-equipment/:equipmentNo', c.getCraneByEquipmentNo);
router.get('/:id', c.getCrane);
router.get('/:equipmentNo/attachments', c.getCraneAttachments);
router.post('/', adminOnly, c.createCrane);
router.put('/:id', adminOnly, c.updateCrane);
router.delete('/:id', adminOnly, c.deleteCrane);

module.exports = router;
