const db = require('../config/db');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const Teacher = require('../models/teacherModel');
const Student = require('../models/studentModel');
const Staff = require('../models/staffModel');
const { table } = require('console');

const getUserByEmail = async (email, tables) => {
    let user = null;
    let tableName = null;

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        console.log(table);
        const sql = `SELECT * FROM ${table} WHERE Email = ?`;

        try {
            [user] = await db.query(sql, [email]);
            if (user) {
                tableName = table;
                break;
            }
        } catch (error) {
            console.error('Error querying database:', error);
            throw error;
        }
    }

    return { user, tableName };
};

const savePasswordResetToken = async (userId, token, expires, tableName) => {
    let id_name = null;

    if(tableName === 'Teacher'){
        id_name='teacher_id';
    }

    if(tableName === 'Student'){
        id_name = 'student_id';
    }

    if(tableName === 'Staff'){
        id_name = 'staff_id';
    }
    
    if(tableName === 'SuperUser'){
        id_name = 'admin_id';
    }


    const sql = `UPDATE ${tableName} SET resetToken = ?, resetTokenExpires = ? WHERE ${id_name} = ?`;
    try {
        await db.query(sql, [token, expires, userId]);
    } catch (error) {
        console.error('Error saving reset token:', error);
        throw error;
    }
};

const resetUserPassword = async (userId, hashedPassword, tableName) => {
    let id_name = null;

    if(tableName === 'Teacher'){
        id_name='teacher_id';
    }

    if(tableName === 'Student'){
        id_name = 'student_id';
    }

    if(tableName === 'Staff'){
        id_name = 'staff_id';
    }

    if(tableName === 'SuperUser'){
        id_name = 'admin_id';
    }

    const sql = `UPDATE ${tableName} SET password = ?, resetToken = NULL, resetTokenExpires = NULL WHERE ${id_name} = ?`;
    try {
        await db.query(sql, [hashedPassword, userId]);
    } catch (error) {
        console.error('Error resetting password:', error);
        throw error;
    }
};

const getUserByResetToken = async (token, tables) => {
    let user = null;
    let tableName = null;

    for (let i = 0; i < tables.length; i++) {
        const table = tables[i];
        const sql = `SELECT * FROM ${table} WHERE resetToken = ? AND resetTokenExpires > NOW()`;

        try {
            [user] = await db.query(sql, [token]);
            if (user) {
                tableName = table;
                break;
            }
        } catch (error) {
            console.error('Error querying database:', error);
            throw error;
        }
    }

    return { user, tableName };
};

module.exports = { getUserByEmail, savePasswordResetToken, resetUserPassword, getUserByResetToken };