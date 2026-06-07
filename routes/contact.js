const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { sendContactEmail } = require('../services/mailer');

const router = express.Router();
const CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contacts.json');
const requiredFields = ['name', 'email', 'phone', 'company', 'service', 'message'];

async function readContacts() {
  try {
    const contents = await fs.readFile(CONTACTS_FILE, 'utf8');
    return JSON.parse(contents || '[]');
  } catch (error) {
    return [];
  }
}

router.post('/', async (req, res) => {
  const payload = req.body || {};
  const hasMissingField = requiredFields.some((field) => !payload[field] || String(payload[field]).trim() === '');

  if (hasMissingField) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  const contactEntry = {
    id: Date.now(),
    name: String(payload.name).trim(),
    email: String(payload.email).trim(),
    phone: String(payload.phone).trim(),
    company: String(payload.company).trim(),
    service: String(payload.service).trim(),
    message: String(payload.message).trim(),
    createdAt: new Date().toISOString(),
  };

  try {
    const existingContacts = await readContacts();
    existingContacts.push(contactEntry);
    await fs.writeFile(CONTACTS_FILE, JSON.stringify(existingContacts, null, 2), 'utf8');
  } catch (error) {
    console.error('Failed to save contact backup:', error);
    return res.status(500).json({ success: false, message: 'Unable to save contact locally' });
  }

  try {
    await sendContactEmail(contactEntry);
    return res.json({ success: true, message: 'Message sent successfully' });
  } catch (error) {
    console.error('Failed to send contact email:', error);
    return res.status(500).json({ success: false, message: 'Failed to send email' });
  }
});

module.exports = router;
