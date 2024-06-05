const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getSuperUserByEmail } = require('../controllers/superUserController');
const { getTeacherByEmail } = require('../controllers/teacherController');
const { getStudentByEmail } = require('../controllers/studentController');
const { getStaffByEmail } = require('../controllers/staffController');
const { getTeacherByResetToken } = require('../controllers/teacherController');
const { getStudentByResetToken } = require('../controllers/studentController');
const { getStaffByResetToken } = require('../controllers/staffController');
const { getSuperUserByResetToken } = require('../controllers/superUserController');
const db = require('../config/db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const { getUserByEmail, savePasswordResetToken, resetUserPassword, getUserByResetToken } = require('./userController');
const { use } = require('../routes/authRoute');


const login = async (req, res) => {
    const { email, password } = req.body;
    
    let user = await getSuperUserByEmail(email);
    if (user) {
        
        const isMatch = bcrypt.compareSync(password, user.Password);
        if (isMatch) {
            const token = jwt.sign({ id: user.admin_id, role: 'SuperUser' }, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'SuperUser' });
        }
    }
    
    user = await getTeacherByEmail(email);
    if (user) {
        const isMatch = bcrypt.compareSync(password, user.Password);
        if (isMatch) {
            const token = jwt.sign({ id: user.teacher_id, role: 'Teacher' }, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'Teacher' });
        }
    }

    user = await getStudentByEmail(email);
    if (user) {
        const isMatch = bcrypt.compareSync(password, user.Password);
        if (isMatch) {
            const token = jwt.sign({ id: user.student_id, role: 'Student' }, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'Student' });
        }
    }

    

    user = await getStaffByEmail(email);
    if (user) {
        const isMatch = bcrypt.compareSync(password, user.Password);
        if (isMatch) {
            const token = jwt.sign({ id: user.staff_id, role: 'Staff' }, 'secretKey', { expiresIn: '1h' });
            return res.json({ token, role: 'Staff' });
        }
    }

    return res.status(401).send('Invalid credentials');
};

const getDashboardData = async (req, res) => {
    const { role } = req.user;

    switch (role) {
        case 'SuperUser':
            // Fetch data for SuperUser
            res.json({ message: 'Welcome SuperUser!' });
            break;
        case 'Teacher':
            // Fetch data for Teacher
            res.json({ message: 'Welcome Teacher!' });
            break;
        case 'Student':
            // Fetch data for Student
            res.json({ message: 'Welcome Student!' });
            break;
        case 'Staff':
            // Fetch data for Staff
            res.json({ message: 'Welcome Staff!' });
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
        console.log("fuck");
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



module.exports = { login, getDashboardData, forgotPassword, resetPassword, superUserForgotPassword, superUserResetPassword };
