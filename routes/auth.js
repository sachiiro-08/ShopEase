const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken'); 

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key_if_dotenv_fails'; 

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 1) Check if email taken
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send("Email already registered");

    // 2) Hash password
    const hashed = await bcrypt.hash(password, 10);

    // 3) Save user
    await User.create({
      username,
      email,
      password: hashed,
      role: "customer"
    });

    // 4) Redirect or front-end fetch() handler
    res.status(200).send("REGISTER_SUCCESS");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

//LOGIN 
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(400).send('Invalid email or password');
        }

        // FIX: CREATE A JSON WEB TOKEN (JWT)
        const token = jwt.sign(
            { id: user._id, role: user.role }, // Payload: Data to store in the token
            JWT_SECRET,
            { expiresIn: '7d' } // Token expires in 1 hour
        );

        // 🌟 Send the token back to the client 🌟
        res.status(200).json({
            message: "LOGIN_SUCCESS",
            role: user.role,
            token: token // <-- Client must save this!
        });

    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// AUTHORIZATION MIDDLEWARE (FIXED TO VERIFY JWT) 
const isLoggedIn = (req, res, next) => {
    // 🌟 FIX: Check for token in the Authorization header 🌟
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).send('Unauthorized. Token missing or malformed.');
    }
    
    // Extract the token (removing "Bearer ")
    const token = authHeader.split(' ')[1];

    try {
        // Verify the token
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Attach the user's ID to the request object
        req.userId = decoded.id; 
        req.userRole = decoded.role;
        
        next(); // Proceed to the protected route logic (e.g., checkout)

    } catch (err) {
        // Token is invalid, expired, or tampered with
        console.error("JWT verification failed:", err.message);
        return res.status(401).send('Unauthorized. Invalid token.');
    }
};

const isAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(403).send('Access Denied. Please log in as an Admin.');
    }

    const token = authHeader.split(' ')[1];
    const verified = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(verified.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).send('Access Denied. Please log in as an Admin.');
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('JWT verification failed:', err.message);
    res.status(403).send('Access Denied. Please log in as an Admin.');
  }
};

module.exports = { 
    router, 
    isLoggedIn, 
    isAdmin
};