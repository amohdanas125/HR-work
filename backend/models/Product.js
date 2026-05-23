const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  cat: {
    type: String,
    required: true,
    trim: true
  },
  images: {
    type: [String],
    default: []
  },
  sizes: {
    type: [String],
    default: ['Universal']
  },
  icon: {
    type: String,
    default: '📦'
  },
  size: {
    type: String,
    default: 'Universal'
  },
  desc: {
    type: String,
    default: '',
    trim: true
  },
  material: {
    type: String,
    default: '',
    trim: true
  },
  sterile: {
    type: String,
    default: 'Non-Sterile'
  },
  spec: {
    type: String,
    default: '',
    trim: true
  },
  moq: {
    type: String,
    default: '10 units',
    trim: true
  },
  packaging: {
    type: String,
    default: 'Individual / Bulk',
    trim: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Product', ProductSchema);
