
const db = require('../config/db');

const createXmlDataSessionTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Session (
            session_id INT AUTO_INCREMENT PRIMARY KEY,
            dept_id INT,
            Session_name VARCHAR(255) NOT NULL,
            FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('Session table created or already exists');
    });
};

module.exports = {
    createXmlDataSessionTable
}