// test-mongo.js
require('dotenv').config({ path: './.env.local' }); // Load .env.local
const mongoose = require('mongoose');

const MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

if (!MONGODB_URI) {
  console.error('ERROR: NEXT_PUBLIC_MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

console.log('Attempting to connect to MongoDB with Mongoose...');
console.log('URI:', MONGODB_URI.replace(/:([^:@\s]+)@/, ':*****@')); // Hide password

const opts = {
  serverSelectionTimeoutMS: 30000, // 30 second timeout
};

mongoose.connect(MONGODB_URI, opts)
  .then(() => {
    console.log('\n✅ SUCCESS: Mongoose connected successfully!');
    mongoose.connection.close();
    process.exit(0);
  })
  .catch(err => {
    console.error('\n❌ FAILED: Mongoose connection error.');
    console.error(err);
    process.exit(1);
  });