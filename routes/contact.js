const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const { sendContactEmail } = require('../services/mailer');

const router = express.Router();
const CONTACTS_FILE = path.join(__dirname, '..', 'data', 'contacts.json');
const requiredFields = ['name', 'email', 'message'];

async function readContacts() {
  try {
    const contents = await fs.readFile(CONTACTS_FILE, 'utf8');
    return JSON.parse(contents || '[]');
  } catch (error) {
    return [];
  }
}

async function writeContacts(contacts) {
  await fs.writeFile(CONTACTS_FILE, JSON.stringify(contacts, null, 2), 'utf8');
}

router.post('/', async (req, res) => {
  const { name, email, phone = '', company = '', service = '', message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'name, email, and message are required' });
  }

  const contactEntry = {
    id: Date.now(),
    name: String(name).trim(),
    email: String(email).trim(),
    phone: String(phone).trim(),
    company: String(company).trim(),
    service: String(service).trim(),
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  };

  console.log('Received contact submission:', {
    name: contactEntry.name,
    email: contactEntry.email,
    phone: contactEntry.phone,
    company: contactEntry.company,
    service: contactEntry.service,
    message: contactEntry.message,
  });

  try {
    const existingContacts = await readContacts();
    existingContacts.push(contactEntry);
    await writeContacts(existingContacts);
  } catch (error) {
    console.error('Failed to save contact backup:', error);
    return res.status(500).json({ success: false, message: 'Unable to save contact locally' });
  }

  try {
    await sendContactEmail(contactEntry);
  } catch (error) {
    console.warn('Email send skipped or failed:', error?.message || error);
  }

  return res.json({ success: true, message: 'Message received successfully' });
});

module.exports = router;
