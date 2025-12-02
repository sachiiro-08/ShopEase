const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const { isLoggedIn } = require('./auth'); // or '../middleware/auth' if that's where your auth is

// POST /api/feedback - user submits feedback
router.post('/', isLoggedIn, async (req, res) => {
    const { message } = req.body;
    if (!message) return res.status(400).json({ message: 'Feedback cannot be empty' });

    try {
        const feedback = new Feedback({
            userId: req.userId, // from isLoggedIn middleware
            message
        });
        await feedback.save();
        res.status(201).json({ message: 'Feedback submitted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while submitting feedback' });
    }
});

module.exports = router;
