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

const getRoomsByDepartmentId = (dept_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT * 
            FROM Room 
            WHERE dept_id = ?`;

        db.query(sql, [dept_id], (err, result) => {
            if (err) {
                console.error('Error fetching rooms:', err);
                return reject(err);
            }

            if (result.length > 0) {
                resolve(result);
            } else {
                resolve([]); // No rooms found
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

const getRoomById = (room_id) => {
    return new Promise((resolve, reject) => {
        const sql = 'SELECT * FROM Room WHERE room_id = ?';
        db.query(sql, [room_id], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};


// Get Room Type Enum Values
const getRoomTypes = () => {
    return new Promise((resolve, reject) => {
        const sql = `SHOW COLUMNS FROM Room LIKE 'Room_type'`;
        db.query(sql, (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                const enumValues = result[0].Type.replace(/^enum\('|'|\)$/g, '').split(',');
                resolve(enumValues.map(value => value.replace(/'/g, '')));
            } else {
                resolve([]);
            }
        });
    });
};

// Update Room Data
const updateRoom = (room_id, updatedData) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE Room
            SET Room_no = ?, Room_type = ?, Capacity = ?
            WHERE room_id = ?`;
        db.query(sql, [updatedData.Room_no, updatedData.Room_type, updatedData.Capacity, room_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Delete room
const deleteRoom = (req, res) => {
    const { room_id } = req.params;
    const sql = 'DELETE FROM Room WHERE room_id = ?';
    db.query(sql, [room_id], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (result.affectedRows > 0) {
            res.json({ message: 'Room deleted successfully' });
        } else {
            res.status(404).json({ error: 'Room not found' });
        }
    });
};

const addNewRoom = (Room_no, Room_type, Capacity, dept_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO Room (Room_no, Room_type, Capacity, dept_id)
            VALUES (?, ?, ?, ?)`;
        db.query(sql, [Room_no, Room_type, Capacity, dept_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

module.exports = {
    uploadRoomAsXML,
    getRoomsByDepartmentId,
    getRoomById,
    getRoomTypes,
    updateRoom,
    deleteRoom,
    addNewRoom
};
