//models/superUserModel.js

const db = require('../config/db');

const createSuperUserTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS SuperUser (
            admin_id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(700) NOT NULL,
            resetToken VARCHAR(255),
            resetTokenExpires DATETIME
        )
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating SuperUser table:', err);
            throw err;
        }
        console.log('SuperUser table created or already exists');
    });
};

module.exports = {
    createSuperUserTable
};
