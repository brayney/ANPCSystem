const router = require('express').Router();
const c = require('../controllers/boomSectionController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);
router.get('/', c.getBoomSections);
router.post('/import', adminOnly, c.importBoomSections);
router.get('/:id', c.getBoomSection);
router.post('/', adminOnly, c.createBoomSection);
router.put('/:id', adminOnly, c.updateBoomSection);
router.delete('/:id', adminOnly, c.deleteBoomSection);

module.exports = router;
