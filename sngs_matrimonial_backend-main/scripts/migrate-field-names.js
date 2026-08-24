/**
 * Database Migration Script: Rename Ambiguous Fields
 *
 * This script renames and consolidates fields for database clarity:
 * 1. `additionalInfo` → `professionalAdditionalInfo`
 * 2. `about` + `aboutMyself` → `profileAbout` (consolidated into single field)
 *
 * Run this script after deploying the code changes.
 *
 * Usage:
 *   node scripts/migrate-field-names.js
 *
 * Make sure to set the MONGODB_URI environment variable or update the connection string below.
 */

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

async function migrate() {
  console.log('Starting field name migration...');

  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');

    // Get count of documents to migrate
    const totalDocs = await usersCollection.countDocuments();
    console.log(`Total documents to process: ${totalDocs}`);

    // Step 1: Rename additionalInfo to professionalAdditionalInfo
    console.log('\n--- Step 1: Renaming additionalInfo → professionalAdditionalInfo ---');
    const additionalInfoResult = await usersCollection.updateMany(
      { additionalInfo: { $exists: true } },
      { $rename: { additionalInfo: 'professionalAdditionalInfo' } }
    );
    console.log(`Updated ${additionalInfoResult.modifiedCount} documents (additionalInfo → professionalAdditionalInfo)`);

    // Step 2: Consolidate about and aboutMyself into profileAbout
    // Priority: about > aboutMyself (take `about` if it has content, else `aboutMyself`)
    console.log('\n--- Step 2: Consolidating about + aboutMyself → profileAbout ---');

    // First, set profileAbout from `about` field if it exists and has content
    const aboutResult = await usersCollection.updateMany(
      {
        about: { $exists: true, $ne: '', $ne: null },
        profileAbout: { $exists: false }
      },
      [
        {
          $set: {
            profileAbout: '$about'
          }
        }
      ]
    );
    console.log(`Migrated ${aboutResult.modifiedCount} documents (about → profileAbout)`);

    // Then, for documents without profileAbout yet, use aboutMyself if it exists
    const aboutMyselfResult = await usersCollection.updateMany(
      {
        aboutMyself: { $exists: true, $ne: '', $ne: null },
        profileAbout: { $exists: false }
      },
      [
        {
          $set: {
            profileAbout: '$aboutMyself'
          }
        }
      ]
    );
    console.log(`Migrated ${aboutMyselfResult.modifiedCount} documents (aboutMyself → profileAbout)`);

    // Set empty profileAbout for documents that don't have it yet
    const emptyProfileAboutResult = await usersCollection.updateMany(
      { profileAbout: { $exists: false } },
      { $set: { profileAbout: '' } }
    );
    console.log(`Set empty profileAbout for ${emptyProfileAboutResult.modifiedCount} documents`);

    // Step 3: Remove old fields
    console.log('\n--- Step 3: Removing old fields ---');
    const removeResult = await usersCollection.updateMany(
      {},
      { $unset: { additionalInfo: '', about: '', aboutMyself: '' } }
    );
    console.log(`Cleaned up old fields from ${removeResult.modifiedCount} documents`);

    // Verify migration
    console.log('\n--- Verification ---');
    const verifyOldFields = await usersCollection.countDocuments({
      $or: [
        { additionalInfo: { $exists: true } },
        { about: { $exists: true } },
        { aboutMyself: { $exists: true } }
      ]
    });
    console.log(`Documents with old fields remaining: ${verifyOldFields}`);

    const verifyNewFields = await usersCollection.countDocuments({
      $and: [
        { professionalAdditionalInfo: { $exists: true } },
        { profileAbout: { $exists: true } }
      ]
    });
    console.log(`Documents with new fields: ${verifyNewFields}`);

    console.log('\n✅ Migration completed successfully!');

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run migration
migrate();
