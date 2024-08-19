//models/teacherModel.js
const db = require('../config/db');

const createXmlDataTeacherTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Teacher (
            teacher_id INT AUTO_INCREMENT PRIMARY KEY,
            Name VARCHAR(255) NOT NULL,
            profileImage VARCHAR(255),
            Designation ENUM('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer') NOT NULL,
            dept_id INT,
            Abvr VARCHAR(255),
            Email VARCHAR(255),
            Password VARCHAR(700),
            Phone VARCHAR(255),
            resetToken VARCHAR(255),
            resetTokenExpires DATETIME,
            FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('Teacher table created or already exists');
    });
};

const updateProfileImage = (teacher_id, profileImage, callback) => {
    const query = `
      UPDATE Teacher
      SET profileImage = ?
      WHERE teacher_id = ?;
    `;
    db.query(query, [profileImage, teacher_id], callback);
};

module.exports = {
    createXmlDataTeacherTable,
    updateProfileImage
}