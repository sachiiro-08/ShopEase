const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Product = require('../models/Product');


// GET all orders
router.get('/api/orders', async (req, res) => {
  try {
    const orders = await Order.find().populate('products.productId', 'name');
    res.json(orders);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ message: 'Failed to fetch orders.' });
  }
});

// UPDATE order status
router.put('/api/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE an order
router.delete('/api/orders/:id', async (req, res) => {
  try {
    await Order.findByIdAndDelete(req.params.id);
    res.json({ message: 'Order deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/api/orders', async (req, res) => {
  try {
    const { userId, customerName, email, shippingAddress, products, totalPrice } = req.body;

    // Check stock
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product not found: ${item.productId}` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Not enough stock for ${product.name}` });
    }

    // Create order
    const newOrder = new Order({
      user: userId,
      customerName,
      email,
      shippingAddress,
      products,
      totalPrice
    });
    await newOrder.save();

    // Decrement stock
    for (const item of products) {
      const updated = await Product.findByIdAndUpdate(
        item.productId,
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      console.log(`Updated product ${item.productId}: new stock = ${updated.stock}`);
    }

    res.status(201).json({ message: 'Order created successfully', order: newOrder });
  } catch (err) {
    console.error('Error creating order:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});



module.exports = router;
