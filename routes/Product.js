// for mongoose schema
const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  stock: { type: Number, default: 0 },
  description: { type: String },
  image: { type: String }, // URL or file path
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
