
const db = require('../config/db');

const createCourseTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Course (
            course_id INT AUTO_INCREMENT PRIMARY KEY,
            exam_year_id INT NOT NULL,
            Course_code VARCHAR(10) NOT NULL,
            Couorse_credit INT NOT NULL,
            Course_title VARCHAR(255) NOT NULL,
            Course_type ENUM('Theory', 'Lab') NOT NULL,
            Contact_hour INT NOT NULL,
            Rationale TEXT NOT NULL,
            FOREIGN KEY (exam_year_id) REFERENCES ExamYear(exam_year_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('Course table created or already exists');
    });
};

const createPrerequisiteCourseTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS PrerequisiteCourse (
            prc_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            Prerequisite VARCHAR(255) NOT NULL,
            FOREIGN KEY (course_id) REFERENCES Course(course_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('Prerequisite table created or already exists');
    });
};

const createCourseChapterTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS CourseChapter (
            chapter_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            Chapter VARCHAR(255) NOT NULL,
            FOREIGN KEY (course_id) REFERENCES Course(course_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('CourseChapter table created or already exists');
    });
};

const createCourseObjectiveTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS CourseObjective (
            co_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            Objective TEXT NOT NULL,
            FOREIGN KEY (course_id) REFERENCES Course(course_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('CourseObjective table created or already exists');
    });
};

const createStudentLearningOutcomesTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS StudentLearningOutcome (
            slo_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            Outcome TEXT NOT NULL,
            FOREIGN KEY (course_id) REFERENCES Course(course_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('StudentLearningOutcome table created or already exists');
    });
};

const createRecommendedBookTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS RecommendedBook (
            book_id INT AUTO_INCREMENT PRIMARY KEY,
            course_id INT,
            Book_title VARCHAR(255) NOT NULL,
            Writer VARCHAR(255) NOT NULL,
            Edition INT NOT NULL,
            Publisher VARCHAR(255) NOT NULL,
            Publish_year VARCHAR(255) NOT NULL,
            FOREIGN KEY (course_id) REFERENCES Course(course_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('RecommendedBook table created or already exists');
    });
};



module.exports = {
    createCourseTable,
    createPrerequisiteCourseTable,
    createCourseChapterTable,
    createCourseObjectiveTable,
    createStudentLearningOutcomesTable,
    createRecommendedBookTable
};