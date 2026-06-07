#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const Contact = require('./models/contact');
const fs = require('fs');

async function main(){
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in env');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to MongoDB');
  const count = await Contact.countDocuments();
  console.log('Contacts in DB:', count);
  const localFile = './contacts.json';
  if (fs.existsSync(localFile)) {
    const data = JSON.parse(fs.readFileSync(localFile,'utf8')||'[]');
    console.log('Local contacts.json length:', data.length);
    if (data.length > 0) {
      console.log('Migrating local contacts to MongoDB...');
      for (const c of data) {
        const { name,email,phone,company,service,message,createdAt } = c;
        await Contact.create({ name,email,phone,company,service,message, createdAt: createdAt ? new Date(createdAt) : undefined });
      }
      console.log('Migration complete.');
    }
  }
  process.exit(0);
}

main().catch(err=>{ console.error(err); process.exit(2); });
