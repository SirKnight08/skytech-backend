require('dotenv').config();
const nodemailer = require('nodemailer');

const { EMAIL_USER, EMAIL_PASS, EMAIL_TO, EMAIL_FROM } = process.env;

function buildEmailText(data) {
  return [
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
    `Company: ${data.company}`,
    `Service requested: ${data.service}`,
    `Message: ${data.message}`,
    `Timestamp: ${data.createdAt}`,
  ].join('\n');
}

function buildEmailHtml(data) {
  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  return `
    <h2>New SkyTech Contact</h2>
    <p><strong>Name:</strong> ${escapeHtml(data.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(data.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(data.phone)}</p>
    <p><strong>Company:</strong> ${escapeHtml(data.company)}</p>
    <p><strong>Service requested:</strong> ${escapeHtml(data.service)}</p>
    <p><strong>Message:</strong></p>
    <p>${escapeHtml(data.message).replace(/\n/g, '<br>')}</p>
    <p><strong>Timestamp:</strong> ${escapeHtml(data.createdAt)}</p>
  `;
}

function createTransporter() {
  if (!EMAIL_USER || !EMAIL_PASS || !EMAIL_TO) {
    console.log('Nodemailer is not configured yet. Email delivery will be skipped.');
    return null;
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS,
    },
  });
}

async function sendContactEmail(data) {
  const transporter = createTransporter();

  if (!transporter) {
    return { skipped: true };
  }

  const mailOptions = {
    from: EMAIL_FROM || EMAIL_USER,
    to: EMAIL_TO,
    subject: `New SkyTech Contact from ${data.name}`,
    text: buildEmailText(data),
    html: buildEmailHtml(data),
  };

  return transporter.sendMail(mailOptions);
}

module.exports = {
  sendContactEmail,
};
