const express = require('express');
const { uploadDeptAsXML } = require('../controllers/DeptController');

const router = express.Router();

router.post('/upload-department', async (req, res, next) => {
    try {
        // Assuming uploadDeptAsXML is an async function
        await uploadDeptAsXML(req, res);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
        // You can also pass the error to the error handling middleware
        // next(err);
    }
});

module.exports = router;
