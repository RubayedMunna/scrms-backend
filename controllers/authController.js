const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSuperUserByEmail } = require('../controllers/superUserController');
const { getTeacherByEmail, getDepartmentByTeacherId } = require('../controllers/teacherController');
const { getStudentByEmail } = require('../controllers/studentController');
const { getStaffByEmail } = require('../controllers/staffController');
const { getTeacherByResetToken } = require('../controllers/teacherController');
const { getStudentByResetToken } = require('../controllers/studentController');
const { getStaffByResetToken } = require('../controllers/staffController');
const { getSuperUserByResetToken } = require('../controllers/superUserController');
const { getDepartmentByStaffId} = require('../controllers/staffController');
const { getSessionByStudentId } = require('../controllers/studentController');
const { getDepartmentBySessionId } = require('../controllers/sessionController');
const { getAllDepartments } = require('../controllers/DeptController')
const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const { getUserByEmail, savePasswordResetToken, resetUserPassword, getUserByResetToken } = require('./userController');
const { use } = require('../routes/authRoute');


const login = async (req, res) => {
    const { email, password } = req.body;
    // console.log('hi')
    let user = await getSuperUserByEmail(email);
    if (user) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (isMatch) {
            const token = jwt.sign({ id: user.admin_id, role: 'SuperUser', email: user.email}, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'SuperUser' });
        }
    }
    
    user = await getTeacherByEmail(email);
    if (user) {
        const isMatch = bcrypt.compareSync(password, user.Password);
        if (isMatch) {
            const token = jwt.sign({ id: user.teacher_id, role: 'Teacher', email: user.Email }, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'Teacher' });
        }
    }

    user = await getStudentByEmail(email);
    if (user) {
        const isMatch = bcrypt.compareSync(password, user.Password);
        if (isMatch) {
            const token = jwt.sign({ id: user.student_id, role: 'Student', email: user.Email }, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'Student' });
        }
    }

    

    user = await getStaffByEmail(email);
    if (user) {
        const isMatch = bcrypt.compareSync(password, user.Password);
        if (isMatch) {
            const token = jwt.sign({ id: user.staff_id, role: 'Staff', email: user.Email }, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'Staff' });
        }
    }

    return res.status(401).send('Invalid credentials');
};

const fetchDepartments = async (req, res) => {
    // console.log("hello");
    try {
        // Call the function and store the result in the list
        let departmentList = await getAllDepartments();

        // Now departmentList contains all departments
        // console.log('Department List:', departmentList);

        res.json({departmentList});
    } catch (error) {
        console.error('Error fetching departments:', error);
    }
};

const getDashboardData = async (req, res) => {
    const { role,id,email} = req.user;
    // console.log(role);
    // console.log(email);
    switch (role) {
        case 'SuperUser':
            // Fetch data for SuperUser
            
            let user = await getSuperUserByEmail(email);
            res.json({ message: 'Welcome SuperUser!' ,user});
            break;
        case 'Teacher':
            // Fetch data for Teacher
            
            let teacher = await getTeacherByEmail(email);
            
            let dept = await getDepartmentByTeacherId(id);

            res.json({ message: 'Welcome Teacher!' ,teacher, dept});
            break;
        case 'Student':
            // Fetch data for Student
            try {
                const student = await getStudentByEmail(email);
                const student_session = await getSessionByStudentId(id);
                // console.log(student_session);
                if (student_session) {
                    const student_dept = await getDepartmentBySessionId(student_session.session_id);
                    // console.log(student_dept);
                    res.json({
                        message: 'Welcome Student!',
                        student,
                        student_session,
                        student_dept
                    });
                } else {
                    res.status(404).json({ error: 'Session not found' });
                }
            } catch (error) {
                res.status(500).json({ error: 'Failed to fetch student data' });
            }
            break;
        case 'Staff':
            // Fetch data for Staff
            let staff = await getStaffByEmail(email);
            let staff_dept = await getDepartmentByStaffId(id);

            // if (staff_dept) {
            //     console.log(staff_dept); // This will now correctly log the department name
            // } else {
            //     console.log('Department not found.');
            // }

            res.json({ message: 'Welcome Staff!' ,staff, staff_dept});
            break;
        default:
            res.status(400).send('Invalid user role');
    }
};




