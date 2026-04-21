const axios = require('axios');
const Call = require('../models/Call');
const Lead = require('../models/Lead');
const User = require('../models/User');
const routingService = require('../services/routingService');
const aiService = require('../services/aiService');

// ── Helper: check if a real (non-placeholder) value is set ──────────────────
const isRealCredential = (val) => val && !val.includes('xxx') && !val.includes('XXX') && val.length > 10;

// ── Is Twilio properly configured? ─────────────────────────────────────────
const isTwilioConfigured = () =>
  isRealCredential(process.env.TWILIO_ACCOUNT_SID) &&
  isRealCredential(process.env.TWILIO_API_KEY) &&
  isRealCredential(process.env.TWILIO_APP_SID);

// Exotel API Config
const getExotelConfig = () => {
  const auth = Buffer.from(`${process.env.EXOTEL_API_KEY}:${process.env.EXOTEL_API_TOKEN}`).toString('base64');
  return {
    headers: { 'Authorization': `Basic ${auth}` }
  };
};

/**
 * Handle initial incoming call from Exotel.
 * Exotel sends GET requests for webhooks.
 */
/**
 * Handle initial incoming call from PSTN.
 * Routes the call to the browser-based dashboard using Twilio Client.
 */
exports.handleIncomingCall = async (req, res) => {
  const customerNumber = req.query.From || req.body.From || "Unknown";
  const callSid = req.query.CallSid || req.body.CallSid || "unknown_sid";
  
  console.log(`📞 [INCOMING] New call from ${customerNumber}. Notifying Dashboard...`);

  try {
    // 1. Create Call Record
    const newCall = await Call.create({
      twilioSid: callSid,
      from: customerNumber,
      to: process.env.EXOTEL_CALLER_ID || 'System',
      handledBy: 'Employee',
      status: 'In-Progress',
      department: 'General'
    });

    // 2. Notify all agents via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('incoming-call', {
        id: newCall._id,
        from: customerNumber,
        callSid: callSid,
        timestamp: new Date()
      });
    }

    // 3. Return Exotel XML to put customer on hold while agent accepts on dashboard
    const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say voice="alice">Welcome. Please wait while we connect you to our browser agent.</Say>
    <Play>http://com.exotel.s3.amazonaws.com/softphone/ringtone.mp3</Play>
    <Record maxLength="0" /> 
