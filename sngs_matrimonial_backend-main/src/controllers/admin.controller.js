const mongoose = require('mongoose');
const User = require('../models/User');
const s3Service = require('../services/s3.service');

const ObjectId = mongoose.Types.ObjectId;

// Escape regex special characters to prevent ReDoS attacks
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Whitelist of allowed sort fields to prevent NoSQL injection
const ALLOWED_SORT_FIELDS = ['createdAt', 'fullName', 'email', 'isActive', 'approvalStatus', 'dateOfBirth'];

/**
 * GET /api/admin/users
 * Get all users with pagination, search, and filters
 */
exports.getAllUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      gender = '',
      maritalStatus = '',
      isActive,
      approvalStatus = '',
      education = '',
      occupation = '',
      state = '',
      city = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    // Validate sort field against whitelist
    const safeSortBy = ALLOWED_SORT_FIELDS.includes(sortBy) ? sortBy : 'createdAt';

    // Build match query
    let matchQuery = {};

    // Search implementation with escaped regex to prevent ReDoS
    if (search) {
      const safeSearch = escapeRegex(search);
      matchQuery.$or = [
        { fullName: { $regex: safeSearch, $options: 'i' } },
        { email: { $regex: safeSearch, $options: 'i' } },
        { mobileNumber: { $regex: safeSearch, $options: 'i' } },
      ];
    }

    // Filters
    if (gender) matchQuery.gender = gender;
    if (maritalStatus) matchQuery.maritalStatus = maritalStatus;
    if (isActive !== undefined) matchQuery.isActive = isActive === 'true';
    if (approvalStatus) {
      const normalizedStatus = approvalStatus.toLowerCase();
      if (normalizedStatus === 'pending') {
        // Match both explicit 'pending' and missing/undefined values
        matchQuery.$or = [
          { approvalStatus: 'pending' },
          { approvalStatus: { $exists: false } },
          { approvalStatus: null },
          { approvalStatus: '' }
        ];
      } else {
        matchQuery.approvalStatus = normalizedStatus;
      }
    }
    if (education) matchQuery.education = education;
    if (occupation) matchQuery.occupation = occupation;
    if (state) matchQuery.state = state;
    if (city) matchQuery.city = city;

    // Validate and constrain limit
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));

    // Execute query
    const users = await User.find(matchQuery)
      .select(
        'fullName email mobileNumber gender dateOfBirth maritalStatus education occupation city state createdAt profilePicture isActive role approvalStatus approvedAt rejectedAt'
      )
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .sort({ [safeSortBy]: sortOrder === 'asc' ? 1 : -1 })
      .lean(); // Return plain JS objects for faster read

    const total = await User.countDocuments(matchQuery);

    res.status(200).json({
      success: true,
      data: users,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum),
        hasNextPage: pageNum * limitNum < total,
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/:id
 * Get specific user details
 */
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Get like counts
    const likedCount = user.likedProfiles?.length || 0;
    const likedByCount = user.likedBy?.length || 0;

    res.status(200).json({
      success: true,
      data: {
        ...user.toJSON(),
        likedCount,
        likedByCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id
 * Update user profile (admin)
 */
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { ...updateData } = req.body;

    // Prevent updating password via admin endpoint
    delete updateData.password;

    const user = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/deactivate
 * Deactivate user (soft delete)
 */
exports.deactivateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/activate
 * Reactivate user
 */
exports.activateUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndUpdate(id, { isActive: true }, { new: true });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User activated successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== User Approval Management ====================

/**
 * PUT /api/admin/users/:id/approve
 * Approve a user registration
 */
exports.approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const adminId = req.admin._id;
    const adminEmail = req.admin.email;

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.approvalStatus === 'approved') {
      return res.status(400).json({
        success: false,
        message: 'User is already approved',
      });
    }

    // Update approval status
    user.approvalStatus = 'approved';
    user.approvedAt = new Date();
    user.rejectedAt = null;

    // Add to approval history
    user.approvalHistory.push({
      status: 'approved',
      reason: '',
      adminId,
      adminEmail,
      actionAt: new Date(),
    });

    await user.save();

    // Send approval email notification
    const emailService = require('../services/email.service');
    try {
      await emailService.sendApprovalEmail(user.email, user.fullName);
    } catch (emailError) {
      console.error('Error sending approval email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'User approved successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/users/:id/reject
 * Reject a user registration (requires reason)
 */
exports.rejectUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.admin._id;
    const adminEmail = req.admin.email;

    // Validate reason is provided
    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required',
      });
    }

    if (reason.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason must be at most 500 characters',
      });
    }

    const user = await User.findById(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update approval status
    user.approvalStatus = 'rejected';
    user.rejectedAt = new Date();
    user.approvedAt = null;

    // Add to approval history
    user.approvalHistory.push({
      status: 'rejected',
      reason: reason.trim(),
      adminId,
      adminEmail,
      actionAt: new Date(),
    });

    await user.save();

    // Send rejection email notification
    const emailService = require('../services/email.service');
    try {
      await emailService.sendRejectionEmail(user.email, user.fullName, reason);
    } catch (emailError) {
      console.error('Error sending rejection email:', emailError);
      // Don't fail the request if email fails
    }

    res.status(200).json({
      success: true,
      message: 'User rejected successfully',
      data: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/users/pending-count
 * Get count of pending approvals for dashboard widget
 */
exports.getPendingApprovalCount = async (req, res, next) => {
  try {
    const count = await User.countDocuments({ approvalStatus: 'pending' });

    res.status(200).json({
      success: true,
      data: { pendingCount: count },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id
 * Permanently delete user (hard delete)
 */
exports.deleteUser = async (req, res, next) => {
  try {
    const userId = req.params.id;

    // Prevent self-deletion
    if (userId === req.admin.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete your own account',
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Last admin protection
    if (user.role === 'admin') {
      const adminCount = await User.countDocuments({ role: 'admin', isActive: true });
      if (adminCount <= 1) {
        return res.status(403).json({
          success: false,
          message: 'Cannot delete the last admin account',
        });
      }
    }

    // 1. Remove user from all likedProfiles arrays
    await User.updateMany(
      { likedProfiles: userId },
      { $pull: { likedProfiles: userId } }
    );

    // 2. Remove user from all likedBy arrays
    await User.updateMany(
      { likedBy: userId },
      { $pull: { likedBy: userId } }
    );

    // 3. Delete S3 files (profile picture + gallery)
    if (user?.profilePicture?.url) {
      try {
        const key = s3Service.extractKeyFromUrl(user.profilePicture.url);
        if (key) {
          await s3Service.deleteFile(key);
        }
      } catch (err) {
        console.error('Error deleting profile picture from S3:', err);
      }
    }

    if (user?.gallery?.photos) {
      for (const photo of user.gallery.photos) {
        try {
          const key = s3Service.extractKeyFromUrl(photo.url);
          if (key) {
            await s3Service.deleteFile(key);
          }
        } catch (err) {
          console.error('Error deleting gallery photo from S3:', err);
        }
      }
    }

    // 4. Finally delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/analytics/overview
 * Get dashboard analytics
 */
exports.getDashboardAnalytics = async (req, res, next) => {
  try {
    // MongoDB aggregation with $facet
    const [stats] = await User.aggregate([
      {
        $facet: {
          totalCounts: [
            {
              $group: {
                _id: null,
                total: { $sum: 1 },
                active: {
                  $sum: { $cond: [{ $eq: ['$isActive', true] }, 1, 0] },
                },
                inactive: {
                  $sum: { $cond: [{ $eq: ['$isActive', false] }, 1, 0] },
                },
                withPhoto: {
                  $sum: {
                    $cond: [{ $ne: ['$profilePicture.url', null] }, 1, 0],
                  },
                },
              },
            },
          ],
          genderBreakdown: [
            { $match: { gender: { $ne: '' } } },
            { $group: { _id: '$gender', count: { $sum: 1 } } },
          ],
          maritalStatusBreakdown: [
            { $match: { maritalStatus: { $ne: '' } } },
            { $group: { _id: '$maritalStatus', count: { $sum: 1 } } },
          ],
          topCities: [
            { $match: { city: { $ne: '' } } },
            { $group: { _id: '$city', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
          topStates: [
            { $match: { state: { $ne: '' } } },
            { $group: { _id: '$state', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
        },
      },
    ]);

    // Date-based new users
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    const newUsersThisWeek = await User.countDocuments({
      createdAt: { $gte: weekAgo },
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: monthAgo },
    });

    // Pending approvals count
    const pendingApprovals = await User.countDocuments({ approvalStatus: 'pending' });

    // Average age (CRITICAL: Cannot use virtual 'age' field in aggregation)
    const avgAgeResult = await User.aggregate([
      {
        $addFields: {
          calculatedAge: {
            $floor: {
              $divide: [
                { $subtract: [new Date(), '$dateOfBirth'] },
                1000 * 60 * 60 * 24 * 365.25,
              ],
            },
          },
        },
      },
      {
        $group: {
          _id: null,
          averageAge: { $avg: '$calculatedAge' },
        },
      },
    ]);

    // User growth chart (last 30 days) - using UTC for consistency with MongoDB timestamps
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date();
      date.setUTCDate(date.getUTCDate() - i);
      date.setUTCHours(0, 0, 0, 0);
      return date;
    }).reverse();

    const growthData = await User.aggregate([
      { $match: { createdAt: { $gte: last30Days[0] } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill missing dates with 0
    const growthMap = new Map(growthData.map(d => [d._id, d.count]));
    const chartData = last30Days.map(date => ({
      date: date.toISOString().split('T')[0],
      users: growthMap.get(date.toISOString().split('T')[0]) || 0,
    }));

    res.status(200).json({
      success: true,
      data: {
        counts: stats.totalCounts[0] || {},
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        pendingApprovals,
        averageAge: avgAgeResult[0]?.averageAge || 0,
        genderBreakdown: stats.genderBreakdown || [],
        maritalStatusBreakdown: stats.maritalStatusBreakdown || [],
        topCities: stats.topCities || [],
        topStates: stats.topStates || [],
        growthChart: chartData,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/admin/analytics/demographics
 * Get user demographics
 */
exports.getDemographics = async (req, res, next) => {
  try {
    const demographics = await User.aggregate([
      {
        $facet: {
          ageDistribution: [
            {
              $addFields: {
                calculatedAge: {
                  $floor: {
                    $divide: [
                      { $subtract: [new Date(), '$dateOfBirth'] },
                      1000 * 60 * 60 * 24 * 365.25,
                    ],
                  },
                },
              },
            },
            {
              $bucket: {
                groupBy: '$calculatedAge',
                boundaries: [18, 26, 31, 36, 41, 51, 100],
                default: 'Unknown',
                output: { count: { $sum: 1 } },
              },
            },
          ],
          educationBreakdown: [
            { $match: { education: { $ne: '' } } },
            { $group: { _id: '$education', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          occupationBreakdown: [
            { $match: { occupation: { $ne: '' } } },
            { $group: { _id: '$occupation', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
          ],
          incomeDistribution: [
            {
              $bucket: {
                groupBy: '$annualIncome.min',
                boundaries: [0, 300000, 500000, 1000000, 2000000, 5000000, 10000000, Infinity],
                default: 'Unknown',
                output: { count: { $sum: 1 } },
              },
            },
          ],
          stateDistribution: [
            { $match: { state: { $ne: '' } } },
            { $group: { _id: '$state', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
          ],
          motherTongueDistribution: [
            { $match: { motherTongue: { $ne: '' } } },
            { $group: { _id: '$motherTongue', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 5 },
          ],
          complexionDistribution: [
            { $match: { complexion: { $ne: '' } } },
            { $group: { _id: '$complexion', count: { $sum: 1 } } },
          ],
          heightDistribution: [
            { $match: { height: { $ne: '' } } },
            { $group: { _id: '$height', count: { $sum: 1 } } },
            { $sort: { _id: 1 } },
          ],
          employmentTypeBreakdown: [
            { $match: { employmentType: { $ne: '' } } },
            { $group: { _id: '$employmentType', count: { $sum: 1 } } },
          ],
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: demographics[0] || {},
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/settings/contact-info
 * Update contact information (admin only)
 */
exports.updateContactInfo = async (req, res, next) => {
  const settingsController = require('./settings.controller');
  return settingsController.updateContactInfo(req, res, next);
};

/**
 * GET /api/admin/admins
 * Get all admins
 */
exports.getAllAdmins = async (req, res, next) => {
  try {
    const Admin = require('../models/Admin');

    const admins = await Admin.find()
      .select('email createdAt lastLogin')
      .sort({ createdAt: -1 })
      .lean(); // Return plain JS objects for faster read

    const total = await Admin.countDocuments();

    res.status(200).json({
      success: true,
      data: admins,
      total,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/admins
 * Create new admin
 */
exports.createAdmin = async (req, res, next) => {
  try {
    const Admin = require('../models/Admin');
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // Email format validation
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
      });
    }

    // Password length validation
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters',
      });
    }

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ email: email.toLowerCase() });
    if (existingAdmin) {
      return res.status(409).json({
        success: false,
        message: 'Admin with this email already exists',
      });
    }

    // Create new admin
    const admin = await Admin.create({
      email: email.toLowerCase(),
      password,
    });

    res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: admin.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Membership Plan Management ====================

const MembershipPlan = require('../models/MembershipPlan');
const Transaction = require('../models/Transaction');

/**
 * GET /api/admin/membership-plans
 * Get all membership plans
 */
exports.getAllMembershipPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find()
      .sort({ createdAt: -1 })
      .lean(); // Return plain JS objects for faster read

    res.status(200).json({
      success: true,
      count: plans.length,
      data: plans,
    });
  } catch (error) {
    console.error('Error fetching membership plans:', error);
    res.status(500).json({ message: 'Error fetching membership plans' });
  }
};

/**
 * POST /api/admin/membership-plans
 * Create new membership plan
 */
exports.createMembershipPlan = async (req, res) => {
  try {
    const { name, description, credits, price, validityDays, isDefault } = req.body;

    // Validate required fields (validityDays can be null for unlimited)
    if (!name || !credits || !price?.amount || validityDays === undefined) {
      return res.status(400).json({
        message: 'Name, credits, and price are required. Validity days must be set (or null for unlimited)',
      });
    }

    // Validate validityDays if not null
    if (validityDays !== null && validityDays < 1) {
      return res.status(400).json({
        message: 'Validity days must be null (unlimited) or at least 1',
      });
    }

    const plan = await MembershipPlan.create({
      name,
      description,
      credits,
      price: {
        amount: price.amount,
        currency: price.currency || 'INR',
      },
      validityDays: validityDays === null ? null : Number(validityDays),
      isDefault: isDefault || false,
    });

    res.status(201).json({
      success: true,
      message: 'Membership plan created successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Error creating membership plan:', error);
    res.status(500).json({ message: 'Error creating membership plan' });
  }
};

/**
 * PUT /api/admin/membership-plans/:id
 * Update membership plan
 */
exports.updateMembershipPlan = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const plan = await MembershipPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Membership plan not found' });
    }

    // Update allowed fields
    const allowedFields = ['name', 'description', 'credits', 'price', 'validityDays', 'isActive', 'isDefault'];
    allowedFields.forEach((field) => {
      if (updates[field] !== undefined) {
        plan[field] = updates[field];
      }
    });

    await plan.save();

    res.status(200).json({
      success: true,
      message: 'Membership plan updated successfully',
      data: plan,
    });
  } catch (error) {
    console.error('Error updating membership plan:', error);
    res.status(500).json({ message: 'Error updating membership plan' });
  }
};

/**
 * DELETE /api/admin/membership-plans/:id
 * Delete membership plan
 */
exports.deleteMembershipPlan = async (req, res) => {
  try {
    const { id } = req.params;

    const plan = await MembershipPlan.findById(id);
    if (!plan) {
      return res.status(404).json({ message: 'Membership plan not found' });
    }

    // Check if any transactions exist for this plan
    const transactionCount = await Transaction.countDocuments({ planId: id });
    if (transactionCount > 0) {
      return res.status(400).json({
        message: 'Cannot delete plan with existing transactions. Deactivate instead.',
      });
    }

    await MembershipPlan.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Membership plan deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting membership plan:', error);
    res.status(500).json({ message: 'Error deleting membership plan' });
  }
};

/**
 * GET /api/admin/transactions
 * Get all transactions with filters
 */
exports.getAllTransactions = async (req, res) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.userId = userId;

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .populate('userId', 'fullName email mobileNumber')
      .populate('planId', 'name credits validityDays')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(); // Return plain JS objects for faster read

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      count: transactions.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions,
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ message: 'Error fetching transactions' });
  }
};

// ==================== How It Works Content Management ====================

const HowItWorksContent = require('../models/HowItWorksContent');
const HeroContent = require('../models/HeroContent');

/**
 * GET /api/admin/how-it-works
 * Get How It Works section content
 */
exports.getHowItWorksContent = async (req, res, next) => {
  try {
    let content = await HowItWorksContent.findOne({ key: 'HOW_IT_WORKS' }).lean();

    // If no content exists, create default content
    if (!content) {
      content = await HowItWorksContent.create({ key: 'HOW_IT_WORKS' });
      content = content.toObject();
    }

    // Add cache-control headers to prevent stale data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/how-it-works
 * Update How It Works section content
 */
exports.updateHowItWorksContent = async (req, res, next) => {
  try {
    const { sectionTitle, sectionSubtitle, steps } = req.body;

    // DEBUG: Log incoming data
    console.log('=== How It Works Update Request ===');
    console.log('Received data:', JSON.stringify(req.body, null, 2));

    // Validation
    if (!sectionTitle || !sectionSubtitle || !steps) {
      return res.status(400).json({
        success: false,
        message: 'Section title, subtitle, and steps are required',
      });
    }

    if (!Array.isArray(steps) || steps.length !== 3) {
      return res.status(400).json({
        success: false,
        message: 'Exactly 3 steps are required',
      });
    }

    // Validate each step
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i].title || !steps[i].description) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1} must have both title and description`,
        });
      }
      if (steps[i].title.length > 100) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1} title must be at most 100 characters`,
        });
      }
      if (steps[i].description.length > 500) {
        return res.status(400).json({
          success: false,
          message: `Step ${i + 1} description must be at most 500 characters`,
        });
      }
    }

    // Find and update or create
    const content = await HowItWorksContent.findOneAndUpdate(
      { key: 'HOW_IT_WORKS' },
      {
        sectionTitle,
        sectionSubtitle,
        steps,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    // DEBUG: Log saved data
    console.log('Saved content:', JSON.stringify(content, null, 2));

    res.status(200).json({
      success: true,
      message: 'How It Works content updated successfully',
      data: content,
    });
  } catch (error) {
    console.error('How It Works Update error:', error);
    next(error);
  }
};

// ==================== Admin Media Upload Handlers ====================

/**
 * POST /api/admin/users/:id/upload-profile-picture
 * Upload profile picture for a specific user (admin)
 */
exports.uploadUserProfilePicture = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    if (!req.file.location) {
      return res.status(500).json({
        success: false,
        message: 'File upload to S3 failed. Please check S3 configuration.',
      });
    }

    const photoUrl = req.file.location;

    // Delete old profile picture from S3 if it exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (existingUser.profilePicture?.url) {
      const oldKey = s3Service.extractKeyFromUrl(existingUser.profilePicture.url);
      if (oldKey) {
        await s3Service.deleteFile(oldKey);
      }
    }

    // Use native MongoDB updateOne with explicit write concern
    const updateResult = await User.collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          profilePicture: {
            url: photoUrl,
            uploadedAt: new Date(),
          },
        },
      },
      { writeConcern: { w: 'majority', j: true } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Database update failed - no document modified',
      });
    }

    // VERIFY: Use native MongoDB find to bypass Mongoose cache
    const verifyDoc = await User.collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { profilePicture: 1 } }
    );

    if (!verifyDoc?.profilePicture?.url) {
      return res.status(500).json({
        success: false,
        message: 'Database update failed - changes did not persist',
      });
    }

    // Fetch full user for response
    const updatedUser = await User.findById(id);

    res.status(200).json({
      success: true,
      message: 'Profile picture uploaded successfully',
      profilePictureUrl: photoUrl,
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

/**
 * POST /api/admin/users/:id/upload-photo
 * Upload gallery photo for a specific user (admin)
 */
exports.uploadUserPhoto = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    if (!req.file.location) {
      return res.status(500).json({
        success: false,
        message: 'File upload to S3 failed. Please check S3 configuration.',
      });
    }

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check photo limit
    const currentPhotos = existingUser.gallery?.photos || [];

    if (currentPhotos.length >= 10) {
      return res.status(400).json({
        success: false,
        message: 'Maximum 10 photos allowed',
      });
    }

    const photoUrl = req.file.location;

    // Use native MongoDB updateOne with explicit write concern
    const updateResult = await User.collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $push: {
          'gallery.photos': {
            url: photoUrl,
            uploadedAt: new Date(),
          },
        },
      },
      { writeConcern: { w: 'majority', j: true } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Database update failed - no document modified',
      });
    }

    // VERIFY: Use native MongoDB find to bypass Mongoose cache
    const verifyDoc = await User.collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { 'gallery.photos': 1 } }
    );

    const verifyPhotos = verifyDoc?.gallery?.photos || [];
    if (!verifyPhotos.some(p => p.url === photoUrl)) {
      return res.status(500).json({
        success: false,
        message: 'Database update failed - changes did not persist',
      });
    }

    // Fetch full user for response
    const updatedUser = await User.findById(id);

    res.status(200).json({
      success: true,
      message: 'Photo uploaded successfully',
      photoUrl: photoUrl,
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id/photos/:photoIndex
 * Delete gallery photo for a specific user (admin)
 */
exports.deleteUserPhoto = async (req, res, next) => {
  try {
    const { id, photoIndex } = req.params;
    const index = parseInt(photoIndex, 10);

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!existingUser.gallery?.photos || index < 0 || index >= existingUser.gallery.photos.length) {
      return res.status(400).json({
        success: false,
        message: 'Invalid photo index',
      });
    }

    const photo = existingUser.gallery.photos[index];

    // Delete from S3
    const key = s3Service.extractKeyFromUrl(photo.url);
    if (key) {
      await s3Service.deleteFile(key);
    }

    // Create new array without the deleted photo
    const updatedPhotos = existingUser.gallery.photos.filter((_, i) => i !== index);

    // Use findByIdAndUpdate for atomic update
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { 'gallery.photos': updatedPhotos },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Photo deleted successfully',
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/admin/users/:id/upload-horoscope
 * Upload horoscope document for a specific user (admin)
 */
exports.uploadUserHoroscope = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided',
      });
    }

    if (!req.file.location) {
      return res.status(500).json({
        success: false,
        message: 'File upload to S3 failed. Please check S3 configuration.',
      });
    }

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Delete old horoscope document from S3 if exists
    if (existingUser.horoscopeDocument?.url) {
      const oldKey = s3Service.extractKeyFromUrl(existingUser.horoscopeDocument.url);
      if (oldKey) {
        await s3Service.deleteFile(oldKey);
      }
    }

    // Determine file type
    const fileType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';

    // Use native MongoDB updateOne with explicit write concern
    const updateResult = await User.collection.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          horoscopeDocument: {
            url: req.file.location,
            fileType: fileType,
            uploadedAt: new Date(),
          },
        },
      },
      { writeConcern: { w: 'majority', j: true } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(500).json({
        success: false,
        message: 'Database update failed - no document modified',
      });
    }

    // VERIFY: Use native MongoDB find to bypass Mongoose cache
    const verifyDoc = await User.collection.findOne(
      { _id: new ObjectId(id) },
      { projection: { horoscopeDocument: 1 } }
    );

    if (!verifyDoc?.horoscopeDocument?.url) {
      return res.status(500).json({
        success: false,
        message: 'Database update failed - changes did not persist',
      });
    }

    // Fetch full user for response
    const updatedUser = await User.findById(id);

    res.status(200).json({
      success: true,
      message: 'Horoscope document uploaded successfully',
      horoscopeDocument: updatedUser.horoscopeDocument,
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    console.error('Upload error:', error);
    next(error);
  }
};

/**
 * DELETE /api/admin/users/:id/horoscope
 * Delete horoscope document for a specific user (admin)
 */
exports.deleteUserHoroscope = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingUser = await User.findById(id);

    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (!existingUser.horoscopeDocument?.url) {
      return res.status(400).json({
        success: false,
        message: 'No horoscope document to delete',
      });
    }

    // Delete from S3
    const key = s3Service.extractKeyFromUrl(existingUser.horoscopeDocument.url);
    if (key) {
      await s3Service.deleteFile(key);
    }

    // Use findByIdAndUpdate for atomic update
    const updatedUser = await User.findByIdAndUpdate(
      id,
      { $unset: { horoscopeDocument: 1 } },
      { new: true, runValidators: false }
    );

    res.status(200).json({
      success: true,
      message: 'Horoscope document deleted successfully',
      data: updatedUser.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

// ==================== Hero Content Management ====================

/**
 * GET /api/admin/hero-content
 * Get Hero section content
 */
exports.getHeroContent = async (req, res, next) => {
  try {
    let content = await HeroContent.findOne({ key: 'HERO_CONTENT' }).lean();

    // If no content exists, create default content
    if (!content) {
      content = await HeroContent.create({ key: 'HERO_CONTENT' });
      content = content.toObject();
    }

    // Add cache-control headers to prevent stale data
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');

    res.status(200).json({
      success: true,
      data: content,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PUT /api/admin/hero-content
 * Update Hero section content
 */
exports.updateHeroContent = async (req, res, next) => {
  try {
    const { badge, title, subtitle } = req.body;

    // Validation
    if (!badge || !title || !subtitle) {
      return res.status(400).json({
        success: false,
        message: 'Badge, title, and subtitle are required',
      });
    }

    if (badge.length > 50) {
      return res.status(400).json({
        success: false,
        message: 'Badge must be at most 50 characters',
      });
    }

    if (title.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Title must be at most 100 characters',
      });
    }

    if (subtitle.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Subtitle must be at most 500 characters',
      });
    }

    // Find and update or create
    const content = await HeroContent.findOneAndUpdate(
      { key: 'HERO_CONTENT' },
      {
        badge,
        title,
        subtitle,
      },
      {
        new: true,
        upsert: true,
        runValidators: true,
      }
    );

    res.status(200).json({
      success: true,
      message: 'Hero content updated successfully',
      data: content,
    });
  } catch (error) {
    next(error);
  }
};
