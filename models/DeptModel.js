const db = require('../config/db');

const createXmlDataDeptTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS Department (
            dept_id INT AUTO_INCREMENT PRIMARY KEY,
            Dept_Name VARCHAR(255),
            Descript VARCHAR(255),
            Phone VARCHAR(255),
            Fax VARCHAR(255),
            Email VARCHAR(255)
        )
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_dept_data table:', err);
            throw err;
        }
        console.log('Department table created or already exists');
    });
};

module.exports = {
    createXmlDataDeptTable
}