const express = require('express');
const { uploadDeptAsXML } = require('../controllers/DeptController');
const { getDepartmentById } = require('../controllers/DeptController');
const { getDeptIdAndNames } = require('../controllers/DeptController');


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

router.get('/department/:dept_id', async (req, res) => {
    const { dept_id } = req.params;
    // console.log(dept_id);
    try {
        const department = await getDepartmentById(dept_id);
        
        if (department) {
            res.status(200).json(department);
        } else {
            res.status(404).json({ message: 'Department not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching department', error });
    }
});

router.get('/departments', async (req, res) => {
    try {
        const departments = await getDeptIdAndNames();
        res.json(departments);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch departments' });
    }
});



module.exports = router;
