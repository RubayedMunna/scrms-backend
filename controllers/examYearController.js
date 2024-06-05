const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// Function to handle uploading department data as XML
const uploadExamYearAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData); // Log incoming data for debugging

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }
        // Session_Id,Dept_Id,Session_Name,Start_Date,End_Date
        const rows = result.root.row;
        try {
            await clearTable('ExamYear'); // Clear the table before inserting new data

            for (const row of rows) {
                const exam_year_id = row.exam_year_id && row.exam_year_id[0];
                const session_id = row.session_id && row.session_id[0];
                const Education_level=row.Education_level && row.Education_level[0];
                const Exam_year = row.Exam_year&& row.Exam_year[0];
                const Year = row.Year && row.Year[0];
                const Semester=row.Semester && row.Semester[0];
                const Start_date=row.Start_date && row.Start_date[0];
                const End_date=row.End_date && row.End_date[0];
               
                // Check if all required fields are present
                if (session_id && Education_level && Exam_year && Year && Semester && Start_date && End_date) {
                    // const hashedPassword = await bcrypt.hash(Password, 10);
                    await insertXmlExamYearIntoDatabase({ exam_year_id,session_id,Education_level,Exam_year,Year,Semester,Start_date,End_date});
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

// Function to insert department data into the database
const insertXmlExamYearIntoDatabase = (row) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO ExamYear(exam_year_id,session_id,Education_level,Exam_year,Year,Semester,Start_date,End_date) VALUES (?, ?, ?, ?, ?,?,?,?)';
        db.query(query, [row.exam_year_id,row.session_id,row.Education_level,row.Exam_year,row.Year,row.Semester,row.Start_date,row.End_date], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

// Function to clear the specified table
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
    uploadExamYearAsXML
};
