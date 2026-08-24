const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
require('dotenv').config();

async function cleanupInvalidConversations() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const conversations = await Conversation.find({});
    console.log(`Found ${conversations.length} total conversations`);

    let invalidCount = 0;
    let deletedCount = 0;

    for (const conv of conversations) {
      const validParticipants = [];

      // Check each participant
      for (const participantId of conv.participants) {
        const user = await User.findById(participantId);
        if (user) {
          validParticipants.push(participantId);
        } else {
          console.warn(
            `Invalid participant ${participantId} in conversation ${conv._id}`
          );
          invalidCount++;
        }
      }

      // Delete conversation if it has less than 2 valid participants
      if (validParticipants.length < 2) {
        console.log(
          `Deleting conversation ${conv._id} (only ${validParticipants.length} valid participants)`
        );
        await Conversation.deleteOne({ _id: conv._id });
        deletedCount++;
      }
    }

    console.log('\nCleanup Summary:');
    console.log(`- Invalid participants found: ${invalidCount}`);
    console.log(`- Conversations deleted: ${deletedCount}`);
    console.log(`- Valid conversations remaining: ${conversations.length - deletedCount}`);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error during cleanup:', error);
    process.exit(1);
  }
}

cleanupInvalidConversations();
