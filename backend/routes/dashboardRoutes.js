const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/', getDashboard);

module.exports = router;
