const express = require('express');
const router  = express.Router();
const voiceController = require('../controllers/voiceController');

// Browser token — called by the dashboard on load to initialise Twilio.Device
router.get('/token', voiceController.generateToken);

// TwiML Webhook — Twilio calls this URL when the browser makes/receives a call
// IMPORTANT: Point your Twilio TwiML App's "Voice URL" to:
//   https://<your-ngrok-url>/api/voice/webhook  (POST)
router.post('/webhook', voiceController.handleVoiceWebhook);
router.get('/webhook',  voiceController.handleVoiceWebhook); // fallback

// Call status callbacks from Twilio
router.post('/call-status',      voiceController.handleCallStatus);
router.post('/recording-status', voiceController.handleRecordingStatus);

// Exotel WebRTC credentials
router.get('/exotel-credentials', voiceController.getExotelCredentials);

module.exports = router;
