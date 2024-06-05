const express = require('express');
const { uploadRoomAsXML } = require('../controllers/roomController');


const router = express.Router();

router.post('/upload-room', uploadRoomAsXML);

module.exports = router;