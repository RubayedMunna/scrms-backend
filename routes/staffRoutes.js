const express = require('express');
const { uploadStaffAsXML } = require('../controllers/staffController');


const router = express.Router();

router.post('/upload-staff', uploadStaffAsXML);

module.exports = router;