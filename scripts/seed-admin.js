// scripts/seed-admin.js

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');

// Load environment variables from .env.local
dotenv.config({ path: './.env.local' });

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Error: Missing required environment variables (MONGODB_URI, ADMIN_EMAIL, ADMIN_PASSWORD).');
  process.exit(1);
}

// Define the User schema directly in the script for simplicity
const UserSchema = new mongoose.Schema({
  name: { type: String, default: 'Admin' },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

// Use existing model if it exists, otherwise create a new one
const User = mongoose.models.User || mongoose.model('User', UserSchema);

const seedAdmin = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Successfully connected to MongoDB.');

    // Check if the admin user already exists
    const existingAdmin = await User.findOne({ email: ADMIN_EMAIL });

    if (existingAdmin) {
      console.log('Admin user already exists. No action taken.');
      return;
    }

    // If admin does not exist, create it
    console.log('Admin user not found. Creating a new one...');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

    const adminUser = new User({
      name: 'Fulltime Admin',
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin', // This is crucial!
    });

    await adminUser.save();
    console.log('Admin user created successfully!');

  } catch (error) {
    console.error('Error during admin seeding:', error);
  } finally {
    // Always close the connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
};

seedAdmin();