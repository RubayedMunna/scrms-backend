const express = require('express');
const multer = require('multer');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const mysql = require('mysql');

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
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Create uploads directory if it doesn't exist
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}

// Endpoint to handle file upload
router.post('/', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // Parse the XML file
    fs.readFile(filePath, (err, data) => {
        if (err) {
            return res.status(500).send({ message: 'Error reading file' });
        }

        xml2js.parseString(data, (err, result) => {
            if (err) {
                return res.status(500).send({ message: 'Error parsing XML' });
            }

            const syllabus = result.syllabus.course;
            for (const course of syllabus) {
                const courseData = {
                    course_id: null,  // Auto-incremented
                    exam_year_id: 1,  // Example exam year ID, adjust as needed
                    Course_code: course.course_code[0],
                    Couorse_credit: course.credit[0],
                    course_title: course.title[0],
                    course_type: course.type[0],
                    contact_hour: course.contact_hours[0],
                    rationale: course.rationale[0]
                };

                db.query('INSERT INTO Course SET ?', courseData, (err, result) => {
                    if (err) {
                        console.error('Error inserting course:', err);
                        return;
                    }

                    const courseId = result.insertId;

                    // Insert course chapters
                    for (const chapter of course.course_descriptions[0].chapter) {
                        db.query('INSERT INTO Coursechapter SET ?', { course_id: courseId, Chapter: chapter }, (err) => {
                            if (err) {
                                console.error('Error inserting chapter:', err);
                            }
                        });
                    }

                    // Insert course objectives
                    for (const objective of course.course_objectives[0].objective) {
                        db.query('INSERT INTO Courseobjective SET ?', { course_id: courseId, Objective: objective }, (err) => {
                            if (err) {
                                console.error('Error inserting objective:', err);
                            }
                        });
                    }

                    // Insert prerequisites
                    for (const prerequisite of course.prerequisites[0].prerequisite) {
                        db.query('INSERT INTO Prerequisitecourse SET ?', { course_id: courseId, Prerequisite: prerequisite }, (err) => {
                            if (err) {
                                console.error('Error inserting prerequisite:', err);
                            }
                        });
                    }

                    // Insert recommended books
                    for (const book of course.recommended_books[0].book) {
                        const bookData = {
                            course_id: courseId,
                            Book_title: book.title[0],
                            Writer: book.author[0],
                            Edition: book.edition[0],
                            Publisher: book.publisher[0],
                            Publish_year: book.year[0]
                        };

                        db.query('INSERT INTO Recommendedbook SET ?', bookData, (err) => {
                            if (err) {
                                console.error('Error inserting book:', err);
                            }
                        });
                    }

                    // Insert student learning outcomes
                    for (const outcome of course.student_learning_outcomes[0].outcome) {
                        db.query('INSERT INTO Studentlearningoutcome SET ?', { course_id: courseId, Outcome: outcome }, (err) => {
                            if (err) {
                                console.error('Error inserting outcome:', err);
                            }
                        });
                    }
                });
            }

            res.send({ message: 'File uploaded and data inserted successfully' });
        });
    });
});

module.exports = router;
