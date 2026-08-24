/**
 * Database Migration Script: OLD MongoDB → NEW MongoDB
 *
 * Migrates all data from OLD_MONGODB_URI to MONGODB_URI
 *
 * Collections (10 total):
 * - Phase 1 (independent): admins, membershipplans, settings, herocontent, howitworkscontents
 * - Phase 2: users
 * - Phase 3 (dependent on users): userkeys, conversations, transactions
 * - Phase 4 (dependent on conversations): messages
 *
 * Usage:
 *   node scripts/migrate-database.js
 *
 * Prerequisites:
 *   - Add OLD_MONGODB_URI to .env file pointing to source database
 *   - MONGODB_URI should point to target database
 */

const { MongoClient } = require('mongodb');
require('dotenv').config();

const OLD_MONGODB_URI = process.env.OLD_MONGODB_URI;
const NEW_MONGODB_URI = process.env.MONGODB_URI;

// Collections organized by migration phase (dependency order)
const MIGRATION_PHASES = [
  {
    name: 'Phase 1: Independent Collections',
    collections: ['admins', 'membershipplans', 'settings', 'herocontent', 'howitworkscontents']
  },
  {
    name: 'Phase 2: Core User Data',
    collections: ['users']
  },
  {
    name: 'Phase 3: User-dependent Collections',
    collections: ['userkeys', 'conversations', 'transactions']
  },
  {
    name: 'Phase 4: Conversation-dependent Collections',
    collections: ['messages']
  }
];

/**
 * Migrate a single collection from source to target database
 * @param {Db} sourceDb - Source MongoDB database
 * @param {Db} targetDb - Target MongoDB database
 * @param {string} collectionName - Name of the collection to migrate
 * @returns {Object} Migration statistics
 */
async function migrateCollection(sourceDb, targetDb, collectionName) {
  const sourceCollection = sourceDb.collection(collectionName);
  const targetCollection = targetDb.collection(collectionName);

  // Get source document count
  const sourceCount = await sourceCollection.countDocuments();

  if (sourceCount === 0) {
    return {
      collection: collectionName,
      sourceCount: 0,
      targetCount: 0,
      migrated: 0,
      skipped: 0,
      errors: 0,
      status: 'empty'
    };
  }

  // Fetch all documents from source (preserving _id)
  const documents = await sourceCollection.find({}).toArray();

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  // Use insertMany with ordered: false for performance
  // This continues on duplicate key errors
  try {
    const result = await targetCollection.insertMany(documents, {
      ordered: false // Continue even if some inserts fail (e.g., duplicates)
    });
    migrated = result.insertedCount;
  } catch (error) {
    if (error.code === 11000 || error.writeErrors) {
      // Handle duplicate key errors (documents already exist)
      migrated = error.insertedCount || 0;
      skipped = error.writeErrors ? error.writeErrors.length : (documents.length - migrated);

      // Log individual errors if verbose debugging needed
      if (error.writeErrors) {
        errors = error.writeErrors.filter(e => e.code !== 11000).length;
      }
    } else {
      throw error;
    }
  }

  // Get final target count
  const targetCount = await targetCollection.countDocuments();

  return {
    collection: collectionName,
    sourceCount,
    targetCount,
    migrated,
    skipped,
    errors,
    status: sourceCount === targetCount ? 'complete' : 'partial'
  };
}

/**
 * Print migration results in a formatted table
 * @param {Array} results - Array of migration result objects
 */
function printResults(results) {
  console.log('\n┌────────────────────────┬──────────┬──────────┬──────────┬─────────┬────────┬──────────┐');
  console.log('│ Collection             │  Source  │  Target  │ Migrated │ Skipped │ Errors │  Status  │');
  console.log('├────────────────────────┼──────────┼──────────┼──────────┼─────────┼────────┼──────────┤');

  for (const r of results) {
    const col = r.collection.padEnd(22);
    const src = String(r.sourceCount).padStart(8);
    const tgt = String(r.targetCount).padStart(8);
    const mig = String(r.migrated).padStart(8);
    const skip = String(r.skipped).padStart(7);
    const err = String(r.errors).padStart(6);
    const status = r.status === 'complete' ? '    ✓   ' : r.status === 'empty' ? '  empty ' : ' partial';

    console.log(`│ ${col} │ ${src} │ ${tgt} │ ${mig} │ ${skip} │ ${err} │${status} │`);
  }

  console.log('└────────────────────────┴──────────┴──────────┴──────────┴─────────┴────────┴──────────┘');
}

/**
 * Main migration function
 */
