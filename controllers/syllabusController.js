const db = require('../config/db');
const xml2js = require('xml2js');

const uploadTeacherAsXML = async (xmlData) => {
    // console.log(xmlData);
    try {
        const parsedData = await new Promise((resolve, reject) => {
            xml2js.parseString(xmlData, { explicitArray: false }, (err, result) => {
                if (err) reject(err);
                else resolve(result);
            });
        });

        const courses = parsedData.syllabus.course;

        console.log(courses);

        for (const course of courses) {
            try {
                const [courseResult] = await db.execute(
                    'INSERT INTO Course (exam_year_id, Course_code, Course_credit, Course_title, Course_type, Contact_hour, Rationale) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [1, course.course_code, course.credit, course.title, course.type, course.contact_hours, course.rationale]
                );

                const courseId = courseResult.insertId;

                for (const prerequisite of [].concat(course.prerequisites.prerequisite)) {
                    try {
                        await db.execute(
                            'INSERT INTO PrerequisiteCourse (course_id, Prerequisite) VALUES (?, ?)',
                            [courseId, prerequisite]
                        );
                    } catch (err) {
                        console.error(`Error inserting prerequisite for course ${course.course_code}:`, err);
                    }
                }

                for (const chapter of [].concat(course.course_descriptions.chapter)) {
                    try {
                        await db.execute(
                            'INSERT INTO CourseChapter (course_id, Chapter) VALUES (?, ?)',
                            [courseId, chapter]
                        );
                    } catch (err) {
                        console.error(`Error inserting chapter for course ${course.course_code}:`, err);
                    }
                }

                for (const objective of [].concat(course.course_objectives.objective)) {
                    try {
                        await db.execute(
                            'INSERT INTO CourseObjective (course_id, Objective) VALUES (?, ?)',
                            [courseId, objective]
                        );
                    } catch (err) {
                        console.error(`Error inserting objective for course ${course.course_code}:`, err);
                    }
                }

                for (const outcome of [].concat(course.student_learning_outcomes.outcome)) {
                    try {
                        await db.execute(
                            'INSERT INTO StudentLearningOutcome (course_id, Outcome) VALUES (?, ?)',
                            [courseId, outcome]
                        );
                    } catch (err) {
                        console.error(`Error inserting outcome for course ${course.course_code}:`, err);
                    }
                }

                for (const book of [].concat(course.recommended_books.book)) {
                    try {
                        await db.execute(
                            'INSERT INTO RecommendedBook (course_id, Book_title, Writer, Edition, Publisher, Publish_year) VALUES (?, ?, ?, ?, ?, ?)',
                            [courseId, book.title, book.author, book.edition, book.publisher, book.year]
                        );
                    } catch (err) {
                        console.error(`Error inserting recommended book for course ${course.course_code}:`, err);
                    }
                }
            } catch (err) {
                console.error(`Error inserting course ${course.course_code}:`, err);
            }
        }
    } catch (err) {
        console.error('Error parsing XML data:', err);
    }
};

module.exports = {
    uploadTeacherAsXML
};
