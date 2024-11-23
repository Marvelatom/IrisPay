const express = require('express');
const { exec } = require('child_process');
const router = express.Router();

// Iris Image Capture
router.post('/capture-iris-image', async (req, res) => {
  try {
    // Path to the Python script for capturing the iris image
    const pythonScript = 'D:\Capstone\softaware\IrisPay\IrisRecognition_ML\src\captureonlyIris.py';

    // Execute the Python script
    exec(pythonScript, (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing Python script:', error);
        return res.status(500).json({ message: 'Failed to capture iris image.' });
      }

      if (stderr) {
        console.error('stderr:', stderr);
        return res.status(500).json({ message: 'Error occurred while capturing iris image.' });
      }

      console.log('stdout:', stdout);
      res.status(200).json({ message: 'Iris image captured successfully.' });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during iris image capture.' });
  }
});

module.exports = router;
