// counterweightRoutes.js
const router1 = require('express').Router();
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

router1.use(protect);
router1.get('/', cw.getCounterweights);
router1.post('/import', adminOnly, upload.single('file'), cw.importCounterweights);
router1.get('/:id', cw.getCounterweight);
router1.post('/', adminOnly, cw.createCounterweight);
router1.put('/:id', adminOnly, cw.updateCounterweight);
router1.delete('/:id', adminOnly, cw.deleteCounterweight);

// Multer error handler
router1.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Upload error: ${err.message}` });
  }
  if (err.message && err.message.includes('Only CSV or XLSX')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

module.exports = router1;
