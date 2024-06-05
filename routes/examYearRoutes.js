const express = require('express');
const { uploadExamYearAsXML } = require('../controllers/examYearController');


const router = express.Router();

router.post('/upload-exam-year', uploadExamYearAsXML);

module.exports = router;