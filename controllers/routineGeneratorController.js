const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { PythonShell } = require('python-shell');
const multer = require('multer');

// Ensure 'uploads/' directory exists
const uploadDir = path.join(__dirname, '../uploads_routine_csvfiles');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure multer for file upload
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Function to handle file upload and processing
const uploadFile = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }

        if (req.file.mimetype !== 'text/csv') {
            return res.status(400).send('Please upload a CSV file.');
        }

            // Path to the uploaded file
            const filePath = req.file.path;
            console.log('Uploaded file path:', filePath);
    
            // Run Python script using child_process.spawn
            const pythonProcess = spawn('python', [path.join(__dirname, '../python/schedule_generator.py'), filePath]);
    
            let scriptOutput = '';
    
            pythonProcess.stdout.on('data', (data) => {
                scriptOutput += data.toString();
            });
    
            pythonProcess.stderr.on('data', (data) => {
            console.error('Python script error output:', data.toString());
        });

        pythonProcess.on('close', (code) => {
            console.log(`Python script exited with code ${code}`);
            try {
                const schedule = JSON.parse(scriptOutput);

                // Log the results to the Node.js console
                console.log('Generated Schedule:', schedule);

                // Delete the file after processing
                fs.unlink(filePath, (err) => {
                    if (err) console.error('Error deleting file:', err);
                });

                // Send the results back to the client as a JSON object
                res.json(schedule);
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                return res.status(500).send('Error parsing the schedule.');
            }
        });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).send('Server error.');
    }
};

module.exports = { upload, uploadFile };