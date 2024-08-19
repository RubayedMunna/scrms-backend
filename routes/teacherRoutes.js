const bcrypt = require('bcryptjs');
const express = require('express');
const { uploadTeacherAsXML } = require('../controllers/teacherController');
const { getTeachersByDeptId } = require('../controllers/teacherController')
const { getTeacherById } = require('../controllers/teacherController')
const { getDepartmentByTeacherId } = require('../controllers/DeptController');
const { updateTeacherById } = require('../controllers/teacherController');
const { getTeacherDesignations } = require('../controllers/teacherController');
const {
    updateTeacherProfile,
    deleteTeacherById,
    addNewTeacher
} = require('../controllers/teacherController');

const router = express.Router();

router.post('/upload-teacher', uploadTeacherAsXML);

router.get('/department-teacher/:dept_id', async (req, res) => {
    const { dept_id } = req.params;
    // console.log(dept_id);
    try {
        const teachers = await getTeachersByDeptId(dept_id);
        // console.log(teachers);
        res.json(teachers);
    } catch (err) {
        console.error('Error fetching teachers:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.get('/teacher-profile/:id', async (req, res) => {
    const teacher_id = req.params.id;
    // console.log(teacher_id);
    try {
        const teacher = await getTeacherById(teacher_id);
        // console.log(teacher);
        const department = await getDepartmentByTeacherId(teacher_id);
        // console.log(department);
        if (teacher) {
            res.json({
                teacher_id: teacher.teacher_id,
                Name: teacher.Name,
                profileImage: teacher.profileImage,
                Designation: teacher.Designation,
                dept_id: teacher.dept_id,
                Abvr: teacher.Abvr,
                Email: teacher.Email,
                Phone: teacher.Phone,
                Department: department.Dept_Name
            });
        } else {
            res.status(404).json({ message: 'Teacher not found' });
        }
    } catch (err) {
        console.error('Error fetching teacher details:', err);
        res.status(500).json({ error: 'Failed to fetch teacher details' });
    }
});

router.get('/teacher-designations', async (req, res) => {
    try {
        const designations = await getTeacherDesignations();
        res.json(designations);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch designations' });
    }
});


router.put('/teacher-profile/:id', async (req, res) => {
    const teacher_id = req.params.id;
    const data = req.body;

    try {
        await updateTeacherProfile(teacher_id, data);
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (err) {
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// POST route to add a new teacher
router.post('/add-teacher/:dept_id', async (req, res) => {
    const { dept_id } = req.params;
    const { Name, Designation, Abvr, Email, Phone, Password } = req.body;
    const hashedPassword = await bcrypt.hash(Password, 10);
    // console.log(hashedPassword);

    try {
        await addNewTeacher({ Name, Designation, dept_id, Abvr, Email, Phone, hashedPassword });
        res.status(201).json({ message: 'Teacher added successfully!' });
    } catch (error) {
        console.error('Failed to add teacher:', error);
        res.status(500).json({ error: 'Failed to add teacher' });
    }
});

// DELETE route to delete a teacher
router.delete('/delete-teacher/:teacher_id', async (req, res) => {
    const { teacher_id } = req.params;

    try {
        await deleteTeacherById(teacher_id);
        res.status(200).json({ message: 'Teacher deleted successfully!' });
    } catch (error) {
        console.error('Failed to delete teacher:', error);
        res.status(500).json({ error: 'Failed to delete teacher' });
    }
});



module.exports = router;