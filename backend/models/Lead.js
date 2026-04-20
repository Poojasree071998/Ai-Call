const mongoose = require('mongoose');

const LeadSchema = new mongoose.Schema({
  customerName: { type: String },
  phoneNumber: { type: String, required: true },
  serviceType: { 
    type: String, 
    enum: ['Credit Card Sales', 'Bike Insurance', 'IT Consulting', 'Non-IT Consulting'],
    required: true 
  },
  details: {
    // Specific fields based on serviceType
    cardType: String,
    salary: Number,
    bikeNumber: String,
    insuranceExpiry: Date,
    qualification: String,
    experience: String,
    preferredJob: String
  },
  requirementSummary: { type: String },
  priority: { 
    type: String, 
    enum: ['High', 'Medium', 'Low'],
    default: 'Medium'
  },
  status: { 
    type: String, 
    enum: ['New', 'Contacted', 'Follow-up', 'Converted', 'Closed'],
    default: 'New'
  },
  handledBy: { type: String, enum: ['Employee', 'AI'] },
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  callRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Call' }
}, { timestamps: true });

module.exports = mongoose.model('Lead', LeadSchema);
