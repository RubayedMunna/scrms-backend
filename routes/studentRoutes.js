const express = require('express');
const { uploadStudentAsXML } = require('../controllers/studentController');


const router = express.Router();

router.post('/upload-student', uploadStudentAsXML);

module.exports = router;