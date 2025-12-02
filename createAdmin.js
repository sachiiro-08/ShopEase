require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // check AFTER connecting
    const exists = await User.findOne({ email: 'admin@shopease.com' });
    if (exists) {
      console.log("Admin already exists");
      return mongoose.disconnect();
    }

    const hashedPassword = await bcrypt.hash('Admin123!', 10);

    const admin = new User({
      username: 'Admin',
      email: 'admin@shopease.com',
      password: hashedPassword,
      role: 'admin',
    });

    await admin.save();
    console.log('Admin user created successfully!');

    mongoose.disconnect();
  } catch (err) {
    console.error(err);
  }
};

createAdmin();
