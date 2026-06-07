#!/usr/bin/env node
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Admin = require('../models/admin');

async function main(){
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing in env');
    process.exit(1);
  }
  await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  const user = process.argv[2] || process.env.ADMIN_USER || 'admin';
  const pass = process.argv[3] || process.env.ADMIN_PASS || 'change_me';
  const hash = await bcrypt.hash(pass, 10);
  const existing = await Admin.findOne({ username: user });
  if (existing) {
    existing.passwordHash = hash;
    await existing.save();
    console.log('Updated admin password for', user);
  } else {
    await Admin.create({ username: user, passwordHash: hash });
    console.log('Created admin user', user);
  }
  process.exit(0);
}

main().catch(err => { console.error(err); process.exit(2); });
