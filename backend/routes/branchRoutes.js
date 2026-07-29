const router = require('express').Router();
const controller = require('../controllers/branchController');
const { protect, superAdminOnly } = require('../middleware/auth');

router.use(protect, superAdminOnly);
router.get('/', controller.getBranches);
router.post('/', controller.createBranchAdmin);
router.get('/:id/summary', controller.getBranchSummary);
router.put('/:id', controller.updateBranch);
router.put('/:id/toggle-status', controller.toggleBranch);

module.exports = router;
