const express = require('express');
const { uploadStaffAsXML } = require('../controllers/staffController');
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

module.exports = router;