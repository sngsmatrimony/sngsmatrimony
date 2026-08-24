const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  // Basic Information
  fullName: {
    type: String,
    required: [true, 'Please provide a full name'],
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
      'Please provide a valid email',
    ],
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false, // Don't return password by default
  },

  // Contact Information
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    validate: {
      validator: function(v) {
        return /^[6-9]\d{9}$/.test(v); // Indian mobile number format
      },
      message: 'Please enter a valid 10-digit mobile number'
    },
    unique: true,
  },
  alternateMobileNumber: {
    type: String,
    validate: {
      validator: function(v) {
        if (!v) return true; // Optional field
        return /^[6-9]\d{9}$/.test(v);
      },
      message: 'Please enter a valid 10-digit alternate mobile number'
    }
  },

  // Mobile Verification Status (legacy - no longer used for registration)
  mobileVerified: {
    type: Boolean,
    default: false,
  },
  mobileVerifiedAt: {
    type: Date,
  },

  // Email Verification Status (primary verification method)
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerifiedAt: {
    type: Date,
  },

  // Profile Information
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Please select your gender'],
  },
  seekingGender: {
    type: String,
    enum: ['male', 'female'],
    required: [true, 'Please select who you are seeking'],
  },

  // Personal Details
  dateOfBirth: {
    type: Date,
    required: [true, 'Please provide your date of birth'],
  },
  timeOfBirth: {
    type: String,
    default: null, // Format: HH:mm (24-hour format, e.g., "07:30")
  },
  motherTongue: {
    type: String,
    required: [true, 'Please select your mother tongue'],
    trim: true,
  },
  languagesKnown: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.length <= 10; // Max 10 languages
      },
      message: 'Maximum 10 languages allowed'
    }
  },
  placeOfBirth: {
    type: String,
    trim: true,
    maxlength: [100, 'Place of birth must be at most 100 characters']
  },
  complexion: {
    type: String,
    enum: ['Very Fair', 'Fair', 'Wheatish', 'Wheatish Brown', 'Dark', 'Very Dark', ''],
    default: ''
  },
  height: {
    type: String,
    required: [true, 'Please select your height'],
  },
  physicalStatus: {
    type: String,
    required: [true, 'Please select your physical status'],
    enum: ['Normal', 'Physically Challenged'],
    default: 'Normal',
  },
  maritalStatus: {
    type: String,
    required: [true, 'Please select your marital status'],
    enum: ['Never Married', 'Widowed', 'Awaiting Divorce', 'Divorced'],
  },
  religion: {
    type: String,
    required: [true, 'Please select your religion'],
    enum: [
      'Hindu',
      'Muslim - Shia',
      'Muslim - Sunni',
      'Muslim - Others',
      'Christian',
      'Sikh',
      'Jain - Digambar',
      'Jain - Swetambar',
      'Jain - Others',
      'Parsi',
      'Buddhist',
      'Jewish',
      'Inter-Religion',
    ],
    trim: true,
  },
  caste: {
    type: String,
    trim: true,
    default: '',
  },
  shuddhaJathakam: {
    type: String,
    enum: ['Yes', 'No', "Don't Know", ''],
    default: '',
  },
  doshamTypes: {
    type: [String],
    enum: [
      'Chovva Dosham',
      'Sarpa Dosham',
      'Kaala Sarpa Dosham',
      'Rahu Dosham',
      'Ketu Dosham',
      'Kaalatra Dosham',
    ],
    default: [],
  },
  nakshatra: {
    type: String,
    required: [true, 'Please select your nakshatra'],
    enum: [
      'Aswathi',
      'Bharani',
      'Karthika',
      'Rohini',
      'Makayiram',
      'Thiruvathira',
      'Punartham',
      'Pooyam',
      'Ayilyam',
      'Makam',
      'Pooram',
      'Uthram',
      'Atham',
      'Chithira',
      'Chothy',
      'Vishakham',
      'Anizham',
      'Thrikketta',
      'Moolam',
      'Pooradam',
      'Uthradam',
      'Thiruvonam',
      'Avittam',
      'Chathayam',
      'Pooruruttathi',
      'Uthrattathi',
      'Revathi',
    ],
  },
  raasi: {
    type: String,
    enum: [
      'Mesham',
      'Vrushabham',
      'Mithunam',
      'Karkatakam',
      'Simham',
      'Kanni',
      'Tulam',
      'Vrishchikam',
      'Dhanus',
      'Makaram',
      'Kumbam',
      'Meenam',
    ],
    default: null,
  },

  // Location Details
  country: {
    type: String,
    required: [true, 'Please select your country'],
    trim: true,
  },
  state: {
    type: String,
    trim: true,
    default: '',
  },
  city: {
    type: String,
    trim: true,
    default: '',
  },

  // Address Details (Optional)
  presentResidentialAddress: {
    country: {
      type: String,
      trim: true,
      default: '',
    },
    street: {
      type: String,
      trim: true,
      default: '',
    },
    area: {
      type: String,
      trim: true,
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
  },
  nativePlaceAddress: {
    country: {
      type: String,
      trim: true,
      default: '',
    },
    street: {
      type: String,
      trim: true,
      default: '',
    },
    area: {
      type: String,
      trim: true,
      default: '',
    },
    landmark: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
  },

  // Personal & Family Details (Optional)
  weight: {
    type: Number,
    min: [30, 'Weight must be at least 30 kg'],
    max: [200, 'Weight must be at most 200 kg'],
    default: null,
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-', "Don't Know", ''],
    default: '',
  },
  diet: {
    type: String,
    enum: ['Vegetarian', 'Non-Vegetarian', 'Eggetarian', ''],
    default: ''
  },
  fatherName: {
    type: String,
    required: [true, "Father's name is required"],
    trim: true,
    maxlength: [100, 'Father name must be at most 100 characters'],
  },
  fatherOccupation: {
    type: String,
    required: false,
    trim: true,
  },
  motherName: {
    type: String,
    required: [true, "Mother's name is required"],
    trim: true,
    maxlength: [100, 'Mother name must be at most 100 characters'],
  },
  motherOccupation: {
    type: String,
    required: false,
    trim: true,
  },
  residentialStatus: {
    type: String,
    enum: ['Owned', 'Rented', 'Sub-tenant', ''],
    default: '',
  },

  // Professional Details
  education: {
    type: String,
    required: [true, 'Please select your education'],
  },
  employmentType: {
    type: String,
    required: [true, 'Please select your employment type'],
    enum: [
      'Salaried - Private',
      'Salaried - Government',
      'Self Employed',
      'Business',
      'Defense',
      'Not Working',
    ],
  },
  occupation: {
    type: String,
    required: [true, 'Please select your occupation'],
  },
  annualIncome: {
    currency: {
      type: String,
      required: [true, 'Please select currency'],
      enum: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD', 'SGD', 'AED', 'Others'],
      default: 'INR',
    },
    min: {
      type: Number,
      required: [true, 'Please specify minimum annual income'],
    },
    max: {
      type: Number,
      required: [true, 'Please specify maximum annual income'],
    },
    displayText: {
      type: String,
      default: '',
    },
  },
  professionalAdditionalInfo: {
    type: String,
    trim: true,
    maxlength: [500, 'Professional additional info must be at most 500 characters']
  },

  // Family Details
  familyStatus: {
    type: String,
    required: [true, 'Please select your family status'],
    enum: ['Middle Class', 'Upper Middle Class', 'Rich / Affluent'],
  },

  // Preference Information
  ageFrom: {
    type: Number,
    default: 18,
    min: 18,
    max: 90,
  },
  ageTo: {
    type: Number,
    default: 90,
    min: 18,
    max: 90,
  },

  // About Section (Required - consolidated from about and aboutMyself)
  profileAbout: {
    type: String,
    default: '',
  },
  interests: {
    type: [String],
    default: [],
    enum: [
      'Painting',
      'Coding',
      'Poetry',
      'Reading',
      'Writing',
      'Photography',
      'Music',
      'Dancing',
      'Cooking',
      'Traveling',
      'Gardening',
      'Sports',
      'Fitness',
      'Yoga',
      'Meditation',
      'Gaming',
      'Movies',
      'Theater',
      'Volunteering',
      'Fashion',
    ],
  },
  // Profile Picture (Mandatory)
  profilePicture: {
    url: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },

  // Horoscope Document (Optional)
  horoscopeDocument: {
    url: String,
    fileType: {
      type: String,
      enum: ['pdf', 'image'],
    },
    uploadedAt: {
      type: Date,
      default: Date.now,
    },
  },

  // Profile Banner (Color Only)
  profileBanner: {
    bannerType: {
      type: String,
      enum: ['color'],
      default: 'color',
    },
    bannerColor: {
      type: String,
      enum: [
        '#FFB3BA', // Pastel Rose
        '#FFFFBA', // Pastel Vanilla
        '#BAE1FF', // Pastel Sky
        '#BAFFC9', // Pastel Mint
        '#E0BBE4', // Pastel Lilac
        '#FFDFD3', // Pastel Coral
        '#D4F1F4', // Pastel Cyan
        '#F8B4D8', // Pastel Mauve
        '#C7CEEA', // Pastel Periwinkle
        '#FFEAA7', // Pastel Butter
      ],
      default: '#FFB3BA',
    },
  },

  // Media Gallery
  gallery: {
    photos: {
      type: [
        {
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      default: [],
      validate: [
        function (val) {
          return val.length <= 10;
        },
        'Maximum 10 photos allowed',
      ],
    },
  },

  // Likes & Interactions
  likedProfiles: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },
  likedBy: {
    type: [mongoose.Schema.Types.ObjectId],
    ref: 'User',
    default: [],
  },

  // Account Status
  isActive: {
    type: Boolean,
    default: true,
    required: true,
  },
  deletedAt: {
    type: Date,
    default: null,
  },

  // Admin Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  approvalHistory: [{
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      required: true,
    },
    reason: {
      type: String,
      maxlength: [500, 'Reason must be at most 500 characters'],
      default: '',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
    },
    adminEmail: {
      type: String,
    },
    actionAt: {
      type: Date,
      default: Date.now,
    },
  }],
  approvedAt: {
    type: Date,
    default: null,
  },
  rejectedAt: {
    type: Date,
    default: null,
  },

  // Password Reset Fields
  passwordResetOTP: {
    type: String,
    select: false, // Don't include in normal queries
  },
  passwordResetOTPExpiry: {
    type: Date,
    select: false,
  },
  passwordResetAttempts: {
    type: Number,
    default: 0,
  },
  passwordResetLastAttempt: {
    type: Date,
  },

  // Membership & Credits (NEW FIELDS)
  membership: {
    isActive: {
      type: Boolean,
      default: false,
    },
    credits: {
      type: Number,
      default: 0,
      min: 0,
    },
    expiryDate: {
      type: Date,
      default: null,
    },
    purchasedAt: {
      type: Date,
      default: null,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MembershipPlan',
      default: null,
    },
  },

  // View tracking (prevents duplicate credit deduction)
  viewedProfiles: {
    type: [
      {
        profileId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        viewedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    default: [],
  },

  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field to calculate age from dateOfBirth
userSchema.virtual('age').get(function () {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  let age = today.getFullYear() - this.dateOfBirth.getFullYear();
  const monthDiff = today.getMonth() - this.dateOfBirth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < this.dateOfBirth.getDate())) {
    age--;
  }
  return age;
});

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    this.updatedAt = Date.now();
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function () {
  const token = jwt.sign(
    { id: this._id, email: this.email },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRE || '7d',
    }
  );
  return token;
};

