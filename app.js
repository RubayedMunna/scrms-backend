const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const verifyToken = require('./middlewares/authMiddleware');
const fileUpload = require('express-fileupload');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.text({ type: 'application/xml' }));
app.use(fileUpload());

// Create tables if they do not exist
const { createSuperUserTable } = require('./models/superUserModel');
const { createXmlDataDeptTable } = require('./models/DeptModel');
const { createXmlDataTeacherTable } = require('./models/teacherModel');
const { createChairmanToDepartmentTable } = require('./models/departmentChairmanModel');
const { createXmlDataStaffTable } = require('./models/staffModel');
const { createXmlDataRoomTable } = require('./models/roomModel');
const { createXmlDataSessionTable } = require('./models/sessionModel');
const { createXmlDataStudentTable } = require('./models/studentModel');
const { createXmlDataExamYearTable } = require('./models/examYearModel');
const { createCourseTable, createPrerequisiteCourseTable, createCourseChapterTable, createCourseObjectiveTable, createStudentLearningOutcomesTable, createRecommendedBookTable } = require('./models/syllabusModel');


createSuperUserTable();
createXmlDataDeptTable();
createXmlDataTeacherTable();
createChairmanToDepartmentTable();
createXmlDataStaffTable();
createXmlDataRoomTable();
createXmlDataSessionTable();
createXmlDataStudentTable();
createXmlDataExamYearTable();
createCourseTable();
createPrerequisiteCourseTable();
createCourseChapterTable();
createCourseObjectiveTable();
createStudentLearningOutcomesTable();
createRecommendedBookTable();


// Routes
const superUserRoutes = require('./routes/superUserRoutes');
const DeptRoutes = require('./routes/DeptRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const staffRoutes = require('./routes/staffRoutes');
const roomRoutes = require('./routes/roomRoutes');
const departmentChairmanRoutes = require('./routes/departmentChairmanRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const studentRoutes = require('./routes/studentRoutes');
const examYearRoutes = require('./routes/examYearRoutes');
const authRoutes = require('./routes/authRoute');
const syllabusRoute = require('./routes/syllabusRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', superUserRoutes);
app.use('/api', DeptRoutes);
app.use('/api', teacherRoutes);
app.use('/api', staffRoutes);
app.use('/api', roomRoutes);
app.use('/api', departmentChairmanRoutes);
app.use('/api', sessionRoutes);
app.use('/api', studentRoutes);
app.use('/api', examYearRoutes);
app.use('/api', syllabusRoute);

// Protected routes
// app.get('/api/protected', verifyToken, (req, res) => {
//     res.json({
//         message: 'This is a protected route',
//         authData: req.authData
//     });
// });

module.exports = app;
