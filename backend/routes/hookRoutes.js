const router = require('express').Router();
const c = require('../controllers/hookController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/', c.getHooks);
router.post('/import', adminOnly, c.importHooks);
router.get('/:id', c.getHook);
router.post('/', adminOnly, c.createHook);
router.put('/:id', adminOnly, c.updateHook);
router.delete('/:id', adminOnly, c.deleteHook);

module.exports = router;
