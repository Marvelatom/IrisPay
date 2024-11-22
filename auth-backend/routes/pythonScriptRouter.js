// this  code is for template creating
const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const router = express.Router();

// Function to run the Python script
function runPythonScript() {
  const scriptPath = path.join('D:', 'Capstone', 'softaware', 'IrisRecognition_ML', 'src', 'CreateTemplate_DB.py');
  const scriptDirectory = path.join('D:', 'Capstone', 'softaware', 'IrisRecognition_ML', 'src');

  console.log(`Running Python script at: ${scriptPath}`);

  const pythonProcess = spawn('python', [scriptPath], {
    cwd: scriptDirectory,
  });

  return pythonProcess;
}

// Define the POST endpoint to trigger the Python script
router.post('/run-python-script', (req, res) => {
  console.log('Running the Python script...');

  const pythonProcess = runPythonScript();

  pythonProcess.stdout.on('data', (data) => {
    process.stdout.write(`\r${data}`);  // Overwrite previous output on the same line
  });

  pythonProcess.stderr.on('data', (data) => {
    process.stderr.write(`\r${data}`);  // Overwrite error output on the same line
  });

  pythonProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Python script executed successfully!');
      res.status(200).json({ status: 'success', message: 'Iris registration complete----- \n' });
    } else {
      console.log(`Python script failed with exit code ${code}`);
      res.status(500).json({ status: 'error', message: 'Python script failed----- \n' });
    }
  });

  pythonProcess.on('error', (err) => {
    console.error(`Error starting Python process: ${err.message}`);
    res.status(500).json({ status: 'error', message: 'Error starting Python process ----- \n' });
  });
});

module.exports = router;
