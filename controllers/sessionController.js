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

module.exports = {
    uploadSessionAsXML
};
