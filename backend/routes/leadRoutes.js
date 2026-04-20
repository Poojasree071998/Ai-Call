const express = require('express');
const router = express.Router();
const leadController = require('../controllers/leadController');

router.get('/', leadController.getAllLeads);
router.post('/', leadController.createLead);
router.get('/:id', leadController.getLeadById);
router.patch('/:id', leadController.updateLead);

module.exports = router;