const forgotPassword = async (req, res) => {
    const { email } = req.body;
    let tableName = null;
    // Check if the email exists in any of the user tables

    let user = await getTeacherByEmail(email);
    if (user) {
        tableName = 'Teacher';
    }

    if(!user){
        user = await getStudentByEmail(email);
        if (user) {
            tableName = 'Student';
        }
    }
    
    if(!user){
        user = await getStaffByEmail(email);
        if (user) {
            tableName = 'Staff';
        }
    }
    
    
    console.log(email);
    console.log(user);

    if (!user) {
        // console.log("fuck");
        return res.status(404).send('Invalid email. Please enter a registered email.');
    }

    

    // console.log('fuck again');

    // Generate reset token and set expiry
    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour from now

    // Save the reset token in the database

    if(tableName === 'Teacher'){
        await savePasswordResetToken(user.teacher_id, token, new Date(expires), tableName);
    }

    if(tableName === 'Student'){
        await savePasswordResetToken(user.student_id, token, new Date(expires), tableName);
    }

    if(tableName === 'Staff'){
        await savePasswordResetToken(user.staff_id, token, new Date(expires), tableName);
    }

    // Send email with reset link

    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.Email,
        subject: 'Reset Password Link',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
        Please click on the following link, or paste this into your browser to complete the process:
        http://localhost:3000/reset-password/${token}
        If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email');
        } else {
            console.log('Email sent:', info.response);
            res.status(200).send('Registration link sent');
        }
    });
};


const superUserForgotPassword = async (req, res) => {
    const { email } = req.body;
    let tableName = 'SuperUser';
    // Check if the email exists in any of the user tables

    let user = await getSuperUserByEmail(email);

    if (!user) {
        return res.status(404).send('Invalid email. Please enter a registered email.');
    }

    // Generate reset token and set expiry
    const token = crypto.randomBytes(20).toString('hex');
    const expires = Date.now() + 3600000; // 1 hour from now

    // Save the reset token in the database
    
    await savePasswordResetToken(user.admin_id, token, new Date(expires), tableName);

    // Send email with reset link

    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: user.email,
        subject: 'Reset Password Link',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.
        Please click on the following link, or paste this into your browser to complete the process:
        http://localhost:3000/su-reset-password/${token}
        If you did not request this, please ignore this email and your password will remain unchanged.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email');
        } else {
            console.log('Email sent:', info.response);
            res.status(200).send('Registration link sent');
        }
    });
};

const resetPassword = async (req, res) => {
    const { token, password } = req.body;
    console.log(token);
    console.log(password);
    const hashedPassword = bcrypt.hashSync(password, 10);
    let tableName = null;

    // Find user by reset token

    let user = await getTeacherByResetToken(token);
    if (user) {
        tableName = 'Teacher';
    }


    if(!user){
        user = await getStudentByResetToken(token);
        if (user) {
            tableName = 'Student';
        }
    }

    
    
    if(!user){
        user = await getStaffByResetToken(token);
        if (user) {
            tableName = 'Staff';
        }
    }
    
    console.log(user);

    if (!user || user.resetTokenExpires < new Date()) {
        return res.status(400).send('Password reset token is invalid or has expired');
    }

    // Reset password and remove reset token

    if(tableName === 'Teacher'){
        await resetUserPassword(user.teacher_id, hashedPassword, tableName);
    }

    if(tableName === 'Student'){
        await resetUserPassword(user.student_id, hashedPassword, tableName);
    }

    if(tableName === 'Staff'){
        await resetUserPassword(user.staff_id, hashedPassword, tableName);
    }

    res.status(200).send('Password has been reset successfully');
};

const superUserResetPassword = async (req, res) => {
    const { token, password } = req.body;
    // console.log(token);
    // console.log(password);
    const hashedPassword = bcrypt.hashSync(password, 10);
    let tableName = 'SuperUser';
    // Find user by reset token

    let user = await getSuperUserByResetToken(token);
    


    if (!user || user.resetTokenExpires < new Date()) {
        return res.status(400).send('Password reset token is invalid or has expired');
    }

    // Reset password and remove reset token

    await resetUserPassword(user.admin_id, hashedPassword, tableName);
    
    res.status(200).send('Password has been reset successfully');
};






module.exports = { login,
    getDashboardData, 
    forgotPassword, 
    resetPassword, 
    superUserForgotPassword, 
    superUserResetPassword,
    fetchDepartments
};
