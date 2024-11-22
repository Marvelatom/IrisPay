const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt'); // Import bcrypt

// Register controller
exports.register = async (req, res) => {
  const { email, password, name, phone, dob, bankName, ifscCode } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user with hashed password and additional fields
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      phone,
      dob,
      bankName,
      ifscCode,
    });

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    // Respond with the token
    res.status(201).json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// login controller
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare the provided password with the stored hashed password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });

    // Respond with the token and user details
    const { password: _, ...userData } = user.toObject();  // Exclude password from the response
    res.status(200).json({ token, user: userData });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
// Signout controller
exports.signout = async (req, res) => {
  try {
    // If you are storing the JWT in a cookie, you can clear it like this:
    res.clearCookie('token');
    
    // Respond with a success message
    res.status(200).json({ message: 'Signout successful' });
  } catch (err) {
    res.status(500).json({ error: 'Error signing out' });
  }
};

// delete account
exports.deleteAccount = async (req, res) => {
  const { email } = req.body;

  try {
    // Find the user by email and delete
    const result = await User.findOneAndDelete({ email });

    if (!result) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ message: 'Account successfully deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};
