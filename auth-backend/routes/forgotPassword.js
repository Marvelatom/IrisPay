// forgotPassword.js
const express = require('express');
const User = require('../models/User'); // Import the user model
const nodemailer = require('nodemailer');
require('dotenv').config();
const router = express.Router();

// POST request for forgot password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  // Basic email validation
  if (!email || !email.includes('@')) {
    return res.status(400).json({ message: 'Please provide a valid email address.' });
  }

  try {
    // Check if the email exists in the database
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    // Generate a password reset link (for simplicity, a mock token is used)
    const resetLink = `http://localhost:5000/reset-password?token=mock-token`;

    // Set up the email transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      

    // Mail options
    const mailOptions = {
      from: 'your-email@gmail.com',
      to: email,
      subject: 'Password Reset Request',
      text: `Click on the link to reset your password: ${resetLink}`,
    };

    // Send the email
    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error('Error sending email:', err);
        return res.status(500).json({ message: 'Failed to send reset email.' });
      }
      res.status(200).json({ message: 'Password reset link sent successfully.' });
    });
  } catch (error) {
    console.error('Error in forgotPassword:', error);
    res.status(500).json({ message: 'Server error. Please try again later.' });
  }
});

module.exports = router;
