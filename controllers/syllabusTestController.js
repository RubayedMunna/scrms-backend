
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


// Helper function to get foreign keys based on input data
const getForeignKeys = async (departmentName, sessionName, examYear) => {
    return new Promise((resolve, reject) => {
        db.query('SELECT dept_id FROM department WHERE Dept_Name = ?', [departmentName], (err, departmentResult) => {
            if (err || departmentResult.length === 0) {
                return reject('Department not found');
            }
            const deptId = departmentResult[0].dept_id;

            db.query('SELECT session_id FROM session WHERE dept_id = ? AND Session_name = ?', [deptId, sessionName], (err, sessionResult) => {
                if (err || sessionResult.length === 0) {
                    return reject('Session not found');
                }
                const sessionId = sessionResult[0].session_id;

                db.query('SELECT exam_year_id FROM examyear WHERE session_id = ? AND Exam_year = ?', [sessionId, examYear], (err, examYearResult) => {
                    if (err || examYearResult.length === 0) {
                        return reject('Exam year not found');
                    }
                    const examYearId = examYearResult[0].exam_year_id;
                    resolve(examYearId);
                });
            });
        });
    });
};

// Endpoint to handle file upload
router.post('/', upload.single('file'), async (req, res) => {
    const filePath = req.file.path;
    const { department_name, session_name, exam_year } = req.body;  // Extract additional input data

    try {
        const examYearId = await getForeignKeys(department_name, session_name, exam_year);  // Get foreign keys

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
                        exam_year_id: examYearId,  // Use the dynamic exam year ID
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
    } catch (error) {
        res.status(500).send({ message: error });
    }
});

module.exports = router;
