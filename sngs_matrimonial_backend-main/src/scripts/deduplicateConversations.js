const mongoose = require('mongoose');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
require('dotenv').config();

const deduplicateConversations = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    console.log('Finding duplicate conversations...');

    const conversations = await Conversation.find({});
    console.log(`Total conversations found: ${conversations.length}`);

    const participantGroups = new Map();

    // Group conversations by participant pair
    for (const conv of conversations) {
      const key = conv.participants
        .map(p => p.toString())
        .sort()
        .join('|');

      if (!participantGroups.has(key)) {
        participantGroups.set(key, []);
      }
      participantGroups.get(key).push(conv);
    }

    let duplicatesRemoved = 0;
    let messagesRemapped = 0;

    // Process each participant group
    for (const [key, convs] of participantGroups) {
      if (convs.length > 1) {
        console.log(`Found ${convs.length} duplicates for: ${key}`);

        // Sort by createdAt (keep oldest)
        convs.sort((a, b) => a.createdAt - b.createdAt);
        const keepConv = convs[0];
        const removeConvs = convs.slice(1);

        console.log(`  Keeping conversation: ${keepConv._id}`);

        // Migrate messages from duplicates to kept conversation
        for (const dupConv of removeConvs) {
          console.log(`  Merging messages from: ${dupConv._id}`);

          // Update messages to point to kept conversation
          const result = await Message.updateMany(
            { conversationId: dupConv._id },
            { conversationId: keepConv._id }
          );

          messagesRemapped += result.modifiedCount;

          // Delete duplicate conversation
          await Conversation.deleteOne({ _id: dupConv._id });
          duplicatesRemoved++;
        }
      }
    }

    console.log(`\nMigration complete!`);
    console.log(`Removed ${duplicatesRemoved} duplicate conversations`);
    console.log(`Remapped ${messagesRemapped} messages`);

    // Add unique index
    try {
      await Conversation.collection.createIndex(
        { participants: 1 },
        { unique: true, name: 'unique_participants' }
      );
      console.log('Created unique index on participants');
    } catch (err) {
      if (err.code === 11000) {
        console.log('Unique index already exists');
      } else {
        console.log('Index creation error:', err.message);
      }
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

deduplicateConversations();
