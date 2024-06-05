
const db = require('../config/db');

const createChairmanToDepartmentTable = () => {
    const query = `
        CREATE TABLE IF NOT EXISTS DepartmentChairman (
            dept_id INT,
            teacher_id INT,
            PRIMARY KEY (dept_id, teacher_id),
            FOREIGN KEY (dept_id) REFERENCES Department(dept_id),
            FOREIGN KEY (teacher_id) REFERENCES Teacher(teacher_id)
        );
    `;
    db.query(query, (err, results) => {
        if (err) {
            console.error('Error creating xml_teacher_data table:', err);
            throw err;
        }
        console.log('Department-Chairman table created or already exists');
    });
};

module.exports = {
    createChairmanToDepartmentTable
}