</Response>`;

    res.set("Content-Type", "application/xml");
    res.send(response);
  } catch (err) {
    console.error('Error in handleIncomingCall:', err);
    res.status(500).send('Error');
  }
};

exports.handleMenuSelection = async (req, res) => {
  const { Digits, CallSid } = req.query;
  let department = 'General';
  if (Digits === '1') department = 'Job Consulting';
  else if (Digits === '2') department = 'SBI';
  else if (Digits === '3') department = 'IT';
  else if (Digits === '4') department = 'Insurance';

  console.log(`🎯 Department Identified: ${department}`);

  try {
    const call = await Call.findOneAndUpdate({ twilioSid: CallSid }, { department }, { new: true });
    
    if (!call) {
      res.type('text/xml');
      return res.send('<Response><Say>System error. Goodbye.</Say></Response>');
    }

    if (call.handledBy === 'Employee') {
      const io = req.app.get('io');
      if (io) {
        io.to(`room_${department}`).emit('incoming-call', {
          id: call._id,
          from: call.from,
          callSid: CallSid,
          department: department,
          timestamp: new Date()
        });
      }

      // In Exotel, we would typically use the "Connect" API or a <Dial> tag.
      // For this migration, we will use a <Dial> tag to the forwarding number or a free agent.
      const freeAgent = await User.findOne({ department, status: 'Free', role: 'Employee' });
      const dialTarget = freeAgent?.phone || process.env.FORWARDING_NUMBER;

      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial>${dialTarget}</Dial>
</Response>`);
      
      if (freeAgent) {
        await User.findByIdAndUpdate(freeAgent._id, { status: 'Busy' });
        call.employeeId = freeAgent._id;
        await call.save();
      }
    } else {
      // AI Flow (Keeping simple beep for recording if needed, or just record)
      res.type('text/xml');
      res.send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Record action="/api/calls/end-call?CallSid=${CallSid}" maxLength="30" />
</Response>`);
    }
  } catch (err) {
    console.error('Error in handleMenuSelection:', err);
    res.status(500).send('Error');
  }
};

exports.handleEndCall = async (req, res) => {
  const { RecordingUrl, CallSid, From } = req.query;
  console.log(`Call finished for ${CallSid}. Recording: ${RecordingUrl || 'NONE'}`);

  try {
    const call = await Call.findOne({ twilioSid: CallSid });
    if (call && call.handledBy === 'AI') {
      // AI processing logic (simplified for Exotel)
      const insights = await aiService.generateCallSummary("Automated Exotel transcript placeholder");
      call.status = 'Completed';
      call.endTime = new Date();
      await call.save();

      await Lead.create({
        phoneNumber: From || call.from,
        serviceType: insights.category,
        requirementSummary: insights.summary,
        handledBy: 'AI',
        callRef: call._id
      });
    }

    res.type('text/xml');
    res.send('<Response><Say>Thank you for calling FIC. Goodbye.</Say></Response>');
  } catch (err) {
    console.error('Error in handleEndCall:', err);
    res.status(500).send('Error');
  }
};

exports.getCallHistory = async (req, res) => {
  try {
    const calls = await Call.find().populate('employeeId', 'name').sort({ createdAt: -1 }).limit(50);
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getMetrics = async (req, res) => {
  try {
    const totalCalls = await Call.countDocuments();
    const aiCalls = await Call.countDocuments({ handledBy: 'AI' });
    const employeeCalls = await Call.countDocuments({ handledBy: 'Employee' });
    const missedCalls = await Call.countDocuments({ status: 'Missed' });
    const totalLeads = await Lead.countDocuments();

    res.json({ totalCalls, aiCalls, employeeCalls, missedCalls, totalLeads });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getActiveCalls = async (req, res) => {
  try {
    const { department } = req.query;
    let query = { status: 'In-Progress' };
    if (department && department !== 'All') query.department = department;
    const calls = await Call.find(query).populate('employeeId', 'name').sort({ createdAt: 1 });
    res.json(calls);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Exotel: Trigger an outbound call via Bridging.
 *
 * HOW IT WORKS (correct sequential flow):
 * 1. Exotel calls the EMPLOYEE phone first (From).
 * 2. When employee picks up, Exotel hits the `Url` callback.
 * 3. The callback returns XML <Dial> that connects the call to the CUSTOMER phone.
 * This way BOTH employee and customer hear each other — no loop-back.
 */
/**
 * Trigger an outbound call.
 * For Browser-based Calling (Twilio): Just create the DB record and return success.
 * For Bridging (Exotel): Initiate the two-legged call.
 */
exports.triggerOutboundCall = async (req, res) => {
  try {
    const { customerPhone } = req.body;
    const customerPhoneClean = customerPhone.replace('+', '');
    const protocol = req.headers['x-forwarded-proto'] || req.protocol;
    const host = req.get('host');
    let baseUrl = (process.env.BASE_URL || '').trim();
    if (!baseUrl || baseUrl.includes('ngrok')) {
      baseUrl = `${protocol}://${host}`;
    }

    // 1. Create Call Record in Database for tracking
    const newCall = await Call.create({
      twilioSid: 'pending_' + Date.now(),
      from: customerPhone,
      to: process.env.TWILIO_PHONE_NUMBER || 'System',
      handledBy: 'Employee',
      employeeId: req.body.employeeId,
      department: 'Manual Dial',
      status: 'In-Progress'
    });

    // 2. Alert Admin Dashboard via Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('call-initiated', {
        id: newCall._id,
        from: customerPhone,
        handledBy: 'Employee',
        status: 'In-Progress'
      });
    }

    // 3. Mode Selection: Real Twilio (browser) vs. Exotel (phone bridge)
    if (isTwilioConfigured()) {
      console.log(`🚀 [TWILIO MODE] Real Twilio configured. Handing off to browser SDK for ${customerPhone}.`);
      return res.json({ 
        success: true, 
        id: newCall._id, 
        mode: 'browser' 
      });
    }

    // Fallback: Exotel Bridging Logic
    const employeePhone = (process.env.FORWARDING_NUMBER || '').replace('+', '');
    const exotelVirtualNumber = (process.env.EXOTEL_CALLER_ID || process.env.EXOTEL_VIRTUAL_NUMBER || "").trim();
    const accountSid = (process.env.EXOTEL_ACCOUNT_SID || "").trim();
    const apiKey = (process.env.EXOTEL_API_KEY || "").trim();
    const apiToken = (process.env.EXOTEL_API_TOKEN || "").trim();

    if (process.env.DEMO_MODE === 'true' || !apiKey || !apiToken || !employeePhone) {
      console.log("🧪 [DEMO/FAILSAFE] Simulating outbound call success...");
      return res.json({ 
        success: true, 
        callSid: 'sim_outbound_' + Date.now(), 
        isDemo: true,
        id: newCall._id
      });
    }

    const bridgeCallbackUrl = `${baseUrl}/api/calls/bridge-outbound?customer=${customerPhoneClean}&callerId=${exotelVirtualNumber}`;
    const url = `https://api.exotel.com/v1/Accounts/${accountSid}/Calls/connect.json`;
    const params = new URLSearchParams();
    params.append('From', employeePhone);
    params.append('CallerId', exotelVirtualNumber);
    params.append('Url', bridgeCallbackUrl);
    params.append('StatusCallback', `${baseUrl}/api/calls/status`);
    params.append('TimeLimit', '3600'); // Max call duration 1 hour
    params.append('TimeOut', '60');    // Ring for 60 seconds

    const response = await axios.post(url, params, getExotelConfig());
    const callSid = response.data.Call?.Sid || response.data?.Sid;

    newCall.twilioSid = callSid;
    await newCall.save();

    res.json({ success: true, callSid: callSid, id: newCall._id });
  } catch (err) {
    console.error(`❌ [OUTBOUND ERROR] ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { employeeId, status } = req.body;
    const user = await User.findByIdAndUpdate(employeeId, { status }, { new: true });
    res.json({ success: true, status: user.status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.handleStatusCallback = async (req, res) => {
  const { CallSid, Status } = { ...req.query, ...req.body };
  console.log(`📡 [EXOTEL STATUS] Call ${CallSid}: ${Status}`);

  try {
    const call = await Call.findOne({ twilioSid: CallSid });
    if (call) {
      call.status = Status === 'completed' ? 'Completed' : 'Missed';
      call.endTime = new Date();
      await call.save();

      const io = req.app.get('io');
      if (io) io.emit('call-status-updated', { id: call._id, status: call.status });
    }
    res.status(200).send('OK');
  } catch (err) {
    res.status(500).send('Error');
  }
};

/**
 * Dashboard: Employee attends an INBOUND call from queue.
 * Exotel calls the employee's phone, and when they pick up,
 * the bridge-outbound XML dials the waiting customer.
 */
exports.attendCall = async (req, res) => {
  try {
    const { id } = req.params;
    const { employeeId } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee || !employee.phone) {
      return res.status(404).json({ message: 'Employee or phone number not found.' });
    }

    const call = await Call.findByIdAndUpdate(id, { 
      employeeId, 
      handledBy: 'Employee',
      status: 'In-Progress' 
    }, { new: true });

    if (!call) return res.status(404).json({ message: 'Call not found.' });

    // Update Employee Status
    await User.findByIdAndUpdate(employeeId, { status: 'On-Call' });

    // REAL-TIME SYNC (notify other agents this call is taken)
    const io = req.app.get('io');
    if (io) io.emit('call-handled', { id });

    if (process.env.DEMO_MODE === 'true') {
      console.log("🧪 [DEMO MODE] Simulating call bridge success...");
      return res.json({ success: true, message: '🧪 Demo Mode: Call Bridge Simulated', isDemo: true });
    }

    try {
      const protocol = req.headers['x-forwarded-proto'] || req.protocol;
      const host = req.get('host');
      let baseUrl = (process.env.BASE_URL || '').trim();
      if (!baseUrl || baseUrl.includes('ngrok')) {
        baseUrl = `${protocol}://${host}`;
      }
      const exotelVirtualNumber = (process.env.EXOTEL_CALLER_ID || process.env.EXOTEL_VIRTUAL_NUMBER || '').trim();
      const customerPhoneClean = call.from.replace('+', '');
      const employeePhoneClean = employee.phone.replace('+', '');

      // The bridge callback URL: called by Exotel after agent answers,
      // returns XML that dials the customer into the call.
      const bridgeCallbackUrl = `${baseUrl}/api/calls/bridge-outbound?customer=${customerPhoneClean}&callerId=${exotelVirtualNumber}`;

      const url = `https://api.exotel.com/v1/Accounts/${process.env.EXOTEL_ACCOUNT_SID}/Calls/connect.json`;
      const params = new URLSearchParams();
      params.append('From', employeePhoneClean);       // Exotel calls the employee first
      params.append('CallerId', exotelVirtualNumber);  // Virtual number shown to customer
      params.append('Url', bridgeCallbackUrl);         // ← THE KEY: XML bridge callback
      params.append('StatusCallback', `${baseUrl}/api/calls/status`);
      params.append('TimeOut', '60');

      console.log(`📡 [EXOTEL ATTEND] Calling agent ${employeePhoneClean}, bridge to customer ${customerPhoneClean}`);
      console.log(`📡 [EXOTEL ATTEND] Bridge URL: ${bridgeCallbackUrl}`);

      await axios.post(url, params, getExotelConfig());
      return res.json({ success: true, message: '📞 Exotel is calling your phone. Pick up to connect with customer!' });
    } catch (err) {
      const errorMsg = err.response?.data?.RestException?.Message || err.message;
      const statusCode = err.response?.status;
      
      if (statusCode === 403) {
        console.warn("⚠️  [KYC/Permission] Exotel blocked bridge. Falling back to Demo Mode.");
        return res.json({ 
          success: true, 
          message: '⚠️ Exotel KYC Pending - Running in Demo Mode', 
          isDemo: true 
        });
      }
      throw err;
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Dashboard: Employee finishes a call and saves notes.
 */
exports.finishCall = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, status, disposition, employeeId } = req.body;

    const call = await Call.findByIdAndUpdate(id, { 
      notes, 
      status: status || 'Completed', 
      endTime: new Date() 
    }, { new: true });

    if (!call) return res.status(404).json({ message: 'Call not found.' });

    // Create Lead
    await Lead.create({
      phoneNumber: call.from,
      serviceType: call.department || 'General',
      requirementSummary: notes,
      handledBy: 'Employee',
      callRef: call._id,
      status: disposition === 'Interested' ? 'Follow-up' : 'Closed'
    });

    // Update Employee Status
    if (employeeId) {
      await User.findByIdAndUpdate(employeeId, { status: 'Free' });
    }

    res.json({ message: 'Call finished and lead created successfully.', call });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * XML Bridge Callback — called by Exotel AFTER the agent picks up.
 * Returns XML that dials the customer, completing the two-legged bridge.
 * Agent hears customer, customer hears agent. Two-way audio. ✅
 */
