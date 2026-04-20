const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['Admin', 'Employee'], 
    default: 'Employee' 
  },
  department: { 
    type: String, 
    default: 'General'
  },
  isOnline: { type: Boolean, default: false },
  status: { 
    type: String, 
    default: 'Free' 
  },
  phone: { type: String },
  lastLogin: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
