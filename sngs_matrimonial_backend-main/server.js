const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../backend_env.txt') });
require('dotenv').config();
const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const connectDB = require('./src/config/database');
const { setupChatSockets } = require('./src/sockets/chat.socket');
const { startMessageCleanupJob } = require('./src/services/cleanup.service');

const PORT = process.env.PORT || 4000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Create HTTP server for Socket.io
    const server = http.createServer(app);

    // Initialize Socket.io with CORS configuration for frontend
    const io = new Server(server, {
      cors: {
        origin: FRONTEND_URL,
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    // Attach Socket.io to app for access in controllers
    app.io = io;

    // Setup chat Socket.io handlers
    setupChatSockets(io);

    // Start message cleanup job (30-day retention)
    startMessageCleanupJob();
    console.log('Message cleanup job started (runs daily at 2 AM)');

    // Start server
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT} in ${NODE_ENV} mode`);
      console.log(`Socket.io listening for connections from ${FRONTEND_URL}`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error('Unhandled Rejection:', err);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error('Uncaught Exception:', err);
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

module.exports = startServer;
