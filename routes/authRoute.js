const express = require('express');
const { login, getDashboardData } = require('../controllers/authController');
const { forgotPassword, resetPassword } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.get('/dashboard', authMiddleware, getDashboardData);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;
