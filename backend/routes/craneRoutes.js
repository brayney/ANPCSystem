const router = require('express').Router();
const c = require('../controllers/craneController');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const os = require('os');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), 'anpc-imports'),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(protect);
router.get('/', c.getCranes);
router.post('/import', adminOnly, upload.single('file'), c.importCranes);
router.get('/by-equipment/:equipmentNo', c.getCraneByEquipmentNo);
router.get('/:id', c.getCrane);
router.get('/:equipmentNo/attachments', c.getCraneAttachments);
router.post('/', adminOnly, c.createCrane);
router.put('/:id', adminOnly, c.updateCrane);
router.delete('/:id', adminOnly, c.deleteCrane);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Only CSV')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router;
