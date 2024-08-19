const bcrypt = require('bcryptjs');
const xml2js = require('xml2js');
const db = require('../config/db');

const uploadDepartmentChairmanAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData);

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('DepartmentChairman');
            for (const row of rows) {
                const dept_id = row.dept_id && row.dept_id[0];
                const teacher_id = row.teacher_id && row.teacher_id[0];
                

                if (dept_id && teacher_id) {
                    
                    await insertXmlTeacherIntoDatabase({
                        dept_id,
                        teacher_id
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
        const query = 'INSERT INTO DepartmentChairman (dept_id, teacher_id) VALUES (?, ?)';
        db.query(query, [data.dept_id, data.teacher_id], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};


const getDepartmentChairmanByDeptId = (dept_id) => {
    // console.log(dept_id);
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Teacher.* 
            FROM DepartmentChairman 
            INNER JOIN Teacher ON DepartmentChairman.teacher_id = Teacher.teacher_id 
            WHERE DepartmentChairman.dept_id = ?`;
        db.query(sql, [dept_id], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result[0]); // Return the chairman details
            } else {
                resolve(null); // No chairman found
            }
        });
    });
};

// Function to update department chairman
const updateDepartmentChairman = (dept_id, teacher_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE DepartmentChairman
            SET teacher_id = ?
            WHERE dept_id = ?`;
        db.query(sql, [teacher_id, dept_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
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

module.exports = {
    uploadDepartmentChairmanAsXML,
    getDepartmentChairmanByDeptId,
    updateDepartmentChairman
};
