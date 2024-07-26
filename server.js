// require('dotenv').config();
//servere.js
const app = require('./app');

const PORT = process.env.PORT || 5000;

const startServer = (port) => {
    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    }).on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.warn(`Port ${port} is in use, trying another port...`);
            startServer(port + 1);
        } else {
            throw err;
        }
    });
};

startServer(PORT);


/*
Backend Structure
backend/
├── config/
│   └── db.js
├── controllers/
│   └── superUserController.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   └── superUserModel.js
├── routes/
│   └── superUserRoutes.js
├── app.js
└── server.js
*/
