require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const MembershipPlan = require('../models/MembershipPlan');

async function seedMembershipPlan() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Check if a default membership plan already exists
    const existingDefaultPlan = await MembershipPlan.findOne({ isDefault: true });
    if (existingDefaultPlan) {
      console.log('\n✓ Default membership plan already exists!');
      console.log(`\nExisting Plan Details:`);
      console.log(`  Name: ${existingDefaultPlan.name}`);
      console.log(`  ID: ${existingDefaultPlan._id}`);
      console.log(`  Credits: ${existingDefaultPlan.credits}`);
      console.log(`  Price: ₹${existingDefaultPlan.price.amount} (${existingDefaultPlan.price.currency})`);
      console.log(`  Validity: ${existingDefaultPlan.validityDays} day(s)`);
      console.log(`  Active: ${existingDefaultPlan.isActive}`);
      await mongoose.disconnect();
      process.exit(0);
    }

    // Create the Starter Membership Plan
    const starterPlan = await MembershipPlan.create({
      name: 'Starter Membership',
      description: 'Perfect for getting started with your search',
      credits: 2,
      price: {
        amount: 1000,
        currency: 'INR',
      },
      validityDays: 1,
      isActive: true,
      isDefault: true,
    });

    console.log('\n✓ Starter Membership Plan created successfully!');
    console.log(`\nPlan Details:`);
    console.log(`  Name: ${starterPlan.name}`);
    console.log(`  ID: ${starterPlan._id}`);
    console.log(`  Description: ${starterPlan.description}`);
    console.log(`  Credits: ${starterPlan.credits}`);
    console.log(`  Price: ₹${starterPlan.price.amount} (${starterPlan.price.currency})`);
    console.log(`  Validity: ${starterPlan.validityDays} day(s)`);
    console.log(`  Active: ${starterPlan.isActive}`);
    console.log(`  Default: ${starterPlan.isDefault}`);
    console.log(`  Created: ${starterPlan.createdAt}`);

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    await mongoose.disconnect();
    process.exit(1);
  }
}

seedMembershipPlan();
