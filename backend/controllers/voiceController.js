const twilio = require('twilio');
const AccessToken = twilio.jwt.AccessToken;
const VoiceGrant = AccessToken.VoiceGrant;
const Call = require('../models/Call');

/**
 * Generate a Twilio Access Token for the browser-based Twilio.Device.
 * Each employee gets a unique identity token.
 */
exports.generateToken = (req, res) => {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey    = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const appSid    = process.env.TWILIO_APP_SID;
  const identity  = 'employee_' + (req.query.id || 'default');

  // Detect missing OR placeholder credentials (e.g. ACxxxxxxxxx)
  const isPlaceholder = (v) => !v || v.includes('xxx') || v.includes('XXX') || v.length < 15;

  if (isPlaceholder(accountSid) || isPlaceholder(apiKey) || isPlaceholder(apiSecret) || isPlaceholder(appSid)) {
    console.warn('⚠️  [VOICE] Twilio credentials not configured (or still placeholders). Browser audio disabled.');
    return res.status(503).json({
      error: 'Browser audio not configured. Add TWILIO_* keys to .env to enable.',
      configured: false
    });
  }

  try {
    console.log(`🔑 [VOICE] Generating browser token for: ${identity}`);
    const token = new AccessToken(accountSid, apiKey, apiSecret, { identity });

    const grant = new VoiceGrant({
      outgoingApplicationSid: appSid,
      incomingAllow: true,   // Allow incoming calls to browser
    });

    token.addGrant(grant);
    const jwt = token.toJwt();
    console.log(`✅ [VOICE] Token generated for ${identity}`);

    res.json({ identity, token: jwt, configured: true });
  } catch (error) {
    console.error('❌ [VOICE] Token generation error:', error.message);
    res.status(500).json({ error: 'Token generation failed: ' + error.message });
  }
};

/**
 * TwiML Webhook — called by Twilio when:
 * 1. The browser makes an outbound call (Device.connect)
 * 2. A customer calls the Twilio number (Inbound PSTN)
 *
 * TWO-WAY AUDIO is automatic — WebRTC in browser ↔ Twilio ↔ PSTN ↔ customer phone.
 */
exports.handleVoiceWebhook = (req, res) => {
  const { To, From, Direction } = req.body || req.query;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  
  console.log(`📞 [VOICE WEBHOOK] Call Request: From=${From}, To=${To}, Direction=${Direction}`);

  const twiml = new twilio.twiml.VoiceResponse();

  // CASE 1: Outbound Call from Browser
  // Twilio Browser SDK sends the "To" parameter we passed in device.connect()
  if (To && To !== twilioNumber) {
    console.log(`🚀 [OUTBOUND] Browser calling PSTN: ${To}`);
    const dial = twiml.dial({
      callerId: twilioNumber,
      answerOnBridge: true, // Connect audio immediately
      record: 'record-from-ringing-dual',
      recordingStatusCallback: `${process.env.BASE_URL || ''}/api/voice/recording-status`,
    });
    dial.number(To);
  } 
  // CASE 2: Inbound Call from PSTN to Browser
  // "To" will match our Twilio number
  else {
    console.log(`📥 [INBOUND] PSTN calling Browser: From=${From}`);
    const dial = twiml.dial({
      timeout: 20,
      answerOnBridge: true,
    });
    // Route to the browser client. 
    // We use 'employee_default' as a fallback, or we could use a specific ID if passed.
    dial.client('employee_default'); 
  }

  res.type('text/xml');
  res.send(twiml.toString());
};

/**
 * Call Status Callback — Twilio notifies us when call state changes.
 * Updates the DB record so the dashboard stays in sync.
 */
exports.handleCallStatus = async (req, res) => {
  const { CallSid, CallStatus, To, From, Duration } = req.body;
  console.log(`📡 [VOICE STATUS] SID=${CallSid}, Status=${CallStatus}, Duration=${Duration}s`);

  try {
    const call = await Call.findOne({ twilioSid: CallSid });
    if (call) {
      if (CallStatus === 'completed' || CallStatus === 'failed' || CallStatus === 'no-answer') {
        call.status  = CallStatus === 'completed' ? 'Completed' : 'Missed';
        call.endTime = new Date();
        if (Duration) call.duration = parseInt(Duration);
        await call.save();
      }
    }
  } catch (err) {
    console.error('❌ [VOICE STATUS] DB error:', err.message);
  }

  res.status(200).send('OK');
};

/**
 * Recording Status Callback — Twilio sends recording URL when ready.
 */
exports.handleRecordingStatus = async (req, res) => {
  const { RecordingUrl, CallSid, RecordingSid } = req.body;
  console.log(`🎙️  [RECORDING] CallSid=${CallSid}, URL=${RecordingUrl}`);

  try {
    const call = await Call.findOne({ twilioSid: CallSid });
    if (call && RecordingUrl) {
      call.recordingUrl = RecordingUrl + '.mp3'; // Twilio appends format
      await call.save();
      console.log(`✅ [RECORDING] Saved recording for call ${CallSid}`);
    }
  } catch (err) {
    console.error('❌ [RECORDING] DB error:', err.message);
  }

  res.status(200).send('OK');
};

/**
 * Fetch Exotel SIP Credentials for WebRTC
 */
exports.getExotelCredentials = (req, res) => {
  res.json({
    host: process.env.EXOTEL_WEBRTC_HOST || 'sip.exotel.com',
    username: process.env.EXOTEL_SIP_USERNAME || 'demo_sip_user',
    password: process.env.EXOTEL_SIP_PASSWORD || 'demo_sip_pass',
    port: 5062 // default wss port
  });
};
