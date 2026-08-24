const Settings = require('../models/Settings');

/**
 * GET /api/settings/contact-info
 * Public endpoint - get contact information for display in headers
 */
exports.getContactInfo = async (req, res, next) => {
  try {
    let settings = await Settings.findOne({ key: 'CONTACT_INFO' });

    // Return defaults if not configured yet
    if (!settings) {
      return res.status(200).json({
        success: true,
        data: {
          contactEmail: 'info@sngsmatrimonial.com',
          contactMobile: '9876543210',
        },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        contactEmail: settings.contactEmail,
        contactMobile: settings.contactMobile,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/settings/contact-info
 * Admin endpoint - update contact information
 */
exports.updateContactInfo = async (req, res, next) => {
  try {
    const { contactEmail, contactMobile } = req.body;

    // Validate inputs
    if (!contactEmail || !contactMobile) {
      return res.status(400).json({
        success: false,
        message: 'Contact email and mobile are required',
      });
    }

    const settings = await Settings.findOneAndUpdate(
      { key: 'CONTACT_INFO' },
      {
        key: 'CONTACT_INFO',
        contactEmail,
        contactMobile,
      },
      {
        new: true,
        upsert: true, // Create if doesn't exist
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Contact information updated successfully',
      data: {
        contactEmail: settings.contactEmail,
        contactMobile: settings.contactMobile,
      },
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((e) => e.message)
          .join(', '),
      });
    }
    next(error);
  }
};
