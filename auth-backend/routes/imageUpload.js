const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Define the directory for saving images
const folderPath = path.join('D:\\Capstone\\softaware\\IrisRecognition_ML\\src');

// Ensure the directory exists
if (!fs.existsSync(folderPath)) {
  fs.mkdirSync(folderPath, { recursive: true });
}

// Define a function to get the next counter based on existing files
const getNextCounter = () => {
  const files = fs.readdirSync(folderPath);
  const fileNumbers = files
    .map(file => {
      const match = file.match(/^300_1_(\d+)\.jpg$/);
      return match ? parseInt(match[1]) : null;
    })
    .filter(num => num !== null);

  // If there are no matching files, start from 1
  if (fileNumbers.length === 0) {
    return 1;
  }

  // Get the highest number and increment it
  return Math.max(...fileNumbers) + 1;
};

// Create storage engine for multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const count = getNextCounter();
    const fileName = `300_1_${count}.jpg`; // Save file in 300_1_n format
    cb(null, fileName);
  }
});

// Set up multer to handle single file uploads
const upload = multer({ storage: storage });

// Route for handling iris image uploads
router.post('/upload-iris', upload.single('irisImage'), (req, res) => {
  try {
    res.status(200).json({ success: true, message: 'Image uploaded and saved.' });
  } catch (error) {
    console.error('Error uploading iris image:', error);
    res.status(500).json({ success: false, message: 'Internal server error.' });
  }
});

// Export the router
module.exports = router;
