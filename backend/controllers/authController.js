const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';

exports.register = async (req, res) => {
  const { name, email, password, role, department } = req.body;
  try {
    const foundUser = await User.findOne({ email });
    if (foundUser) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department
    });

    await newUser.save();
    
    const token = jwt.sign({ id: newUser._id, role: newUser.role }, JWT_SECRET, { expiresIn: '1d' });
    res.status(201).json({ token, user: { id: newUser._id, name, email, role } });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  console.log(`LOGIN ATTEMPT: Start for ${email}`);
  try {
    const foundUser = await User.findOne({ email });
    if (!foundUser) {
      console.log(`LOGIN FAILED: User not found - ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    console.log(`LOGIN PROGRESS: User found, checking password...`);
    const isMatch = await bcrypt.compare(password, foundUser.password);
    if (!isMatch) {
      console.log(`LOGIN FAILED: Password mismatch - ${email}`);
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Update online status
    console.log(`LOGIN PROGRESS: Updating online status...`);
    foundUser.isOnline = true;
    foundUser.lastLogin = new Date();
    await foundUser.save();

    console.log(`LOGIN PROGRESS: Generating JWT...`);
    const token = jwt.sign({ id: foundUser._id, role: foundUser.role }, JWT_SECRET, { expiresIn: '1d' });
    
    console.log(`LOGIN SUCCESS: Finalizing response for ${email}`);
    res.json({ token, user: { id: foundUser._id, name: foundUser.name, email, role: foundUser.role, department: foundUser.department } });
  } catch (err) {
    console.error('CRITICAL LOGIN ERROR DETAILS:');
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    if (err.name === 'MongooseError' || err.name === 'MongoError') {
      console.error('Database Error detected');
    }
    res.status(500).json({ 
      message: 'Internal Server Error', 
      error: err.message,
      type: err.name 
    });
  }
};

exports.getOnlineUsers = async (req, res) => {
  try {
    const users = await User.find({ isOnline: true }).select('name email role department status lastLogin');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ role: 'Employee' }).select('name email role department isOnline lastLogin');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
