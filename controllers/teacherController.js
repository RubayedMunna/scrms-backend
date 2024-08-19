//controllers/teacherController.js

const bcrypt = require('bcryptjs');
const xml2js = require('xml2js');
const db = require('../config/db');
const { updateProfileImage } = require('../models/teacherModel')
const multer = require('multer');
const path = require('path');

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

const getTeacherDesignations = () => {
    return new Promise((resolve, reject) => {
        const sql = "SHOW COLUMNS FROM Teacher LIKE 'Designation'";
        db.query(sql, (err, result) => {
            if (err) return reject(err);
            const type = result[0].Type;
            const values = type.substring(5, type.length - 1).split(',');
            const designations = values.map(value => value.replace(/'/g, ""));
            resolve(designations);
        });
    });
};

const getTeachersByDeptId = (dept_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Teacher.* 
            FROM Teacher 
            WHERE Teacher.dept_id = ?`;
        db.query(sql, [dept_id], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result); // Return the list of teachers
            } else {
                resolve([]); // Return an empty array if no teachers are found
            }
        });
    });
};

const getTeacherById = (teacher_id) => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT * FROM Teacher WHERE teacher_id = ?`;

        db.query(sql, [teacher_id], (err, result) => {
            if (err) {
                return reject(err);
            }
            if (result.length > 0) {
                resolve(result[0]);
            } else {
                resolve(null); // No teacher found
            }
        });
    });
};


const updateTeacherById = (teacher_id, updateData) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE Teacher 
            SET Name = ?, Designation = ?, dept_id = ?, Abvr = ?, Email = ?, Phone = ? 
            WHERE teacher_id = ?`;

        const { Name, Designation, dept_id, Abvr, Email, Phone } = updateData;

        db.query(sql, [Name, Designation, dept_id, Abvr, Email, Phone, teacher_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};



//Get Department of teacher
const getDepartmentByTeacherId = (teacher_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            SELECT Department.* 
            FROM Teacher 
            INNER JOIN Department ON Teacher.dept_id = Department.dept_id 
            WHERE Teacher.teacher_id = ?`;
        db.query(sql, [teacher_id], (err, result) => {
            if (err) return reject(err);
            if (result.length > 0) {
                resolve(result[0]);
            } else {
                resolve(null); // No department found
            }
        });
    });
};



// Set up Multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './uploads/'); // Ensure this directory exists
    },
    filename: (req, file, cb) => {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 1000000 }, // 1MB limit
    fileFilter: (req, file, cb) => {
        checkFileType(file, cb);
    },
}).single('profileImage'); // Ensure 'profileImage' matches the name in the formData


function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb('Error: Images Only!');
    }
}

const uploadTeacherImage = (req, res) => {
    const teacher_id = req.params.id;
    console.log(teacher_id)
    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    console.log('Uploaded file:', req.file);

    const profileImage = req.file.filename;

    updateProfileImage(teacher_id, profileImage, (err, result) => {
        if (err) {
            console.error('Error updating profile image in DB:', err);
            return res.status(500).json({ message: 'Database error', error: err.message });
        }

        res.status(200).json({ message: 'Profile image uploaded successfully', profileImage });
    });
};


const updateTeacherProfile = (teacher_id, data) => {
    return new Promise((resolve, reject) => {
        const sql = `
            UPDATE Teacher 
            SET Name = ?, Designation = ?, dept_id = ?, Abvr = ?, Email = ?, Phone = ?
            WHERE teacher_id = ?`;
        db.query(sql, [data.Name, data.Designation, data.dept_id, data.Abvr, data.Email, data.Phone, teacher_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};


// Database operation function to add a new teacher
const addNewTeacher = ({ Name, Designation, dept_id, Abvr, Email, Phone, hashedPassword }) => {
    
    return new Promise((resolve, reject) => {
        const sql = `
            INSERT INTO Teacher (Name, Designation, dept_id, Abvr, Email, Phone, Password) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        db.query(sql, [Name, Designation, dept_id, Abvr, Email, Phone, hashedPassword], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};

// Database operation function to delete a teacher
const deleteTeacherById = (teacher_id) => {
    return new Promise((resolve, reject) => {
        const sql = `
            DELETE FROM Teacher WHERE teacher_id = ?
        `;
        db.query(sql, [teacher_id], (err, result) => {
            if (err) return reject(err);
            resolve(result);
        });
    });
};


module.exports = {
    uploadTeacherAsXML,
    getTeacherByEmail,
    getTeacherByResetToken,
    uploadTeacherImage,
    getDepartmentByTeacherId,
    getTeachersByDeptId,
    getTeacherById,
    updateTeacherById,
    getTeacherDesignations,
    updateTeacherProfile,
    addNewTeacher,
    deleteTeacherById
};
