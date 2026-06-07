const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  category: { type: String },
  description: { type: String },
  stack: [String],
  images: [String],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.models.Project || mongoose.model('Project', ProjectSchema);
