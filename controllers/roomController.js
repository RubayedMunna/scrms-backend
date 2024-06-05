const bcrypt = require('bcryptjs');
const xml2js = require('xml2js');
const db = require('../config/db');

const uploadRoomAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData);

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('Room');
            for (const row of rows) {
                var room_id = row.room_id && row.room_id[0];
                const Room_no = row.Room_no && row.Room_no[0];
                const Room_type = row.Room_type && row.Room_type[0];
                const Capacity = row.Capacity && row.Capacity[0];
                const dept_id = row.dept_id && row.dept_id[0];

                if (room_id && Room_no && Room_type && Capacity && dept_id) {
                    
                    await insertXmlRoomIntoDatabase({
                        room_id,
                        Room_no,
                        Room_type,
                        Capacity,
                        dept_id
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

const insertXmlRoomIntoDatabase = (data) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Room (room_id, Room_no, Room_type, Capacity, dept_id) VALUES (?, ?, ?, ?, ?)';
        db.query(query, [data.room_id, data.Room_no, data.Room_type, data.Capacity, data.dept_id], (err, results) => {
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
    uploadRoomAsXML
};
