const express = require('express');
const { generateRegistrationLink, registerSuperUser ,loginSuperUser} = require('../controllers/superUserController');

const router = express.Router();

router.post('/generate-registration-link', generateRegistrationLink);
router.post('/register-superuser/:token', registerSuperUser);
router.post('/login-superuser', loginSuperUser);

module.exports = router;
