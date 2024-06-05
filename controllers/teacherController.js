const bcrypt = require('bcryptjs');
const xml2js = require('xml2js');
const db = require('../config/db');

const uploadTeacherAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData);

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('Teacher');
            for (const row of rows) {
                const teacher_id = row.teacher_id && row.teacher_id[0];
                const Name = row.Name && row.Name[0];
                const Designation = row.Designation && row.Designation[0];
                const dept_id = row.dept_id && row.dept_id[0];
                const Abvr = row.Abvr && row.Abvr[0];
                const Email = row.Email && row.Email[0];
                const Password = row.Password && row.Password[0];
                const Phone = row.Phone && row.Phone[0];
                const resetToken = row.resetToken && row.resetToken[0];
                const resetTokenExpires = row.resetTokenExpires && row.resetTokenExpires[0];


                if (Name && Designation && dept_id && Abvr && Email && Password && Phone) {
                    const hashedPassword = await bcrypt.hash(Password, 10);
                    await insertXmlTeacherIntoDatabase({
                        teacher_id,
                        Name,
                        Designation,
                        dept_id,
                        Abvr,
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

const insertXmlTeacherIntoDatabase = (data) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Teacher (teacher_id, Name, Designation, dept_id, Abvr, Email, Password, Phone, resetToken, resetTokenExpires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [data.teacher_id, data.Name, data.Designation, data.dept_id, data.Abvr, data.Email, data.hashedPassword, data.Phone, data.resetToken, data.resetTokenExpires], (err, results) => {
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


const getTeacherByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Teacher WHERE email = ?";
        db.query(sql, [email], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};

const getTeacherByResetToken = (token) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Teacher WHERE resetToken = ? AND resetTokenExpires > NOW()";
        db.query(sql, [token], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};

module.exports = {
    uploadTeacherAsXML,
    getTeacherByEmail,
    getTeacherByResetToken
};
