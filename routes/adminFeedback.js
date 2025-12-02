const express = require('express');
const router = express.Router();
const Feedback = require('../models/feedback');
const { isLoggedIn, isAdmin } = require('./auth');

// POST feedback (user must be logged in)
router.get('/feedback', isAdmin, async (req, res) => {
    try {
        const feedbacks = await Feedback.find()
            .populate('userId', 'username email') // pull username & email
            .sort({ createdAt: -1 });
        res.json(feedbacks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error while fetching feedbacks' });
    }
});

module.exports = router;
