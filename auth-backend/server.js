const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth'); // Ensure the path is correct

const app = express();
app.use(express.json());

// Configure CORS with your frontend URL


// Update the CORS middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://iris-pay.netlify.app'], // Allow both dev and prod URLs
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed HTTP methods
  allowedHeaders: ['Content-Type', 'Authorization'], // Allowed headers
  credentials: true, // Allow cookies and credentials
}));

app.options('*', cors());

const pythonScriptRouter = require('./routes/pythonScriptRouter');
app.use('/api', pythonScriptRouter);

mongoose.connect('mongodb+srv://Marvelatom:Marvel%40123@cluster0.hxlve.mongodb.net/hello', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
})
.then(() => console.log('MongoDB connected'))
.catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

 


app.use('/api/auth', authRoutes);

const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const verifyIrisRoute = require('./routes/verifyIrisRoute');
app.use('/api', verifyIrisRoute);

const imageUploadRouter = require('./routes/imageUpload'); // Adjust the path as necessary
app.use('/api', imageUploadRouter);

const captureIrisRoute = require('./routes/SignupageUpload');
app.use('/api/auth', captureIrisRoute);

const forgotPasswordRoute = require('./routes/forgotPassword');
app.use('/api/auth', forgotPasswordRoute);

const Razorpay = require('razorpay');
require('dotenv').config();

const razorpayInstance = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer token
  if (!token) {
    return res.status(401).json({ error: 'Token is required' });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    req.user = decoded; // Store decoded token data in request
    next(); // Proceed to the next middleware or route
  });
};

app.post('/api/create-order', verifyToken, (req, res) => {
  const { amount, currency } = req.body;
  if (!amount || !currency) {
    return res.status(400).json({ error: 'Amount and currency are required' });
  }

  const order = {
    amount: amount * 100,  // Razorpay expects the amount in paise
    currency: currency,
    receipt: 'order_receipt_1',
  };

  razorpayInstance.orders.create(order, (err, order) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: 'Failed to create Razorpay order' });
    }
    res.json({ orderId: order.id, amount: order.amount });
  });
});
