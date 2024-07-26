const pool = require('../config/db');

const fetchAllData = (callback) => {
    const queryDepartment = 'SELECT * FROM department;';
    const querySession = 'SELECT * FROM session;';
    const queryExamYear = 'SELECT * FROM examyear;';
    const queryCourse = 'SELECT * FROM course;';

    let data = {
        departments: [],
        sessions: [],
        examYears: [],
        courses: []
    };

    pool.query(queryDepartment, (err, departmentResults) => {
        if (err) {
            return callback(err, null);
        }
        data.departments = departmentResults;

        pool.query(querySession, (err, sessionResults) => {
            if (err) {
                return callback(err, null);
            }
            data.sessions = sessionResults;

            pool.query(queryExamYear, (err, examYearResults) => {
                if (err) {
                    return callback(err, null);
                }
                data.examYears = examYearResults;

                pool.query(queryCourse, (err, courseResults) => {
                    if (err) {
                        return callback(err, null);
                    }
                    data.courses = courseResults;

                    callback(null, data);
                });
            });
        });
    });
};

module.exports = { fetchAllData };
