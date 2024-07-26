const pool = require('../config/db');

const fetchCourseData = (departmentName, sessionName, examYear, courseName, callback) => {
    const queryDept = 'SELECT dept_id FROM department WHERE Dept_Name = ?;';
    const querySession = 'SELECT session_id FROM session WHERE dept_id = ? AND Session_name = ?;';
    const queryExamYear = 'SELECT exam_year_id FROM examyear WHERE session_id = ? AND Exam_year = ?;';
    const queryCourse = `
        SELECT 
            c.course_id, 
            c.Course_code, 
            c.Couorse_credit, 
            c.course_title, 
            c.course_type, 
            c.contact_hour, 
            c.rationale
        FROM course c
        WHERE c.exam_year_id = ? AND c.course_title = ?;
    `;

    pool.query(queryDept, [departmentName], (err, deptResults) => {
        if (err) {
            return callback(err, null);
        }
        if (deptResults.length === 0) {
            return callback(new Error('Department not found'), null);
        }

        const deptId = deptResults[0].dept_id;

        pool.query(querySession, [deptId, sessionName], (err, sessionResults) => {
            if (err) {
                return callback(err, null);
            }
            if (sessionResults.length === 0) {
                return callback(new Error('Session not found'), null);
            }

            const sessionId = sessionResults[0].session_id;

            pool.query(queryExamYear, [sessionId, examYear], (err, examYearResults) => {
                if (err) {
                    return callback(err, null);
                }
                if (examYearResults.length === 0) {
                    return callback(new Error('Exam year not found'), null);
                }

                const examYearId = examYearResults[0].exam_year_id;

                pool.query(queryCourse, [examYearId, courseName], (err, courseResults) => {
                    if (err) {
                        return callback(err, null);
                    }
                    if (courseResults.length === 0) {
                        return callback(null, {});
                    }

                    const courseData = courseResults[0];
                    const courseId = courseData.course_id;

                    // Initialize arrays for additional data
                    courseData.chapters = [];
                    courseData.objectives = [];
                    courseData.prerequisites = [];
                    courseData.recommended_books = [];
                    courseData.student_learning_outcomes = [];

                    // Create an array of queries for additional data
                    const queries = [];

                    queries.push(new Promise((resolve, reject) => {
                        pool.query('SELECT Chapter FROM coursechapter WHERE course_id = ?;', [courseId], (err, results) => {
                            if (err) return reject(err);
                            courseData.chapters = results.map(row => row.Chapter);
                            resolve();
                        });
                    }));

                    queries.push(new Promise((resolve, reject) => {
                        pool.query('SELECT Objective FROM courseobjective WHERE course_id = ?;', [courseId], (err, results) => {
                            if (err) return reject(err);
                            courseData.objectives = results.map(row => row.Objective);
                            resolve();
                        });
                    }));

                    queries.push(new Promise((resolve, reject) => {
                        pool.query('SELECT Prerequisite FROM prerequisitecourse WHERE course_id = ?;', [courseId], (err, results) => {
                            if (err) return reject(err);
                            courseData.prerequisites = results.map(row => row.Prerequisite);
                            resolve();
                        });
                    }));

                    queries.push(new Promise((resolve, reject) => {
                        pool.query(`
                            SELECT 
                                Book_title, 
                                Writer, 
                                Edition, 
                                Publisher, 
                                Publish_year 
                            FROM recommendedbook 
                            WHERE course_id = ?;
                        `, [courseId], (err, results) => {
                            if (err) return reject(err);
                            courseData.recommended_books = results;
                            resolve();
                        });
                    }));

                    queries.push(new Promise((resolve, reject) => {
                        pool.query('SELECT Outcome FROM studentlearningoutcome WHERE course_id = ?;', [courseId], (err, results) => {
                            if (err) return reject(err);
                            courseData.student_learning_outcomes = results.map(row => row.Outcome);
                            resolve();
                        });
                    }));

                    // Execute all queries in parallel
                    Promise.all(queries)
                        .then(() => callback(null, courseData))
                        .catch(err => callback(err, null));
                });
            });
        });
    });
};

module.exports = { fetchCourseData };
