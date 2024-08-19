const express = require('express');
const { uploadDepartmentChairmanAsXML } = require('../controllers/departmentChairmanController');
const { getDepartmentChairmanByDeptId, updateDepartmentChairman } = require('../controllers/departmentChairmanController');



const router = express.Router();

router.post('/upload-department-chairman', uploadDepartmentChairmanAsXML);

router.get('/department-chairman/:dept_id', async (req, res) => {
    
    const { dept_id } = req.params;
    // console.log(dept_id);
    try {
        const chairman = await getDepartmentChairmanByDeptId(dept_id);
        if (chairman) {
            res.json(chairman);
        } else {
            res.status(404).json({ message: 'Chairman not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching the chairman details' });
    }
});

// Update department chairman
router.put('/update-department-chairman/:dept_id', async (req, res) => {
    const { teacher_id } = req.body;
    const { dept_id } = req.params;

    try {
        await updateDepartmentChairman(dept_id, teacher_id);
        res.status(200).json({ message: 'Department chairman updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update department chairman' });
    }
});


module.exports = router;