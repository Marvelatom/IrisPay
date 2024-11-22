const express = require('express');
const router = express.Router();
const { register, login, signout } = require('../controllers/authController'); // Ensure the path is correct

router.post('/register', register);
router.post('/login', login);
router.post('/signout', signout);
// Get user data by ID
router.get('/:id', async (req, res) => {
    try {
      const user = await User.findById(req.params.id);  // Fetch user by ID from MongoDB
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });




const { deleteAccount } = require('../controllers/authController');
// DELETE route to handle account deletion
router.delete('/delete', deleteAccount);






const { exec } = require('child_process');
// Define the route for running the Python script
router.post('/run-python', (req, res) => {
  // Command to execute the Python script
  const command = 'python verifyDB_casia1.py --template_dir "./templates/CASIA1/" --mode train';

  // Path to the directory containing the Python script
  const scriptDirectory = 'D:/Capstone/softaware/IrisRecognition_ML/src';

  // Execute the Python script
  exec(command, { cwd: scriptDirectory }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Execution error: ${error.message}`);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (stderr) {
      console.error(`Python script stderr: ${stderr}`);
      return res.status(500).json({ success: false, error: stderr });
    }

    console.log(`Python script stdout: ${stdout}`);
    res.status(200).json({ success: true, output: stdout });
  });
});








module.exports = router;
