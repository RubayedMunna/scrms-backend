const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const xml2js = require('xml2js');
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

// Function to handle uploading department data as XML
const uploadDeptAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData); // Log incoming data for debugging

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearTable('Department'); // Clear the table before inserting new data

            for (const row of rows) {
                const dept_id = row.dept_id && row.dept_id[0];
                const Dept_Name = row.Dept_Name && row.Dept_Name[0];
                const Descript = row.Descript && row.Descript[0];
                const Phone = row.Phone && row.Phone[0];
                const Fax = row.Fax && row.Fax[0];
                const Email = row.Email && row.Email[0];

                // Check if all required fields are present
                if (Dept_Name && Descript && Phone && Fax && Email) {
                    await insertXmlDeptIntoDatabase({ dept_id, Dept_Name, Descript, Phone, Fax, Email });
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
const insertXmlDeptIntoDatabase = (row) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Department (dept_id, Dept_Name, Descript, Phone, Fax, Email) VALUES (?, ?, ?, ?, ?, ?)';
        db.query(query, [row.dept_id, row.Dept_Name, row.Descript, row.Phone, row.Fax, row.Email], (err, results) => {
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
    uploadDeptAsXML
};
