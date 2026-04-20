const mongoose = require('mongoose');

const CallSchema = new mongoose.Schema({
  twilioSid: { type: String, required: true, unique: true },
  from: { type: String, required: true },
  to: { type: String, required: true },
  department: { 
    type: String, 
    enum: ['SBI', 'IT', 'Insurance', 'Job Consulting', 'Manual Dial', 'Unknown'],
    default: 'Unknown'
  },
  requestedDepartment: { type: String },
  transferHistory: [{
    fromAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    toDepartment: { type: String },
    time: { type: Date, default: Date.now },
    reason: { type: String }
  }],
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },
  duration: { type: Number }, // in seconds
  handledBy: { 
    type: String, 
    enum: ['Employee', 'AI'], 
    required: true 
  },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { 
    type: String, 
    enum: ['In-Progress', 'Completed', 'Missed', 'Failed'],
    default: 'In-Progress'
  },
  recordingUrl: { type: String },
  transcript: { type: String },
  summary: { type: String },
  notes: { type: String },
  aiRetryCount: { type: Number, default: 0 },
  disposition: { 
    type: String, 
    enum: ['Interested', 'Not Interested', 'Callback', 'Wrong Number', 'Converted', 'Unknown'],
    default: 'Unknown'
  },
  sentiment: { type: String, enum: ['Positive', 'Neutral', 'Negative'], default: 'Neutral' },
  priority: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' }
}, { timestamps: true });

module.exports = mongoose.model('Call', CallSchema);
