const bcrypt = require('bcryptjs')
const express = require('express');
const { 
    uploadStudentAsXML,
    getStudentsBySessionId,
    updateStudentProfile,
    getStudentById,
    deleteStudentById,
    addNewStudent
} = require('../controllers/studentController');
const {
    getDepartmentByStudentId
} = require('../controllers/DeptController');


const router = express.Router();

router.post('/upload-student', uploadStudentAsXML);

// Get Student by session ID
router.get('/session-students/:session_id', async (req, res) => {
    const { session_id } = req.params;
    // console.log(session_id);
    try {
        const students = await getStudentsBySessionId(session_id);
        // console.log(students);
        res.status(200).json(students);
    } catch (err) {
        console.error('Failed to fetch students:', err);
        res.status(500).json({ error: 'Failed to fetch students' });
    }
});


// Fetch student profile
router.get('/student-profile/:student_id', async (req, res) => {
    const { student_id } = req.params;
    // console.log(student_id);
    try {
        const student = await getStudentById(student_id);
        // console.log(student);
        const department = await getDepartmentByStudentId(student_id);
        // console.log(department);
        if (student) {
            res.json({student, department});
        } else {
            res.status(404).json({ error: 'Student not found' });
        }
    } catch (error) {
        console.error('Error fetching student profile:', error);
        res.status(500).json({ error: 'Failed to fetch student profile' });
    }
});


// Update student profile
router.put('/update-student-profile/:student_id', async (req, res) => {
    const { student_id } = req.params;
    const updatedData = req.body;

    try {
        await updateStudentProfile(student_id, updatedData);
        res.json({ message: 'Student profile updated successfully' });
    } catch (error) {
        console.error('Error updating student profile:', error);
        res.status(500).json({ error: 'Failed to update student profile' });
    }
});

router.delete('/delete-student/:student_id', async (req, res) => {
    const { student_id } = req.params;
    // console.log(student_id);
    try {
        const result = await deleteStudentById(student_id);
        if (result.error) {
            return res.status(404).json(result);
        }
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new student
router.post('/add-student', async (req, res) => {
    const studentData = req.body;
    const Password = req.body.Password;
    const hashedPassword = await bcrypt.hash(Password, 10);
    // console.log("hello")
    try {
        const result = await addNewStudent(studentData,hashedPassword);
        res.status(201).json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


module.exports = router;