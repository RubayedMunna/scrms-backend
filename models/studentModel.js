
const db = require('../config/db');

const createXmlDataStudentTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Student (
            student_id INT AUTO_INCREMENT PRIMARY KEY,
            Name VARCHAR(255) NOT NULL,
            Gender ENUM('Male', 'Female') NOT NULL,
            session_id INT NOT NULL,
            Class_roll VARCHAR(255) NOT NULL,
            Exam_roll VARCHAR(255) UNIQUE NOT NULL,
            Registration_no VARCHAR(255) UNIQUE NOT NULL,
            Email VARCHAR(255) NOT NULL,
            Password VARCHAR(700) NOT NULL,
            Phone VARCHAR(255) NOT NULL,
            resetToken VARCHAR(255),
            resetTokenExpires DATETIME,
            FOREIGN KEY (session_id) REFERENCES Session(session_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('Student table created or already exists');
    });
};

module.exports = {
    createXmlDataStudentTable
}