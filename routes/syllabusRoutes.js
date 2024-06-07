const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { uploadTeacherAsXML } = require('../controllers/syllabusController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload-syllabus', upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    const filePath = req.file.path;

    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            return res.status(500).send({ message: 'Error reading file', error: err });
        }

        uploadTeacherAsXML(data)
            .then(() => {
                fs.unlink(filePath, (unlinkErr) => {
                    if (unlinkErr) {
                        console.error('Error deleting file:', unlinkErr);
                    }
                });
                res.status(200).send({ message: 'File uploaded and data inserted successfully' });
            })
            .catch((uploadErr) => {
                console.error('Error uploading XML:', uploadErr);
                res.status(500).send({ message: 'Error uploading XML', error: uploadErr });
            });
    });
});

module.exports = router;
