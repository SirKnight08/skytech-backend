require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// Serve static frontend from skytech-portfolio when deployed together
app.use(express.static(path.join(__dirname, '..', 'skytech-portfolio')));

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Basic contact endpoint (stores to a JSON file for now)
const fs = require('fs');
const CONTACT_LOG = path.join(__dirname, 'contacts.json');

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, service, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' });

    const entry = { id: Date.now(), name, email, phone, company, service, message, createdAt: new Date().toISOString() };
    let arr = [];
    try { arr = JSON.parse(fs.readFileSync(CONTACT_LOG, 'utf8') || '[]'); } catch (e) { arr = []; }
    arr.unshift(entry);
    fs.writeFileSync(CONTACT_LOG, JSON.stringify(arr, null, 2));

    // TODO: send email via Nodemailer using SMTP config in .env

    return res.json({ message: 'Received. Thank you.' });
  } catch (err) {
    console.error('Contact error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'skytech-portfolio', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SkyTech backend running on ${PORT}`));
