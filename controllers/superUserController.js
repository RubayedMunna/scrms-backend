const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const db = require('../config/db');
require('dotenv').config();

const generateRegistrationLink = async (req, res) => {
    const email = 'jucse29.370@gmail.com';
    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
    
    const link = `http://localhost:3000/su-register/${token}`;

    const transporter = nodemailer.createTransport({
        service: 'gmail', // You can use other services
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Super User Registration Link',
        text: `Click on this link to register: ${link}`,
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

const registerSuperUser = async (req, res) => {
    const token = req.params.token;
    let tokenEmail;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        tokenEmail = decoded.email;
    } catch (error) {
        return res.status(400).send('Invalid or expired token');
    }

    const { username, email, password } = req.body;

    db.query('SELECT * FROM superuser WHERE username = ? OR email = ?', [username, email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length > 0) {
            return res.status(400).send('Superuser with this username or email already exists');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const sql = 'INSERT INTO superuser (username, email, password) VALUES (?, ?, ?)';
        db.query(sql, [username, email, hashedPassword], (err, result) => {
            if (err) {
                console.error('Error registering superuser:', err);
                return res.status(500).send('Error registering superuser');
            }
            res.status(201).send('Superuser registered successfully');
        });
    });
};


const loginSuperUser = async (req, res) => {
    const { email, password } = req.body;

    db.query('SELECT * FROM SuperUser WHERE email = ?', [email], async (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).send('Server error');
        }

        if (results.length === 0) {
            return res.status(400).send('No superuser found with this email');
        }

        const superUser = results[0];
        const isMatch = await bcrypt.compare(password, superUser.password);

        if (!isMatch) {
            return res.status(400).send('Invalid credentials');
        }

        const token = jwt.sign({ id: superUser.admin_id, role: 'SuperUser', email: superUser.Email }, 'your_jwt_secret', { expiresIn: '1h' });

        res.json({ token , role: 'SuperUser'});
    });
};



const getSuperUserByEmail = (email) => {
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM SuperUser WHERE email = ?";
        db.query(sql, [email], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};

const getSuperUserByResetToken = (token) => {
    console.log(token);
    return new Promise((resolve, reject) => {
        const sql = "SELECT * FROM SuperUser WHERE resetToken = ? AND resetTokenExpires > NOW()";
        db.query(sql, [token], (err, result) => {
            if (err) return reject(err);
            resolve(result[0]);
        });
    });
};

module.exports = {
    generateRegistrationLink,
    registerSuperUser,
    loginSuperUser,
    getSuperUserByEmail,
    getSuperUserByResetToken
};