exports.bridgeOutboundXML = async (req, res) => {
  const { customer, callerId } = req.query;

  if (!customer) {
    console.error('❌ [BRIDGE XML] Missing customer number in query params!');
    const errorXml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say>System error: customer number not specified. Goodbye.</Say>
    <Hangup/>
</Response>`;
    res.set('Content-Type', 'text/xml');
    return res.send(errorXml);
  }

  console.log(`✅ [EXOTEL XML BRIDGE] Agent picked up! Bridging to Customer: ${customer} via CallerID: ${callerId}`);

  // No hold music — direct dial so customer starts ringing immediately
  // Optimized Passthru XML for Exotel
  const response = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Dial callerId="${callerId || ''}" record="true" timeout="60">${customer}</Dial>
</Response>`;

  console.log(`📡 [EXOTEL XML RESPONSE]:\n${response}`);

  // Notify dashboard that the bridge is active (Agent has picked up)
  const io = req.app.get('io');
  if (io) {
    io.emit('call-live', { 
      customer, 
      status: '🟢 Two-Way Audio Live',
      timestamp: new Date() 
    });
  }

  res.set('Content-Type', 'text/xml');
  res.send(response);
};

exports.purgeCalls = async (req, res) => {
  try {
    const result = await Call.deleteMany({ status: 'In-Progress' });
    res.json({ message: `Purged ${result.deletedCount} calls` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
