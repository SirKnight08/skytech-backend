require('dotenv').config();
const express = require('express');
const cors = require('cors');
const contactRouter = require('./routes/contact');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.send('SkyTech Backend API is running');
});

app.use('/api/contact', contactRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'SkyTech backend running' });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use((err, req, res, next) => {
  console.error('Unexpected error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});

app.listen(PORT, HOST, () => {
  console.log(`SkyTech backend running on ${HOST}:${PORT}`);
});
