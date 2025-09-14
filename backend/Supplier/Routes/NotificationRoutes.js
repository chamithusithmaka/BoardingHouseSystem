const express = require('express');
const router = express.Router();
const EmailService = require('../../Services/EmailService');

router.post('/send', async (req, res) => {
  const { recipientEmail, subject, message } = req.body;
  if (!recipientEmail || !subject || !message) {
    return res.status(400).json({ status: 'fail', message: 'All fields are required.' });
  }
  try {
    // FIX: Use the correct method to send to the user
    await EmailService.sendSupplierAnnouncement({ subject, message, email: recipientEmail });
    res.json({ status: 'success', message: 'Notification sent.' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: 'Failed to send notification.' });
  }
});

module.exports = router;