async function migrate() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║           SNGS Matrimonial - Database Migration Tool               ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝\n');

  // Validate environment variables
  if (!OLD_MONGODB_URI) {
    console.error('ERROR: OLD_MONGODB_URI environment variable is not set.');
    console.error('Add OLD_MONGODB_URI=<your-old-mongodb-connection-string> to .env file');
    process.exit(1);
  }

  if (!NEW_MONGODB_URI) {
    console.error('ERROR: MONGODB_URI environment variable is not set.');
    console.error('Add MONGODB_URI=<your-new-mongodb-connection-string> to .env file');
    process.exit(1);
  }

  let sourceClient = null;
  let targetClient = null;

  try {
    // Connect to source (OLD) database
    console.log('Connecting to source database (OLD)...');
    sourceClient = new MongoClient(OLD_MONGODB_URI);
    await sourceClient.connect();
    const sourceDb = sourceClient.db();
    console.log(`  ✓ Connected to source: ${sourceDb.databaseName}`);

    // Connect to target (NEW) database
    console.log('Connecting to target database (NEW)...');
    targetClient = new MongoClient(NEW_MONGODB_URI);
    await targetClient.connect();
    const targetDb = targetClient.db();
    console.log(`  ✓ Connected to target: ${targetDb.databaseName}`);

    // Verify source collections exist
    console.log('\nVerifying source collections...');
    const sourceCollections = await sourceDb.listCollections().toArray();
    const sourceCollectionNames = sourceCollections.map(c => c.name);
    console.log(`  Found ${sourceCollectionNames.length} collections in source database`);

    const allResults = [];

    // Migrate collections in phases
    for (const phase of MIGRATION_PHASES) {
      console.log(`\n━━━ ${phase.name} ━━━`);

      for (const collectionName of phase.collections) {
        // Check if collection exists in source
        if (!sourceCollectionNames.includes(collectionName)) {
          console.log(`  ⚠ ${collectionName}: Collection not found in source database (skipping)`);
          allResults.push({
            collection: collectionName,
            sourceCount: 0,
            targetCount: 0,
            migrated: 0,
            skipped: 0,
            errors: 0,
            status: 'not_found'
          });
          continue;
        }

        process.stdout.write(`  → Migrating ${collectionName}...`);

        const result = await migrateCollection(sourceDb, targetDb, collectionName);
        allResults.push(result);

        if (result.status === 'complete') {
          console.log(` ✓ (${result.migrated} docs)`);
        } else if (result.status === 'empty') {
          console.log(' ○ (empty collection)');
        } else {
          console.log(` ⚠ (${result.migrated} new, ${result.skipped} existing)`);
        }
      }
    }

    // Print summary table
    console.log('\n════════════════════════════════════════════════════════════════════');
    console.log('                        MIGRATION SUMMARY');
    printResults(allResults);

    // Calculate totals
    const totalSource = allResults.reduce((sum, r) => sum + r.sourceCount, 0);
    const totalTarget = allResults.reduce((sum, r) => sum + r.targetCount, 0);
    const totalMigrated = allResults.reduce((sum, r) => sum + r.migrated, 0);
    const totalSkipped = allResults.reduce((sum, r) => sum + r.skipped, 0);
    const totalErrors = allResults.reduce((sum, r) => sum + r.errors, 0);

    console.log(`\nTotal documents: Source=${totalSource}, Target=${totalTarget}`);
    console.log(`Migration: ${totalMigrated} new, ${totalSkipped} existing, ${totalErrors} errors`);

    // Final status
    if (totalErrors === 0 && totalSource === totalTarget) {
      console.log('\n✅ Migration completed successfully!');
    } else if (totalErrors > 0) {
      console.log('\n⚠ Migration completed with errors. Review the results above.');
    } else {
      console.log('\n✅ Migration completed. Some documents already existed in target.');
    }

    // Verification reminder
    console.log('\n────────────────────────────────────────────────────────────────────');
    console.log('POST-MIGRATION VERIFICATION:');
    console.log('  1. Test user login at frontend (http://localhost:3000)');
    console.log('  2. Test admin login at admin panel');
    console.log('  3. Check that profiles display correctly');
    console.log('  4. Verify chat history loads (if any messages exist)');
    console.log('  5. Confirm payment history is accessible');
    console.log('────────────────────────────────────────────────────────────────────\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Close connections
    if (sourceClient) {
      await sourceClient.close();
      console.log('Source database connection closed.');
    }
    if (targetClient) {
      await targetClient.close();
      console.log('Target database connection closed.');
    }
  }
}

// Run migration
migrate();
