require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5050;

// Socket.io Professional Management
io.on('connection', (socket) => {
  console.log('📡 [SOCKET] A user connected:', socket.id);
  
  // Exotel Audio Stream Handler (WSS)
  socket.on('exotel_stream', (data) => {
    // Exotel sends audio in base64 format here
    // You can process it for AI transcription
    console.log('🎙️ [STREAM] Receiving audio packet from Exotel');
  });

  socket.on('join_department', (dept) => {
    socket.join(`room_${dept}`);
    console.log(`📡 [SOCKET] User ${socket.id} joined Quad: room_${dept}`);
  });

  socket.on('disconnect', () => {
    console.log('📡 [SOCKET] A user disconnected');
  });
});

// Pass io to Express for use in controllers
app.set('io', io);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Professional Traffic Monitor
app.use((req, res, next) => {
  if (req.url.includes('/api/calls/incoming')) {
    console.log(`🎯 [EXOTEL HIT] ${req.method} ${req.url}`);
    if (req.method === 'POST') console.log('📦 Body:', req.body);
    else console.log('🔍 Query:', req.query);
  }
  
  // Silence noisy polling logs to keep terminal clean for important signals
  if (req.url.includes('/active') || req.url.includes('/history') || req.url.includes('/metrics')) {
    return next();
  }
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date(),
    db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// DB Connection & Startup
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/call-center';

async function startServer() {
  console.log('⏳ Connecting to MongoDB...');
  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 15000, // 15 seconds timeout
    });
    console.log('✅ MongoDB Connected Successfully');

    // Auto-seed FIC Staffing Engine
    try {
      const User = require('./models/User');
      const bcrypt = require('bcryptjs');
      
      const adminExists = await User.findOne({ email: 'admin@fic.com' });
      if (!adminExists) {
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await User.create({
          name: 'Super Admin',
          email: 'admin@fic.com',
          password: hashedPassword,
          role: 'Admin',
          phone: process.env.FORWARDING_NUMBER
        });
        console.log('🏢 FIC System: Admin Account Initialized');
      }

      const departments = ['SBI', 'IT', 'Insurance', 'Job Consulting'];
      const hashedPassword = await bcrypt.hash('password123', 10);
      
      console.log('🏗️  FIC Staffing: Auditing Team Strength...');
      for (const dept of departments) {
        const count = await User.countDocuments({ department: dept, role: 'Employee' });
        if (count < 10) {
          console.log(`📡 Hiring ${10 - count} new agents for ${dept} Team...`);
          for (let i = count + 1; i <= 10; i++) {
            const num = i.toString().padStart(2, '0');
            await User.create({
              name: `Agent ${dept} ${num}`,
              email: `agent.${dept.toLowerCase().replace(' ', '')}.${num}@fic.com`,
              password: hashedPassword,
              role: 'Employee',
              department: dept,
              status: 'Free',
              phone: process.env.FORWARDING_NUMBER
            });
          }
        }
      }
      
      // Ensure all agents have a phone number (Fix for existing users)
      await User.updateMany(
        { role: 'Employee', phone: { $exists: false } },
        { $set: { phone: process.env.FORWARDING_NUMBER } }
      );
      
      console.log('🌟 FIC Result: All 40 Professional Agents are in the building!');
    } catch (err) {
      console.error('❌ FIC Staffing Failed:', err.message);
    }

    // Start Listening only after DB is ready
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 FIC Main Server is running on port ${PORT} (Bound to 0.0.0.0)`);
    });

  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err.message);
    console.error('The server will retry in 10 seconds...');
    setTimeout(startServer, 10000);
  }
}

// Import Routes
const callRoutes  = require('./routes/callRoutes');
const leadRoutes  = require('./routes/leadRoutes');
const authRoutes  = require('./routes/authRoutes');
const voiceRoutes = require('./routes/voiceRoutes');

app.use('/api/calls',  callRoutes);
app.use('/api/leads',  leadRoutes);
app.use('/api/auth',   authRoutes);
app.use('/api/voice',  voiceRoutes);

// Static Files & Routing
const path = require('path');
const distPath = path.resolve(process.cwd(), 'dist');

// Serve Static Frontend Files
app.use(express.static(distPath));

// Handle React Routing - send all other requests to index.html
app.get('*', (req, res) => {
  // If it's an API request that wasn't caught by the routes above, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

startServer();
