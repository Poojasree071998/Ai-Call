require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/call-center';
const FORWARDING_NUMBER = process.env.FORWARDING_NUMBER || '+919444667411';

async function updateUsers() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        const result = await User.updateMany(
            { phone: { $exists: false } },
            { $set: { phone: FORWARDING_NUMBER } }
        );

        console.log(`✅ Updated ${result.modifiedCount} users with phone: ${FORWARDING_NUMBER}`);
        process.exit(0);
    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

updateUsers();
