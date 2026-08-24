const cron = require('node-cron');
const Message = require('../models/Message');

/**
 * Start the message cleanup job
 * Deletes messages older than 30 days
 * Runs daily at 2 AM
 */
const startMessageCleanupJob = () => {
  // Schedule cleanup job to run daily at 2:00 AM
  const job = cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Starting message cleanup job...');

      // Calculate date 30 days ago
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Delete messages older than 30 days
      const result = await Message.deleteMany({
        createdAt: { $lt: thirtyDaysAgo },
      });

      console.log(
        `Message cleanup completed. Deleted ${result.deletedCount} messages.`
      );

      // Log cleanup event
      logCleanupEvent(result.deletedCount, thirtyDaysAgo);
    } catch (error) {
      console.error('Error in message cleanup job:', error);
    }
  });

  // Also support manual cleanup via API
  return job;
};

/**
 * Manually trigger message cleanup
 * Useful for testing or manual maintenance
 */
const manualCleanup = async (daysOld = 30) => {
  try {
    console.log(`Starting manual cleanup for messages older than ${daysOld} days...`);

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - daysOld);

    const result = await Message.deleteMany({
      createdAt: { $lt: dateThreshold },
    });

    console.log(
      `Manual cleanup completed. Deleted ${result.deletedCount} messages.`
    );

    return {
      success: true,
      deletedCount: result.deletedCount,
      threshold: dateThreshold,
    };
  } catch (error) {
    console.error('Error in manual cleanup:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Log cleanup events for auditing
 * Can be extended to save to database or external logging service
 */
const logCleanupEvent = (deletedCount, threshold) => {
  const cleanupLog = {
    timestamp: new Date().toISOString(),
    deletedCount,
    threshold,
    type: 'auto_cleanup',
  };

  // In production, consider saving to a dedicated CleanupLog collection
  // or sending to external logging service
  console.log('Cleanup event:', cleanupLog);
};

/**
 * Get cleanup statistics
 */
const getCleanupStats = async () => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const totalMessages = await Message.countDocuments();
    const messagesOlderThan30Days = await Message.countDocuments({
      createdAt: { $lt: thirtyDaysAgo },
    });

    return {
      totalMessages,
      messagesOlderThan30Days,
      percentageToDelete: (
        (messagesOlderThan30Days / totalMessages) *
        100
      ).toFixed(2),
      retentionDays: 30,
    };
  } catch (error) {
    console.error('Error getting cleanup stats:', error);
    return null;
  }
};

module.exports = {
  startMessageCleanupJob,
  manualCleanup,
  getCleanupStats,
  logCleanupEvent,
};