// Get user public data (for responses)
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

// Add indexes for search and filtering
userSchema.index({ country: 1, state: 1, city: 1 });
userSchema.index({ religion: 1, caste: 1 });
userSchema.index({ education: 1, occupation: 1 });
userSchema.index({ motherTongue: 1 });
userSchema.index({ 'annualIncome.currency': 1, 'annualIncome.min': 1, 'annualIncome.max': 1 });
userSchema.index({ bloodGroup: 1 });
// Note: mobileNumber already has index from unique: true
userSchema.index({ complexion: 1 });
userSchema.index({ diet: 1 });

// Admin portal indexes (CRITICAL for admin queries)
userSchema.index({ fullName: 1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ isActive: 1 });
userSchema.index({ role: 1 });
userSchema.index({ gender: 1, maritalStatus: 1 });
userSchema.index({ 'annualIncome.min': 1, 'annualIncome.max': 1 });
userSchema.index({ isActive: 1, createdAt: -1 });

// Membership indexes (CRITICAL for credit and membership queries)
userSchema.index({ 'membership.isActive': 1, 'membership.expiryDate': 1 });
userSchema.index({ 'viewedProfiles.profileId': 1 });
userSchema.index({ approvalStatus: 1, createdAt: -1 });

const User = mongoose.model('User', userSchema);

module.exports = User;
