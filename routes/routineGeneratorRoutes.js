const express = require('express');
const cors = require('cors');
const routineGeneratorController = require('../controllers/routineGeneratorController');
const app = express();
const port = 5001;

// Use CORS middleware
app.use(cors());

// Use the upload middleware and controller for handling file uploads
app.post('/api/upload-teachers-preference', routineGeneratorController.upload.single('file'), routineGeneratorController.uploadFile);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = app;
