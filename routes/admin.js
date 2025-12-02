const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');
const Order = require('../models/Order');
const User = require('../models/User');
const { isLoggedIn, isAdmin } = require('./auth');

// Admin dashboard stats route
router.get('/', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalUsers = await User.countDocuments();

    res.json({ totalProducts, totalOrders, totalUsers });
  } catch (err) {
    console.error('Error fetching dashboard data:', err);
    res.status(500).json({ message: 'Failed to load dashboard data' });
  }
});

// ----- Multer setup for file upload -----
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// ----- GET all products (for admin dashboard) -----
router.get('/products', async (req, res) => {
  try {
    const search = req.query.search;
    let query = {};

    if (search) {
      query = {
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ]
      };
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    console.error('Error fetching products:', err);
    res.status(500).json({ error: 'Server error while fetching products' });
  }
});

// ----- POST new product -----
router.post('/products', upload.single('image'), async (req, res) => {
  try {
    const { name, price, stock, description, category } = req.body;
    const image = req.file ? `/uploads/${req.file.filename}` : '';
    const product = new Product({ name, price, stock, description, category, image });
    await product.save();
    res.status(201).json({ message: 'Product added', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- PUT update product -----
router.put('/products/:id', upload.single('image'), async (req, res) => {
  try {
    const { name, price, stock, description, category } = req.body;
    const updateData = { name, price, stock, description, category };
    if (req.file) updateData.image = `/uploads/${req.file.filename}`;

    const product = await Product.findByIdAndUpdate(req.params.id, updateData, { new: true });
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated', product });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----- DELETE product -----
router.delete('/products/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== USER MANAGEMENT ====================
router.get('/users', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude passwords
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Server error while fetching users' });
  }
});

// UPDATE user role (Admin only)
router.put('/users/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const { role } = req.body;
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    if (!updatedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User role updated', user: updatedUser });
  } catch (err) {
    console.error('Error updating user role:', err);
    res.status(500).json({ message: 'Server error while updating user role' });
  }
});

// DELETE user (Admin only)
router.delete('/users/:id', isLoggedIn, isAdmin, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Error deleting user:', err);
    res.status(500).json({ message: 'Server error while deleting user' });
  }
});

module.exports = router;
