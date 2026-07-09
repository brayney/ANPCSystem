const router = require('express').Router();
const cw = require('../controllers/counterweightController');
const { protect, adminOnly } = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const os = require('os');

// Configure multer for file uploads
const upload = multer({
  dest: path.join(os.tmpdir(), 'anpc-imports'),
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx') {
      cb(null, true);
    } else {
      cb(new Error('Only CSV or XLSX files are allowed'), false);
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

router.use(protect);
router.get('/', cw.getCounterweights);
router.post('/import', adminOnly, upload.single('file'), cw.importCounterweights);
router.get('/:id', cw.getCounterweight);
router.post('/', adminOnly, cw.createCounterweight);
router.put('/:id', adminOnly, cw.updateCounterweight);
router.delete('/:id', adminOnly, cw.deleteCounterweight);

// Multer error handler
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Only CSV or XLSX')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router;
