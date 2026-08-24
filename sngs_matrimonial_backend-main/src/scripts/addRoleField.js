const mongoose = require('mongoose');
const User = require('../models/User');

async function migrateUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update all existing users to have role: 'user' if not set
    const roleResult = await User.updateMany(
      { role: { $exists: false } },
      { $set: { role: 'user' } }
    );

    console.log(`✓ Updated ${roleResult.modifiedCount} users with role: 'user'`);

    // Update all existing users to have isActive: true if not set
    const activeResult = await User.updateMany(
      { isActive: { $exists: false } },
      { $set: { isActive: true } }
    );

    console.log(`✓ Updated ${activeResult.modifiedCount} users with isActive: true`);

    console.log('\n✓ Migration completed successfully!');
    console.log('All existing users now have role=user and isActive=true');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrateUsers();
