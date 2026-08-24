const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Admin = require('../models/Admin');

/**
 * Verify JWT token (both user and admin tokens)
 * Sets req.user for user tokens or req.admin for admin tokens
 * Sets req.userType to 'user' or 'admin'
 */
exports.verifyAnyToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check token type
    if (decoded.type === 'admin') {
      // Admin token - look up in Admin collection
      const admin = await Admin.findById(decoded.id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Admin not found',
        });
      }

      req.admin = admin;
      req.userType = 'admin';
      req.user = { id: decoded.id }; // For backward compatibility
    } else {
      // Regular user token - look up in User collection
      const user = await User.findById(decoded.id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found',
        });
      }

      if (!user.isActive) {
        return res.status(403).json({
          success: false,
          message: 'Account is deactivated or deleted. Please contact support.',
        });
      }

      req.user = user;
      req.userType = 'user';
    }

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token has expired',
      });
    }

    res.status(401).json({
      success: false,
      message: 'Invalid token',
    });
  }
};
