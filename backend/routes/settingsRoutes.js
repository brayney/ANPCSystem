const express = require('express');
const multer = require('multer');
const { protect, adminOnly } = require('../middleware/auth');
const {
  uploadLoginBackground,
  getLoginBackground,
  deleteLoginBackground,
  updateLanguage,
} = require('../controllers/settingsController');

const router = express.Router();

// Configure multer for memory storage (not disk)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Allowed: JPEG, PNG, GIF, WebP'));
    }
  },
});

// Upload login background (admin only)
router.post('/login-background', protect, adminOnly, (req, res, next) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'File upload failed',
      });
    }
    uploadLoginBackground(req, res);
  });
});

// Get login background (public)
router.get('/login-background', getLoginBackground);

// Delete login background (admin only)
router.delete('/login-background', protect, adminOnly, deleteLoginBackground);

// Update user language preference (protected)
router.put('/language', protect, updateLanguage);

module.exports = router;
