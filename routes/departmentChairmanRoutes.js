const express = require('express');
const { uploadDepartmentChairmanAsXML } = require('../controllers/departmentChairmanController');


const router = express.Router();

router.post('/upload-department-chairman', uploadDepartmentChairmanAsXML);

module.exports = router;