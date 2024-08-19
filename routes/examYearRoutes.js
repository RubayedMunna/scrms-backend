const express = require('express');
const { uploadExamYearAsXML } = require('../controllers/examYearController');
const { 
    getExamYearsByDepartmentId,
    getExamYearsBySessionId,
    addNewExamYear,
    deleteExamYear
} = require('../controllers/examYearController')

const router = express.Router();

router.post('/upload-exam-year', uploadExamYearAsXML);

router.get('/department-examyear/:dept_id', async (req, res) => {
    const dept_id = req.params.dept_id;
    // console.log(dept_id);
    try {
        const examYears = await getExamYearsByDepartmentId(dept_id);
        // console.log(examYears);
        if (examYears.length > 0) {
            res.json(examYears);
        } else {
            res.status(404).json({ message: 'No exam years found for the given department' });
        }
    } catch (error) {
        console.error('Failed to retrieve exam years:', error);
        res.status(500).json({ error: 'Failed to retrieve exam years' });
    }
});

// Get exam years by session ID
router.get('/session-examyear/:session_id', async (req, res) => {
    const { session_id } = req.params;
    // console.log(session_id);
    try {
        const examYears = await getExamYearsBySessionId(session_id);
        // console.log(examYears);
        res.status(200).json(examYears);
    } catch (err) {
        console.error('Failed to fetch exam years:', err);
        res.status(500).json({ error: 'Failed to fetch exam years' });
    }
});

router.post('/add-new-examyear', addNewExamYear);
router.delete('/delete-examyear/:exam_year_id', deleteExamYear);

module.exports = router;