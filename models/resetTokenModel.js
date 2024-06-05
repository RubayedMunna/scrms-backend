
const db = require('../config/db');

const createResetTokenTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS ResetToken (
            id INT PRIMARY KEY AUTO_INCREMENT,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            resetToken VARCHAR(255),
            resetTokenExpires DATETIME
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('Room table created or already exists');
    });
};

module.exports = {
    createResetTokenTable
}