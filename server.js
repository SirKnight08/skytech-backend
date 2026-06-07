require('dotenv').config();
const express = require('express');
const cors = require('cors');
const contactRouter = require('./routes/contact');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/contact', contactRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'SkyTech backend running' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`SkyTech backend running on port ${PORT}`);
});
