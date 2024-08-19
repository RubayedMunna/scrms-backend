const db = require('../config/db');

// Function to create the Schedule table
const createScheduleTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Schedule (
        
            id INT AUTO_INCREMENT PRIMARY KEY,
            day VARCHAR(50) NOT NULL,
            year VARCHAR(10) NOT NULL,
            time_slot VARCHAR(50) NOT NULL,
            additional_time_slot VARCHAR(50),  -- Added column for additional time slot
            teacher VARCHAR(255) NOT NULL,
            course VARCHAR(255) NOT NULL,
            room VARCHAR(255) NOT NULL,
            dept_id INT,  -- Added dept_id column
            FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating schedule table:', err);
            throw err;
        }
        console.log('Schedule table created or already exists');
    });
};




module.exports = {
    createScheduleTable
};
