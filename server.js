require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');

const Contact = require('./models/contact');
const Project = require('./models/project');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Admin = require('./models/admin');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB when MONGODB_URI is present
const MONGO = process.env.MONGODB_URI;
if (MONGO) {
  mongoose.connect(MONGO, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error', err));
} else {
  console.warn('MONGODB_URI not set — running with file-backed fallback');
}

// Serve static frontend from skytech-portfolio when deployed together
app.use(express.static(path.join(__dirname, '..', 'skytech-portfolio')));

// Simple health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Create nodemailer transporter if SMTP config present
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

// Contact endpoint — persists to MongoDB if configured, else to a JSON file
const fs = require('fs');
const CONTACT_LOG = path.join(__dirname, 'contacts.json');

app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, phone, company, service, message } = req.body || {};
    if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' });

    const payload = { name, email, phone, company, service, message };

    let saved = null;
    if (mongoose.connection.readyState === 1) {
      const doc = new Contact(payload);
      saved = await doc.save();
    } else {
      const entry = { id: Date.now(), ...payload, createdAt: new Date().toISOString() };
      let arr = [];
      try { arr = JSON.parse(fs.readFileSync(CONTACT_LOG, 'utf8') || '[]'); } catch (e) { arr = []; }
      arr.unshift(entry);
      fs.writeFileSync(CONTACT_LOG, JSON.stringify(arr, null, 2));
      saved = entry;
    }

    // Send notification email if transporter available
    if (transporter) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM || process.env.SMTP_USER,
          to: process.env.NOTIFY_EMAIL || process.env.EMAIL_FROM,
          subject: `New contact from ${name}`,
          text: `Name: ${name}\nEmail: ${email}\nPhone: ${phone || ''}\nCompany: ${company || ''}\nService: ${service || ''}\n\nMessage:\n${message}`,
        });
      } catch (e) {
        console.error('Email send failed', e);
      }
    }

    return res.json({ message: 'Received. Thank you.', data: saved });
  } catch (err) {
    console.error('Contact error', err);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin auth
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS || 'change_me';
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change';

app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
  // Try DB-backed admin first
  try {
    if (mongoose.connection.readyState === 1) {
      const admin = await Admin.findOne({ username }).lean();
      if (admin) {
        const ok = await bcrypt.compare(password, admin.passwordHash);
        if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
        const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '8h' });
        return res.json({ token });
      }
    }
  } catch (e) {
    console.error('Admin lookup error', e);
  }
  // Fallback to env-based admin
  if (username !== ADMIN_USER || password !== ADMIN_PASS) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ sub: username }, JWT_SECRET, { expiresIn: '8h' });
  return res.json({ token });
});

function requireAuth(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Unauthorized' });
  const token = auth.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    return next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

app.get('/api/admin/contacts', requireAuth, async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const items = await Contact.find().sort({ createdAt: -1 }).limit(500).lean();
      return res.json({ data: items });
    }
    const arr = JSON.parse(fs.readFileSync(CONTACT_LOG, 'utf8') || '[]');
    return res.json({ data: arr });
  } catch (e) {
    console.error('Admin contacts error', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Protected endpoint to send a test email
app.post('/api/admin/test-email', requireAuth, async (req, res) => {
  if (!transporter) return res.status(400).json({ error: 'SMTP not configured' });
  const to = req.body?.to || process.env.NOTIFY_EMAIL || process.env.EMAIL_FROM;
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: 'SkyTech test email',
      text: 'This is a test email from SkyTech backend.',
    });
    return res.json({ message: 'Test email sent' });
  } catch (e) {
    console.error('Test email failed', e);
    return res.status(500).json({ error: 'Failed to send test email' });
  }
});

// Public projects listing
app.get('/api/projects', async (req, res) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const items = await Project.find().sort({ createdAt: -1 }).lean();
      return res.json({ data: items });
    }
    const pj = JSON.parse(fs.readFileSync(path.join(__dirname,'projects.json'),'utf8')||'[]');
    return res.json({ data: pj });
  } catch (e) {
    console.error('Projects list error', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// Admin project management
app.post('/api/admin/projects', requireAuth, async (req, res) => {
  try {
    const payload = req.body || {};
    if (mongoose.connection.readyState === 1) {
      const p = new Project(payload);
      const saved = await p.save();
      return res.json({ data: saved });
    }
    // fallback
    const file = path.join(__dirname,'projects.json');
    const arr = JSON.parse(fs.readFileSync(file,'utf8')||'[]');
    arr.unshift({ id: Date.now(), ...payload, createdAt: new Date().toISOString() });
    fs.writeFileSync(file, JSON.stringify(arr,null,2));
    return res.json({ data: arr[0] });
  } catch (e) {
    console.error('Create project error', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/admin/projects/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const payload = req.body || {};
    if (mongoose.connection.readyState === 1) {
      const updated = await Project.findByIdAndUpdate(id, payload, { new: true });
      return res.json({ data: updated });
    }
    return res.status(400).json({ error: 'Fallback update not implemented' });
  } catch (e) {
    console.error('Update project error', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/projects/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    if (mongoose.connection.readyState === 1) {
      await Project.findByIdAndDelete(id);
      return res.json({ message: 'Deleted' });
    }
    return res.status(400).json({ error: 'Fallback delete not implemented' });
  } catch (e) {
    console.error('Delete project error', e);
    return res.status(500).json({ error: 'Server error' });
  }
});

// fallback to index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'skytech-portfolio', 'index.html'));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SkyTech backend running on ${PORT}`));
