require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const Admin = require('../models/Admin');

async function createAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get email and password from command line arguments
    const email = process.argv[2];
    const password = process.argv[3];

    if (!email || !password) {
      console.error('Error: Please provide email and password');
      console.log('Usage: node src/scripts/createAdminAccount.js email@example.com password123');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Validate email format
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      console.error('Error: Invalid email format');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Validate password length
    if (password.length < 8) {
      console.error('Error: Password must be at least 8 characters');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      console.error(`Error: Admin with email "${email}" already exists`);
      await mongoose.disconnect();
      process.exit(1);
    }

    // Create admin
    const admin = await Admin.create({
      email,
      password
    });

    console.log('\n✓ Admin account created successfully!');
    console.log(`\nAdmin Details:`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  ID: ${admin._id}`);
    console.log(`  Created: ${admin.createdAt}`);
    console.log(`\nYou can now login at: /admin/login`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

createAdmin();
