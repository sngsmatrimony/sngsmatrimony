const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Verify admin JWT token
 */
exports.verifyAdminToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied',
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if token type is admin
    if (decoded.type !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Invalid admin token',
      });
    }

    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: 'Admin not found',
      });
    }

    req.admin = admin;
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
