const express = require('express');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const router = express.Router();

const app = express();
const port = 5004;

// MySQL connection setup
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'db_class_routine'
});

db.connect((err) => {
    if (err) throw err;
    console.log('MySQL Connected...');
});

// Enable CORS for the React frontend
app.use(cors());

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Route to upload profile picture
app.post('/upload/:teacher_id', upload.single('profileImage'), (req, res) => {
    const teacherId = req.params.teacher_id;
    const profileImagePath = `/uploads/${req.file.filename}`;

    const sql = `UPDATE Teacher SET profileImage = ? WHERE teacher_id = ?`;

    db.query(sql, [profileImagePath, teacherId], (err, result) => {
        if (err) throw err;
        res.send('Profile image uploaded successfully.');
    });
});

// Serve static files
app.use('/uploads', express.static('uploads'));

// Route to get the list of teacher profiles
app.get('/teachers', (req, res) => {
    const sql = 'SELECT teacher_id, Name, profileImage, Designation, Email, Phone FROM Teacher';
    
    db.query(sql, (err, results) => {
        if (err) throw err;
        res.json(results);
    });
});


// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});

module.exports = router;