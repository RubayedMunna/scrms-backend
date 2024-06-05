
const db = require('../config/db');

const createXmlDataStaffTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Staff (
            staff_id INT AUTO_INCREMENT PRIMARY KEY,
            Name VARCHAR(255) NOT NULL,
            Role VARCHAR(255),
            dept_id INT,
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
        console.log('Staff table created or already exists');
    });
};

module.exports = {
    createXmlDataStaffTable
}