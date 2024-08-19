const xml2js = require('xml2js');
const db = require('../config/db');

const uploadHolidaysAsXML = async (req, res) => {
    const xmlData = req.body;
    console.log('Received XML Data:', xmlData);

    xml2js.parseString(xmlData, async (err, result) => {
        if (err) {
            console.error('Error parsing XML:', err);
            return res.status(400).send('Invalid XML data');
        }

        const rows = result.root.row;
        try {
            await clearHolidayTable();
            for (const row of rows) {
                const event_name = row.event_name && row.event_name[0];
                const start_date = row.start_date && row.start_date[0];
                const end_date = row.end_date && row.end_date[0];
                const num_days = row.num_days && row.num_days[0];

                if (event_name && start_date && end_date && num_days) {
                    await insertHolidayIntoDatabase({
                        event_name,
                        start_date,
                        end_date,
                        num_days
                    });
                } else {
                    console.warn('Skipping incomplete row:', row);
                }
            }
            res.status(200).send('Holiday calendar data imported successfully.');
        } catch (error) {
            console.error('Error importing XML data:', error);
            res.status(500).send('Error importing XML data.');
        }
    });
};

const insertHolidayIntoDatabase = (data) => {
    return new Promise((resolve, reject) => {
        const query = 'INSERT INTO Holidays (event_name, start_date, end_date, num_days) VALUES (?, ?, ?, ?)';
        db.query(query, [data.event_name, data.start_date, data.end_date, data.num_days], (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const clearHolidayTable = () => {
    return new Promise((resolve, reject) => {
        const query = 'DELETE FROM Holidays';
        db.query(query, (err, results) => {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};

const getHolidays = () => {
    return new Promise((resolve, reject) => {
        const query = 'SELECT * FROM Holidays';
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
    uploadHolidaysAsXML,
    getHolidays
};
