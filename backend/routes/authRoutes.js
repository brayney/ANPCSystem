const router = require('express').Router();
const { login, logout, getMe, getUsers, deleteUser, register, updatePassword, getAttemptState, toggleUserStatus } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/login', login);
router.get('/attempts', getAttemptState);
router.post('/logout', protect, logout);
router.post('/register', protect, register);
router.get('/me', protect, getMe);
router.get('/users', protect, getUsers);
router.put('/users/:id/toggle-status', protect, toggleUserStatus);
router.delete('/users/:id', protect, deleteUser);
router.put('/update-password', protect, updatePassword);

module.exports = router;
