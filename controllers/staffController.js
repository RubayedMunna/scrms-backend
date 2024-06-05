const bcrypt = require('bcryptjs');
const xml2js = require('xml2js');
const db = require('../config/db');

const uploadStaffAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData);

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('Staff');
            for (const row of rows) {
                const staff_id = row.staff_id && row.staff_id[0];
                const Name = row.Name && row.Name[0];
                const Role = row.Role && row.Role[0];
                const dept_id = row.dept_id && row.dept_id[0];
                const Email = row.Email && row.Email[0];
                const Password = row.Password && row.Password[0];
                const Phone = row.Phone && row.Phone[0];
                const resetToken = row.resetToken && row.resetToken[0];
                const resetTokenExpires = row.resetTokenExpires && row.resetTokenExpires[0];

                if (staff_id && Name && Role && dept_id && Email && Password && Phone) {
                    const hashedPassword = await bcrypt.hash(Password, 10);
                    await insertXmlStaffIntoDatabase({
                        staff_id,
                        Name,
                        Role,
                        dept_id,
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

const insertXmlStaffIntoDatabase = (data) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Staff (staff_id, Name, Role, dept_id, Email, Password, Phone , resetToken, resetTokenExpires) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)';
        db.query(query, [data.staff_id, data.Name, data.Role, data.dept_id, data.Email, data.hashedPassword, data.Phone, data.resetToken, data.resetTokenExpires], (err, results) => {
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


const getStaffByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Staff WHERE email = ?";
        db.query(sql, [email], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};

const getStaffByResetToken = (token) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM Staff resetToken = ? AND resetTokenExpires > NOW()";
        db.query(sql, [token], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};


module.exports = {
    uploadStaffAsXML,
    getStaffByEmail,
    getStaffByResetToken
};
