const router = require('express').Router();
const c = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/rental-history', c.getRentalHistory);
router.get('/inventory', c.getInventoryReport);
router.get('/crane-utilization', c.getCraneUtilization);

module.exports = router;
