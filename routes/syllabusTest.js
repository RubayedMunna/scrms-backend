const express = require('express');
const mysql = require('mysql');
const cors = require('cors');
const uploadRoute = require('../controllers/syllabusTestController');
const router = express.Router();
const app = express();
const port = 5000;

// Use CORS middleware
app.use(cors());

// Database connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "db_class_routine"
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to MySQL:', err);
        throw err;
    }
    console.log('Connected to MySQL database');
});

// Use routes
app.use('/upload', uploadRoute);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
module.exports = router;