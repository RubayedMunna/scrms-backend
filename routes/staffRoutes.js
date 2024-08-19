const bcrypt = require('bcryptjs')
const express = require('express');
const { uploadStaffAsXML } = require('../controllers/staffController');

const {
    getStaffByDepartmentId,
    getStaffById,
    updateStaffById,
    addNewStaffToDepartment,
    deleteDepartmentStaffById
} = require('../controllers/staffController');

const {
    getDepartmentByStaffId
} = require('../controllers/DeptController');


const { uploadHolidaysAsXML, getHolidays } = require('../controllers/holidayController');

const router = express.Router();

router.post('/upload-staff', uploadStaffAsXML);
router.post('/upload-holidays', uploadHolidaysAsXML);
router.get('/holidays', async (req, res) => {
    try {
        const holidays = await getHolidays();
        res.json(holidays);
    } catch (error) {
        res.status(500).send('Error fetching holidays data.');
    }
});

router.get('/department-staff/:dept_id', async (req, res) => {
    const dept_id = req.params.dept_id;

    try {
        const staff = await getStaffByDepartmentId(dept_id);

        if (staff.length > 0) {
            res.json(staff);
        } else {
            res.status(404).json({ message: 'No staff found for the given department' });
        }
    } catch (error) {
        console.error('Failed to retrieve staff:', error);
        res.status(500).json({ error: 'Failed to retrieve staff' });
    }
});


// Route to fetch staff profile by staff_id
router.get('/staff-profile/:staff_id', async (req, res) => {
    const { staff_id } = req.params;
    // console.log("hello");
    // console.log(staff_id);

    try {
        const staff = await getStaffById(staff_id);
        // console.log(staff);
        const department = await getDepartmentByStaffId(staff_id);
        // console.log(department)
        if (staff) {
            res.json({ staff, department: department.Dept_Name });
        } else {
            res.status(404).json({ message: 'Staff not found' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error fetching staff profile' });
    }
});

// Route to update staff profile by staff_id
router.put('/update-staff-profile/:staff_id', async (req, res) => {
    const { staff_id } = req.params;
    const updatedData = req.body;
    try {
        const result = await updateStaffById(staff_id, updatedData);
        if (result.affectedRows > 0) {
            res.json({ message: 'Staff profile updated successfully' });
        } else {
            res.status(404).json({ message: 'Staff not found or no changes made' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Error updating staff profile' });
    }
});

// POST route to add a new staff member
router.post('/add-department-staff/:dept_id', async (req, res) => {
    const { dept_id } = req.params;
    const staffData = req.body;

    const Password = req.body.Password
    const hashedPassword = await bcrypt.hash(Password, 10);
    // console.log(hashedPassword);
    try {
        await addNewStaffToDepartment(dept_id, staffData, hashedPassword);
        res.status(201).json({ message: 'Staff added successfully!' });
    } catch (error) {
        console.error('Failed to add staff:', error);
        res.status(500).json({ error: 'Failed to add staff' });
    }
});

// DELETE route to delete a staff member
router.delete('/delete-department-staff/:staff_id', async (req, res) => {
    const { staff_id } = req.params;

    try {
        await deleteDepartmentStaffById(staff_id);
        res.status(200).json({ message: 'Staff deleted successfully!' });
    } catch (error) {
        console.error('Failed to delete staff:', error);
        res.status(500).json({ error: 'Failed to delete staff' });
    }
});


router.post('/upload-holidays', uploadHolidaysAsXML);
router.get('/holidays', async (req, res) => {
    try {
        const holidays = await getHolidays();
        res.json(holidays);
    } catch (error) {
        res.status(500).send('Error fetching holidays data.');
    }
});

module.exports = router;