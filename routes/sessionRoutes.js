const express = require('express');
const { uploadSessionAsXML } = require('../controllers/sessionController');


const router = express.Router();

router.post('/upload-session', uploadSessionAsXML);

module.exports = router;