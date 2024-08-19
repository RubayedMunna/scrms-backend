const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const multer = require('multer');
const db = require('../config/db');

// Ensure 'uploads/' directory exists
const uploadDir = path.join(__dirname, '../uploads_routine_csvfiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Function to handle file upload and processing
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        if (req.file.mimetype !== 'text/csv') {
            return res.status(400).send('Please upload a CSV file.');
        }

        const { department } = req.body; // Get department name from request body

        if (!department) {
            return res.status(400).send('Department name is required.');
        }

        // Fetch department ID from Department table
        const deptQuery = 'SELECT dept_id FROM Department WHERE Dept_Name = ?';
        db.query(deptQuery, [department], (err, results) => {
            if (err) {
                console.error('Error fetching department ID:', err);
                return res.status(500).send('Server error.');
            }

            if (results.length === 0) {
                return res.status(400).send('Invalid department name.');
            }

            const dept_id = results[0].dept_id;

            // Delete existing schedule data for the department
            const deleteQuery = 'DELETE FROM Schedule WHERE dept_id = ?';
            db.query(deleteQuery, [dept_id], (err) => {
                if (err) {
                    console.error('Error deleting existing schedule data:', err);
                    return res.status(500).send('Server error.');
                }

                // Path to the uploaded file
                const filePath = req.file.path;
                console.log('Uploaded file path:', filePath);

                // Run Python script using child_process.spawn
                const pythonProcess = spawn('python', [path.join(__dirname, '../python/schedule_generator1.py'), filePath]);

                let scriptOutput = '';

                pythonProcess.stdout.on('data', (data) => {
                    scriptOutput += data.toString();
                });

                pythonProcess.stderr.on('data', (data) => {
                    console.error('Python script error output:', data.toString());
                });

                pythonProcess.on('close', (code) => {
                    console.log(`Python script exited with code ${code}`);
                    try {
                        const schedule = JSON.parse(scriptOutput);

                        // Insert data into MySQL
                        for (const day in schedule) {
                            for (const timeSlot in schedule[day]) {
                                for (const year in schedule[day][timeSlot]) {
                                    const entries = schedule[day][timeSlot][year];
                                    for (const entry of entries) {
                                        const additionalTimeSlot = entry.additional_time_slot || null; // Handle additional time slot
                                        const query = `
                                            INSERT INTO Schedule (dept_id, day, year, time_slot, additional_time_slot, teacher, course, room)
                                            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                        `;
                                        const values = [
                                            dept_id,
                                            day,
                                            year,
                                            timeSlot,
                                            additionalTimeSlot,
                                            entry.teacher,
                                            entry.course,
                                            entry.room
                                        ];
                                        db.query(query, values, (err) => {
                                            if (err) {
                                                console.error('Error inserting schedule data:', err);
                                            }
                                        });
                                    }
                                }
                            }
                        }

                        // Log the results to the Node.js console
                        console.log('Generated Schedule:', schedule);

                        // Delete the file after processing
                        fs.unlink(filePath, (err) => {
                            if (err) console.error('Error deleting file:', err);
                        });

                        // Send the results back to the client as a JSON object
                        res.json(schedule);
                    } catch (parseError) {
                        console.error('JSON parse error:', parseError);
                        return res.status(500).send('Error parsing the schedule.');
                    }
                });
            });
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Server error.');
    }
};








const addScheduleEntry = (req, res) => {
    const { department, day, year, time_slot, additional_time_slot, teacher, course, room } = req.body;

    // Validate required fields
    if (!department || !day || !year || !time_slot || !teacher || !course || !room) {
        return res.status(400).send('All fields are required.');
    }

    // Fetch department ID from Department table
    const deptQuery = 'SELECT dept_id FROM Department WHERE Dept_Name = ?';
    db.query(deptQuery, [department], (err, results) => {
        if (err) {
            console.error('Error fetching department ID:', err);
            return res.status(500).send('Server error.');
        }

        if (results.length === 0) {
            return res.status(400).send('Invalid department name.');
        }

        const dept_id = results[0].dept_id;

        const query = `
            INSERT INTO Schedule (dept_id, day, year, time_slot, additional_time_slot, teacher, course, room)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [dept_id, day, year, time_slot, additional_time_slot, teacher, course, room];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Error adding schedule entry:', error);
                return res.status(500).send('Error adding entry.');
            }

            res.status(201).send('Entry added successfully.');
        });
    });
};

const updateScheduleEntry = (req, res) => {
    const { id, department, day, year, time_slot, additional_time_slot, teacher, course, room } = req.body;

    // Validate required fields
    if (!id || !department || !day || !year || !time_slot || !teacher || !course || !room) {
        return res.status(400).send('All fields are required.');
    }

    // Fetch department ID from Department table
    const deptQuery = 'SELECT dept_id FROM Department WHERE Dept_Name = ?';
    db.query(deptQuery, [department], (err, results) => {
        if (err) {
            console.error('Error fetching department ID:', err);
            return res.status(500).send('Server error.');
        }

        if (results.length === 0) {
            return res.status(400).send('Invalid department name.');
        }

        const dept_id = results[0].dept_id;

        const query = `
            UPDATE Schedule 
            SET dept_id = ?, day = ?, year = ?, time_slot = ?, additional_time_slot = ?, teacher = ?, course = ?, room = ? 
            WHERE id = ?
        `;
        const values = [dept_id, day, year, time_slot, additional_time_slot, teacher, course, room, id];

        db.query(query, values, (error, result) => {
            if (error) {
                console.error('Database update error:', error);
                return res.status(500).send('Error updating schedule entry.');
            }

            if (result.affectedRows === 0) {
                return res.status(404).send('Schedule entry not found.');
            }

            res.status(200).send('Schedule entry updated successfully.');
        });
    });
};




// Function to fetch schedule by department name
const getScheduleByDepartment = (req, res) => {
    const { department } = req.query; // Get department name from query parameters

    if (!department) {
        return res.status(400).send('Department name is required.');
    }

    // Fetch department ID from the database
    const deptQuery = 'SELECT dept_id FROM Department WHERE Dept_Name = ?';
    db.query(deptQuery, [department], (err, results) => {
        if (err) {
            console.error('Error fetching department ID:', err);
            return res.status(500).send('Server error.');
        }

        if (results.length === 0) {
            return res.status(400).send('Invalid department name.');
        }

        const dept_id = results[0].dept_id;

        // Fetch schedule data for the department
        const scheduleQuery = 'SELECT * FROM Schedule WHERE dept_id = ?';
        db.query(scheduleQuery, [dept_id], (err, results) => {
            if (err) {
                console.error('Error fetching schedule data:', err);
                return res.status(500).send('Server error.');
            }

            // Send the schedule data back to the client
            res.json(results);
        });
    });
};




// const deleteScheduleEntry = (req, res) => {
//     const { id, department } = req.body;

//     if (!id || !department) {
//         return res.status(400).send('ID and department are required.');
//     }

//     // Fetch department ID from the department name
//     const deptQuery = 'SELECT dept_id FROM Department WHERE Dept_Name = ?';
//     db.query(deptQuery, [department], (err, results) => {
//         if (err) {
//             console.error('Error fetching department ID:', err);
//             return res.status(500).send('Server error.');
//         }

//         if (results.length === 0) {
//             return res.status(400).send('Invalid department name.');
//         }

//         const dept_id = results[0].dept_id;

//         // Delete the schedule entry with the given id and dept_id
//         const deleteQuery = 'DELETE FROM Schedule WHERE id = ? AND dept_id = ?';
//         db.query(deleteQuery, [id, dept_id], (err, results) => {
//             if (err) {
//                 console.error('Error deleting schedule entry:', err);
//                 return res.status(500).send('Server error.');
//             }

//             if (results.affectedRows === 0) {
//                 return res.status(404).send('Schedule entry not found.');
//             }

//             res.send('Schedule entry deleted successfully.');
//         });
//     });
// };




module.exports = { upload, uploadFile, addScheduleEntry,updateScheduleEntry,getScheduleByDepartment};
