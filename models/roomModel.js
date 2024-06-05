
const db = require('../config/db');

const createXmlDataRoomTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Room (
            room_id INT AUTO_INCREMENT PRIMARY KEY,
            Room_no VARCHAR(255) NOT NULL,
            Room_type ENUM('Class Room', 'Lab Room', 'Lecture Hall', 'Computer Lab', 'Seminar Room') NOT NULL,
            Capacity INT NOT NULL,
            dept_id INT NOT NULL,
            FOREIGN KEY (dept_id) REFERENCES Department(dept_id)
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
    createXmlDataRoomTable
}