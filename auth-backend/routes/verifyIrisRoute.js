const express = require('express');
const path = require('path');
const { exec } = require('child_process');
const router = express.Router();

// Endpoint for iris verification
router.post('/verify-iris', (req, res) => {
  const { filename } = req.body;

  // Correct template directory path
  const templateDir = 'D:/Capstone/softaware/IrisRecognition_ML/src/templates/CASIA1';
  const filePath = path.join('D:/Capstone/softaware/IrisRecognition_ML/src', filename); // Path to the image file to verify

  // Command to run the Python script
  const command = `python "D:/Capstone/softaware/IrisRecognition_ML/src/verifyDB_casia1.py" --template_dir "${templateDir}" --mode verify --filename "${filePath}"`;

  // Execute the Python script
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`exec error: ${error}`);
      return res.status(500).json({ success: false, message: 'Verification failed due to server error' });
    }

    console.log(`stdout: ${stdout}`);
    console.error(`stderr: ${stderr}`);

    // Parse the output for "Verification result: True" or "Verification result: False"
    const successPattern = /Verification result: True/;
    const failurePattern = /Verification result: False/;

    if (successPattern.test(stdout)) {
      // Verification succeeded
      return res.json({ success: true, match: true });
    } else if (failurePattern.test(stdout)) {
      // Verification failed
      return res.json({ success: true, match: false });
    } else {
      // Unexpected output
      console.error('Unexpected output from Python script.');
      return res.status(500).json({ success: false, message: 'Unexpected output from verification process' });
    }
  });
});

module.exports = router;
