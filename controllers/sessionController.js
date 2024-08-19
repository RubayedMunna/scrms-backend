const bcrypt = require('bcryptjs');
const xml2js = require('xml2js');
const db = require('../config/db');

const uploadSessionAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData);

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('Session');
            for (const row of rows) {
                const session_id = row.session_id && row.session_id[0];
                const dept_id = row.dept_id && row.dept_id[0];
                const Session_name = row.Session_name && row.Session_name[0];
                

                if (session_id && dept_id && Session_name) {
                    
                    await insertXmlSessionIntoDatabase({
                        session_id,
                        dept_id,
                        Session_name
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

const insertXmlSessionIntoDatabase = (data) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Session (session_id, dept_id, Session_name) VALUES (?, ?, ?)';
        db.query(query, [data.session_id, data.dept_id, data.Session_name], (err, results) => {
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

const getDepartmentBySessionId = (session_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Department.*
            FROM Session
            INNER JOIN Department ON Session.dept_id = Department.dept_id
            WHERE Session.session_id = ?;
        `;
        db.query(sql, [session_id], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result[0]); // Return the department details
            } else {
                resolve(null); // No department found
            }
        });
    });
};

const getSessionsByDepartmentId = (dept_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Session.*
            FROM Session
            INNER JOIN Department ON Session.dept_id = Department.dept_id
            WHERE Department.dept_id = ?`;
        
        db.query(sql, [dept_id], (err, rows) => {
            if (err) {
                console.error('Failed to fetch sessions:', err);
                return reject(err);
            }
            resolve(rows);
        });
    });
};

const getSessionById = (session_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Session.*
            FROM Session
            WHERE session_id = ?`;
        db.query(sql, [session_id], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result[0]);
            } else {
                resolve(null); // No session found
            }
        });
    });
};

// Node.js Function to Add New Session
const addNewSession = (dept_id, Session_name) => {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO Session (dept_id, Session_name) VALUES (?, ?)`;
        db.query(sql, [dept_id, Session_name], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Node.js Function to Delete Session
const deleteSessionById = (session_id) => {
    return new Promise((resolve, reject) => {
        const sql = `DELETE FROM Session WHERE session_id = ?`;
        db.query(sql, [session_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};



module.exports = {
    uploadSessionAsXML,
    getDepartmentBySessionId,
    getSessionsByDepartmentId,
    getSessionById,
    addNewSession,
    deleteSessionById
};
