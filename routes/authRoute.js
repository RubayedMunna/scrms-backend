const express = require('express');
const { login, getDashboardData } = require('../controllers/authController');
const { forgotPassword, resetPassword, superUserForgotPassword, superUserResetPassword } = require('../controllers/authController');
const { fetchDepartments } = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', login);
router.get('/dashboard', authMiddleware, getDashboardData);
router.get('/su-dashboard', authMiddleware, getDashboardData, fetchDepartments);
router.get('/departments', authMiddleware, fetchDepartments);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/su-forgot-password',superUserForgotPassword);
router.post('/su-reset-password',superUserResetPassword);

module.exports = router;
