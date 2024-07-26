const express = require('express');
const { fetchAllData } = require('../controllers/DataFilterController');
const router = express.Router();

router.get('/fetch-all-data', (req, res) => {
    fetchAllData((err, data) => {
        if (err) {
            console.error('Error fetching all data:', err);
            return res.status(500).send('Error fetching all data');
        }
        res.json(data);
    });
});

module.exports = router;
