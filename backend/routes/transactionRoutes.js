const router = require('express').Router();
const c = require('../controllers/transactionController');
const { protect, adminOnly, adminOrManager } = require('../middleware/auth');

// Public route - no authentication required (sanitized response)
router.get('/public/:id', c.getPublicTransaction);

router.use(protect);
router.get('/', c.getTransactions);
router.get('/:id', c.getTransaction);
router.post('/', adminOrManager, c.createTransaction);
router.put('/:id/return', adminOrManager, c.returnTransaction);
router.put('/:id', adminOrManager, c.updateTransaction);
router.delete('/:id', adminOnly, c.deleteTransaction);

module.exports = router;
