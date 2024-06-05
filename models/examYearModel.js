
const db = require('../config/db');

const createXmlDataExamYearTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS ExamYear (
            exam_year_id INT AUTO_INCREMENT PRIMARY KEY,
            session_id INT NOT NULL,
            Education_level ENUM('Graduate', 'Undergraduate', 'Postgraduate') NOT NULL,
            Exam_year INT NOT NULL,
            Year INT NOT NULL,
            Semester INT NOT NULL,
            Start_date DATE,
            End_date DATE,
            FOREIGN KEY (session_id) REFERENCES Session(session_id)
        );    
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('ExamYear table created or already exists');
    });
};

module.exports = {
    createXmlDataExamYearTable
}