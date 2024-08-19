const express = require('express');
const { 
    uploadSessionAsXML,
    getSessionsByDepartmentId,
    getSessionById,
    addNewSession,
    deleteSessionById
} = require('../controllers/sessionController');


const router = express.Router();

router.post('/upload-session', uploadSessionAsXML);

// Get Sessions by Department ID
router.get('/department-sessions/:dept_id', async (req, res) => {
    const { dept_id } = req.params;
    // console.log(dept_id);
    try {
        const sessions = await getSessionsByDepartmentId(dept_id);
        res.status(200).json(sessions);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch sessions' });
    }
});

// Get session details by ID
router.get('/sessions-byid/:session_id', async (req, res) => {
    const { session_id } = req.params;

    try {
        const session = await getSessionById(session_id);
        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }
        res.status(200).json(session);
    } catch (err) {
        console.error('Failed to fetch session details:', err);
        res.status(500).json({ error: 'Failed to fetch session details' });
    }
});


// Express Route to Handle Adding New Session
router.post('/add-department-session/:dept_id', async (req, res) => {
    const { Session_name } = req.body;
    // console.log(Session_name);
    const { dept_id } = req.params;
    // console.log(dept_id);
    try {
        const result = await addNewSession(dept_id, Session_name);
        res.status(200).json({ message: 'Session added successfully', session_id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Failed to add session', error });
    }
});



// Express Route to Handle Deleting Session
router.delete('/delete-department-session/:session_id', async (req, res) => {
    const { session_id } = req.params;

    try {
        const result = await deleteSessionById(session_id);
        res.status(200).json({ message: 'Session deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete session', error });
    }
});

module.exports = router;