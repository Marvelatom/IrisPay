const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  dob: { type: Date, required: true },
  bankName: { type: String, required: true },
  ifscCode: { type: String, required: true },
});


module.exports = mongoose.model('User', UserSchema);
