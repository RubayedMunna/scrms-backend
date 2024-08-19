const bcrypt = require('bcryptjs');
const xml2js = require('xml2js');
const db = require('../config/db');

const uploadStudentAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData);

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('Student');
            for (const row of rows) {
                const student_id = row.student_id && row.student_id[0];
                const Name = row.Name && row.Name[0];
                const Gender = row.Gender && row.Gender[0];
                const session_id = row.session_id && row.session_id[0];
                const Class_roll = row.Class_roll && row.Class_roll[0];
                const Exam_roll = row.Exam_roll && row.Exam_roll[0];
                const Registration_no = row.Registration_no && row.Registration_no[0];
                const Email = row.Email && row.Email[0];
                const Password = row.Password && row.Password[0];
                const Phone = row.Phone && row.Phone[0];
                const resetToken = row.resetToken && row.resetToken[0];
                const resetTokenExpires = row.resetTokenExpires && row.resetTokenExpires[0];

                if (Name && Gender && session_id && Class_roll && Exam_roll && Registration_no && Email && Password && Phone) {
                    const hashedPassword = await bcrypt.hash(Password, 10);
                    await insertXmlStudentIntoDatabase({
                        student_id,
                        Name,
                        Gender,
                        session_id,
                        Class_roll,
                        Exam_roll,
                        Registration_no,
                        Email,
                        hashedPassword,
                        Phone,
                        resetToken,
                        resetTokenExpires
                    });
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

const insertXmlStudentIntoDatabase = (data) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Student (student_id, Name, Gender, session_id, Class_roll, Exam_roll, Registration_no, Email, Password, Phone, resetToken, resetTokenExpires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [data.student_id, data.Name, data.Gender, data.session_id, data.Class_roll, data.Exam_roll, data.Registration_no, data.Email, data.hashedPassword, data.Phone, data.resetToken, data.resetTokenExpires], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

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

const getStudentByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Student WHERE Email = ?";
        db.query(sql, [email], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};

const getStudentByResetToken = (token) => {
    
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Student WHERE resetToken = ? AND resetTokenExpires > NOW()";
        db.query(sql, [token], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};

const getSessionByStudentId = (student_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Session.*
            FROM Student
            INNER JOIN Session ON Student.session_id = Session.session_id
            WHERE Student.student_id = ?;
        `;
        db.query(sql, [student_id], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result[0]); // Return the session details
            } else {
                resolve(null); // No session found
            }
        });
    });
};
const getStudentsBySessionId = (session_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Student.*
            FROM Student
            WHERE Student.session_id = ?`;
        db.query(sql, [session_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};


const updateStudentProfile = (student_id, updatedData) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE Student 
            SET Name = ?, Gender = ?, Class_roll = ?, Exam_roll = ?, Registration_no = ?, Email = ?, Phone = ?
            WHERE student_id = ?`;
        
        const { Name, Gender, Class_roll, Exam_roll, Registration_no, Email, Phone } = updatedData;

        db.query(sql, [Name, Gender, Class_roll, Exam_roll, Registration_no, Email, Phone, student_id], (err, result) => {
            if (err) {
                return reject(err);
            }
            resolve(result);
        });
    });
};

const getStudentById = (student_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Student WHERE student_id = ?';

        db.query(sql, [student_id], (err, result) => {
            if (err) {
                return reject(err);
            }
            if (result.length > 0) {
                resolve(result[0]);
            } else {
                resolve(null); // No student found
            }
        });
    });
};

const deleteStudentById = (student_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'DELETE FROM Student WHERE student_id = ?';
        
        db.query(sql, [student_id], (err, result) => {
            if (err) {
                return reject(new Error('Failed to delete student'));
            }
            if (result.affectedRows > 0) {
                resolve({ message: 'Student deleted successfully' });
            } else {
                resolve({ error: 'Student not found' });
            }
        });
    });
};

const addNewStudent = (studentData, hashedPassword) => {
    return new Promise((resolve, reject) => {
        const { Name, Gender, session_id, Class_roll, Exam_roll, Registration_no, Email, Password, Phone } = studentData;
        const sql = `
            INSERT INTO Student (Name, Gender, session_id, Class_roll, Exam_roll, Registration_no, Email, Password, Phone)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        
        db.query(sql, [Name, Gender, session_id, Class_roll, Exam_roll, Registration_no, Email, hashedPassword, Phone], (err, result) => {
            if (err) {
                return reject(new Error('Failed to add student'));
            }
            resolve({ message: 'Student added successfully', student_id: result.insertId });
        });
    });
};

module.exports = {
    uploadStudentAsXML,
    getStudentByEmail,
    getStudentByResetToken,
    getSessionByStudentId,
    getStudentsBySessionId,
    updateStudentProfile,
    getStudentById,
    deleteStudentById,
    addNewStudent
};
