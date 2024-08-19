const express = require('express');
const cors = require('cors');
const routineGeneratorController = require('../controllers/routineGeneratorControllerTest');
const app = express();
const port = 5001;
const db = require('../config/db');

// Use CORS middleware
app.use(cors());
app.use(express.json());

// Use the upload middleware and controller for handling file uploads
app.post('/api/upload-teachers-preference', routineGeneratorController.upload.single('file'), routineGeneratorController.uploadFile);
app.post('/api/add-schedule-entry', routineGeneratorController.addScheduleEntry);
app.put('/api/update-schedule-entry', routineGeneratorController.updateScheduleEntry);
app.get('/api/schedule', routineGeneratorController.getScheduleByDepartment);

app.delete('/api/delete-schedule-entry', (req, res) => {
    const { id, department } = req.body;

    if (!id || !department) {
        return res.status(400).send('ID and department are required.');
    }

    // Fetch department ID from the department name
    const deptQuery = 'SELECT dept_id FROM Department WHERE Dept_Name = ?';
    db.query(deptQuery, [department], (err, results) => {
        if (err) {
            console.error('Error fetching department ID:', err);
            return res.status(500).send('Server error.');
        }

        if (results.length === 0) {
            return res.status(400).send('Invalid department name.');
        }

        const dept_id = results[0].dept_id;

        // Delete the schedule entry with the given id and dept_id
        const deleteQuery = 'DELETE FROM Schedule WHERE id = ? AND dept_id = ?';
        db.query(deleteQuery, [id, dept_id], (err, results) => {
            if (err) {
                console.error('Error deleting schedule entry:', err);
                return res.status(500).send('Server error.');
            }

            res.send('Schedule entry deleted successfully.');
        });
    });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
