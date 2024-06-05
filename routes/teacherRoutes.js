const express = require('express');
const { uploadTeacherAsXML } = require('../controllers/teacherController');


const router = express.Router();

router.post('/upload-teacher', uploadTeacherAsXML);

module.exports = router;