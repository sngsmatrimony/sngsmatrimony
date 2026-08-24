const express = require('express');
const cors = require('cors');
const compression = require('compression');
const morgan = require('morgan');
const { errorHandler } = require('./middleware/validation.middleware');

const app = express();

// Enable gzip/deflate compression for all responses (20-80% bandwidth savings)
app.use(compression({
  level: 6, // Balanced compression level (1-9, 6 is default)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress for clients that don't support it
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Middleware to capture raw body for webhook signature verification
app.use((req, res, next) => {
  if (req.path === '/api/membership/webhook') {
    // Capture raw body for webhook signature verification
    req.rawBody = '';
    req.on('data', (chunk) => {
      req.rawBody += chunk.toString('utf8');
    });
    req.on('end', () => {
      try {
        req.body = JSON.parse(req.rawBody);
      } catch (e) {
        req.body = {};
      }
      next();
    });
  } else {
    next();
  }
});

// Middleware
app.use(cors({
  origin: true, // Allow all origins in development
  credentials: true,
  exposedHeaders: ['Content-Disposition']
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// Root route
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to SNGS Matrimonial API',
    version: '1.0.0',
  });
});

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin-auth', require('./routes/adminAuth.routes'));
app.use('/api/membership', require('./routes/membership.routes'));
app.use('/api/settings', require('./routes/settings.routes'));
app.use('/api/profiles', require('./routes/profile.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
// app.use('/api/users', require('./routes/users.routes'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
