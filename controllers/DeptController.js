const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { getDepartmentBySessionId } = require('./sessionController');

// Function to handle uploading department data as XML
const uploadDeptAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData); // Log incoming data for debugging

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('Department'); // Clear the table before inserting new data

            for (const row of rows) {
                const dept_id = row.dept_id && row.dept_id[0];
                const Dept_Name = row.Dept_Name && row.Dept_Name[0];
                const Descript = row.Descript && row.Descript[0];
                const Phone = row.Phone && row.Phone[0];
                const Fax = row.Fax && row.Fax[0];
                const Email = row.Email && row.Email[0];

                // Check if all required fields are present
                if (Dept_Name && Descript && Phone && Fax && Email) {
                    await insertXmlDeptIntoDatabase({ dept_id, Dept_Name, Descript, Phone, Fax, Email });
                } else {
                    console.warn('Skipping incomplete row:', row);
                }
            }
            res.status(200).send('XML data imported successfully.');
        } catch (error) {
            console.error('Error importing XML data:', error);
            res.status(500).send('Error importing XML data.');
        }
    });
};

// Function to insert department data into the database
const insertXmlDeptIntoDatabase = (row) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Department (dept_id, Dept_Name, Descript, Phone, Fax, Email) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [row.dept_id, row.Dept_Name, row.Descript, row.Phone, row.Fax, row.Email], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const getAllDepartments = () => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Department';
        
        db.query(sql, (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result); // Return the list of departments
            } else {
                resolve([]); // Return an empty array if no departments are found
            }
        });
    });
};

const getDepartmentById = (dept_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Department WHERE dept_id = ?';
        
        db.query(sql, [dept_id], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result[0]); // Return the department object
            } else {
                resolve(null); // Return null if no department is found
            }
        });
    });
};

const getDepartmentByTeacherId = (teacher_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Department.* 
            FROM Teacher 
            INNER JOIN Department ON Teacher.dept_id = Department.dept_id 
            WHERE Teacher.teacher_id = ?`;

        db.query(sql, [teacher_id], (err, result) => {
            if (err) {
                console.error('Error fetching department details:', err);
                return reject(err);
            }

            if (result.length > 0) {
                resolve(result[0]);
            } else {
                resolve(null); // No department found
            }
        });
    });
};


const getDepartmentByStudentId = (student_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Department.* 
            FROM Student
            INNER JOIN Session ON Student.session_id = Session.session_id
            INNER JOIN Department ON Session.dept_id = Department.dept_id
            WHERE Student.student_id = ?`;

        db.query(sql, [student_id], (err, result) => {
            if (err) {
                return reject(err);
            }
            if (result.length > 0) {
                resolve(result[0]); // Return the department object
            } else {
                resolve(null); // No department found
            }
        });
    });
};

const getDepartmentByStaffId = (staff_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Department.* 
            FROM Staff 
            INNER JOIN Department ON Staff.dept_id = Department.dept_id 
            WHERE Staff.staff_id = ?`;

        db.query(sql, [staff_id], (err, result) => {
            if (err) {
                console.error('Error fetching department details:', err);
                return reject(err);
            }

            if (result.length > 0) {
                resolve(result[0]);
            } else {
                resolve(null); // No department found
            }
        });
    });
};


// Function to clear the specified table
const clearTable = (tableName) => {
    return new Promise((resolve, reject) => {
        const query = `DELETE FROM ${tableName}`;
        db.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const getDeptIdAndNames = () => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT dept_id, Dept_Name FROM Department";
        db.query(sql, (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

module.exports = {
    uploadDeptAsXML,
    getAllDepartments,
    getDepartmentById,
    getDepartmentByTeacherId,
    getDeptIdAndNames,
    getDepartmentByStudentId,
    getDepartmentByStaffId
};
