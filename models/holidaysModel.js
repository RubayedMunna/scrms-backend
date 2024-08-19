const db = require('../config/db');

// Create the Holidays table if it doesn't exist
const createHolidayTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Holidays (
            holiday_id INT AUTO_INCREMENT PRIMARY KEY,
            event_name VARCHAR(255) NOT NULL,
            start_date DATE NOT NULL,
            end_date DATE NOT NULL,
            num_days INT NOT NULL
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating Holidays table:', err);
            throw err;
        }
        console.log('Holidays table created or already exists');
    });
};

// Clear the Holidays table
const clearHolidayTable = (callback) => {
    const query = 'DELETE FROM Holidays';
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error clearing Holidays table:', err);
            throw err;
        }
        console.log('Holidays table cleared');
        if (callback) callback(); // Call the callback if provided
    });
};

// Function to handle file upload
const uploadHolidaysFile = (filePath) => {
    // Clear the Holidays table before uploading new data
    clearHolidayTable(() => {
        // After clearing the table, proceed with file upload logic here
        // You can add code to read the file and insert new holiday data into the table
    });
};

module.exports = {
    createHolidayTable,
    clearHolidayTable,
    uploadHolidaysFile // Export the upload function
};
