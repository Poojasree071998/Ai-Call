const express = require('express');
const router = express.Router();
const callController = require('../controllers/callController');

// Exotel Webhooks
router.get('/incoming', callController.handleIncomingCall); // Exotel defaults
router.post('/incoming', callController.handleIncomingCall); // Some configs use POST
router.get('/menu-selection', callController.handleMenuSelection);
router.get('/end-call', callController.handleEndCall);
router.get('/status', callController.handleStatusCallback);
router.post('/purge', callController.purgeCalls);

// Dashboard API
router.get('/history', callController.getCallHistory);
router.get('/metrics', callController.getMetrics);
router.get('/active', callController.getActiveCalls);
router.post('/attend/:id', callController.attendCall);
router.post('/finish/:id', callController.finishCall);

// Outbound Call Center Features
router.post('/trigger-outbound', callController.triggerOutboundCall);
router.post('/update-status', callController.updateStatus);
router.all('/bridge-outbound', callController.bridgeOutboundXML);

module.exports = router;
