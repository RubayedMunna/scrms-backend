const express = require('express');
const { fetchCourseData } = require('../controllers/syllabusFilterController');
const router = express.Router();

router.post('/fetch-course-details', (req, res) => {
    const { departmentName, sessionName, examYear, courseName } = req.body;

    fetchCourseData(departmentName, sessionName, examYear, courseName, (err, courseData) => {
        if (err) {
            console.error('Error fetching course details:', err);
            return res.status(500).send('Error fetching course details');
        }
        
        res.json(courseData);
    });
});

module.exports = router;
