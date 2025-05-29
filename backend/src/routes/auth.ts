import express from 'express';
import Joi from 'joi';
import { User } from '../models/User';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  height: Joi.number().min(50).max(300).optional(),
  weight: Joi.number().min(20).max(500).optional(),
  weightGoal: Joi.number().min(50).max(1000).optional(),
  weightGoalTimeframe: Joi.number().min(1).max(52).optional(),
  activityLevel: Joi.string().valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active').optional(),
  healthGoals: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  dietaryRestrictions: Joi.array().items(Joi.string()).optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  dateOfBirth: Joi.date().optional(),
  gender: Joi.string().valid('male', 'female', 'other').optional(),
  height: Joi.number().min(50).max(300).optional(),
  weight: Joi.number().min(20).max(500).optional(),
  weightGoal: Joi.number().min(50).max(1000).optional(),
  weightGoalTimeframe: Joi.number().min(1).max(52).optional(),
  activityLevel: Joi.string().valid('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extra_active').optional(),
  healthGoals: Joi.array().items(Joi.string()).optional(),
  allergies: Joi.array().items(Joi.string()).optional(),
  dietaryRestrictions: Joi.array().items(Joi.string()).optional()
});

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { email } = value;

  // Check if user exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw createError('User already exists with this email', 400);
  }

  // Create user
  const user = await User.create(value);

  // Generate token
  const token = user.getSignedJwtToken();

  res.status(201).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      weightGoal: user.weightGoal,
      weightGoalTimeframe: user.weightGoalTimeframe,
      activityLevel: user.activityLevel,
      healthGoals: user.healthGoals,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      createdAt: user.createdAt
    }
  });
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { email, password } = value;

  // Check for user
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  // Check if password matches
  const isMatch = await user.matchPassword(password);
  if (!isMatch) {
    throw createError('Invalid credentials', 401);
  }

  // Generate token
  const token = user.getSignedJwtToken();

  res.json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      weightGoal: user.weightGoal,
      weightGoalTimeframe: user.weightGoalTimeframe,
      activityLevel: user.activityLevel,
      healthGoals: user.healthGoals,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      createdAt: user.createdAt
    }
  });
}));

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      weightGoal: user.weightGoal,
      weightGoalTimeframe: user.weightGoalTimeframe,
      activityLevel: user.activityLevel,
      healthGoals: user.healthGoals,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
}));

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
  const { error, value } = updateProfileSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user.id,
    value,
    {
      new: true,
      runValidators: true
    }
  );

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isEmailVerified: user.isEmailVerified,
      dateOfBirth: user.dateOfBirth,
      gender: user.gender,
      height: user.height,
      weight: user.weight,
      weightGoal: user.weightGoal,
      weightGoalTimeframe: user.weightGoalTimeframe,
      activityLevel: user.activityLevel,
      healthGoals: user.healthGoals,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
}));

// @desc    Change password
// @route   PUT /api/auth/password
// @access  Private
router.put('/password', protect, asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw createError('Please provide current and new password', 400);
  }

  if (newPassword.length < 6) {
    throw createError('New password must be at least 6 characters', 400);
  }

  // Get user with password
  const user = await User.findById(req.user.id).select('+password');

  // Check current password
  const isMatch = await user.matchPassword(currentPassword);
  if (!isMatch) {
    throw createError('Current password is incorrect', 400);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

// @desc    Delete test user (DEVELOPMENT ONLY)
// @route   DELETE /api/auth/delete-test-user/:email
// @access  Public (Development only)
if (process.env.NODE_ENV !== 'production') {
  router.delete('/delete-test-user/:email', asyncHandler(async (req, res) => {
    const { email } = req.params;
    
    // Additional safety check - only allow deletion of test emails
    const testEmailPatterns = [
      /^test/i,
      /@test\./i,
      /@example\./i,
      /jasef\d*@/i, // Allow your test emails
    ];
    
    const isTestEmail = testEmailPatterns.some(pattern => pattern.test(email));
    
    if (!isTestEmail) {
      throw createError('Only test emails can be deleted through this endpoint', 403);
    }
    
    const result = await User.deleteOne({ email });
    
    res.json({
      success: true,
      message: result.deletedCount > 0 
        ? `Test user ${email} deleted successfully` 
        : `No user found with email ${email}`,
      deletedCount: result.deletedCount
    });
  }));
  
  // @desc    Delete all test users (DEVELOPMENT ONLY)
  // @route   DELETE /api/auth/delete-all-test-users
  // @access  Public (Development only)
  router.delete('/delete-all-test-users', asyncHandler(async (req, res) => {
    // Only delete users matching test patterns
    const result = await User.deleteMany({
      $or: [
        { email: /^test/i },
        { email: /@test\./i },
        { email: /@example\./i },
        { email: /jasef\d*@/i },
      ]
    });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} test users`,
      deletedCount: result.deletedCount
    });
  }));
}

export default router; 