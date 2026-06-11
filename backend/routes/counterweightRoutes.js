// counterweightRoutes.js
const router1 = require('express').Router();
const cw = require('../controllers/counterweightController');
const { protect, adminOnly } = require('../middleware/auth');

router1.use(protect);
router1.get('/', cw.getCounterweights);
router1.post('/import', adminOnly, cw.importCounterweights);
router1.get('/:id', cw.getCounterweight);
router1.post('/', adminOnly, cw.createCounterweight);
router1.put('/:id', adminOnly, cw.updateCounterweight);
router1.delete('/:id', adminOnly, cw.deleteCounterweight);

module.exports = router1;
