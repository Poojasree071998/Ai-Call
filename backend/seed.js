const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  const password = await bcrypt.hash('admin123', 10);
  const empPassword = await bcrypt.hash('employee123', 10);

  // Create Admin
  await User.findOneAndUpdate(
    { email: 'admin@fic.com' },
    { 
      name: 'Super Admin', 
      password, 
      role: 'Admin',
      department: 'All'
    },
    { upsert: true, new: true }
  );

  // Create Employee
  await User.findOneAndUpdate(
    { email: 'employee@fic.com' },
    { 
      name: 'Demo Employee', 
      password: empPassword, 
      role: 'Employee',
      department: 'Credit Card Sales'
    },
    { upsert: true, new: true }
  );

  console.log('Test accounts created successfully!');
  process.exit();
}

seed().catch(err => {
  console.error(err);
  process.exit(1);
});
