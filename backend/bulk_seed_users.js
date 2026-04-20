const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Load Env
dotenv.config({ path: path.join(__dirname, '.env') });

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI;
const DEPARTMENTS = ['SBI', 'IT', 'Insurance', 'Job Consulting'];
const AGENTS_PER_DEPT = 10;

async function seedAgents() {
  try {
    console.log('🚀 Connecting to FIC Database...');
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected!');

    const password = await bcrypt.hash('password123', 10);

    for (const dept of DEPARTMENTS) {
      console.log(`🏗️  Cleaning and Seeding ${dept} Team...`);
      
      // Optional: Remove old test agents for this dept to avoid duplicates if you run multiple times
      // await User.deleteMany({ email: { $regex: `agent.${dept.toLowerCase().replace(' ', '')}` } });

      for (let i = 1; i <= AGENTS_PER_DEPT; i++) {
        const agentNum = i.toString().padStart(2, '0');
        const deptSafe = dept.toLowerCase().replace(' ', '');
        const email = `agent.${deptSafe}.${agentNum}@fic.com`;

        // Check if user exists
        const existing = await User.findOne({ email });
        if (existing) {
          console.log(`⏩ Skipping ${email} (Already exists)`);
          continue;
        }

        await User.create({
          name: `Agent ${dept} ${agentNum}`,
          email: email,
          password: password,
          role: 'Employee',
          department: dept,
          status: 'Free',
          isOnline: false
        });
      }
      console.log(`✅ ${dept} Team Initialized (10 Agents)`);
    }

    console.log('\n🌟 FIC COMPANY STAFFED SUCCESSFULLY! 🌟');
    console.log('Total Agents Added/Verified: 40');
    console.log('Sample Login: agent.sbi.01@fic.com / password123');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ SEEDING FAILED:', err);
    process.exit(1);
  }
}

seedAgents();
