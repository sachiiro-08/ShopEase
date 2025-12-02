//This is for express routes
const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});

const upload = multer({ storage });

// GET all products
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;

        let query = {};
        if (search) {
            const regex = new RegExp(search, 'i'); 
            query = {
                $or: [
                    { name: regex },
                    { description: regex },
                    { category: regex }
                ]
            };
        }

        const products = await Product.find(query);
        res.json(products);
    } catch (err) {
        console.error('Error fetching products:', err);
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
});


// GET a single product by ID
router.get('/:id', async (req, res) => {
    try {
        // Use findById to retrieve a single document by its ID
        const product = await Product.findById(req.params.id); 
        
        // If no product is found with that ID, return a 404
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        
        // Return the product data as JSON
        res.json(product);
    } catch (err) {
        // Handle common errors like invalid MongoDB ID format (CastError)
        if (err.kind === 'ObjectId') {
             return res.status(400).json({ error: 'Invalid Product ID format' });
        }
        res.status(500).json({ error: err.message });
    }
});

// POST new product 
router.post('/', upload.single('image'), async (req, res) => {
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

// PUT update product
router.put('/:id', upload.single('image'), async (req, res) => {
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

// DELETE product
router.delete('/:id', async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
