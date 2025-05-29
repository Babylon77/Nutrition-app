import express from 'express';
import Joi from 'joi';
import { Analysis } from '../models/Analysis';
import { FoodLog } from '../models/FoodLog';
import { Bloodwork } from '../models/Bloodwork';
import { User } from '../models/User';
import { aiService } from '../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const analysisRequestSchema = Joi.object({
  analysisType: Joi.string().valid('nutrition', 'bloodwork', 'correlation').required(),
  startDate: Joi.date().required(),
  endDate: Joi.date().required()
});

// @desc    Generate nutrition analysis
// @route   POST /api/analysis/nutrition
// @access  Private
router.post('/nutrition', protect, asyncHandler(async (req, res) => {
  const { days = 7 } = req.body;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  // Get user profile
  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Get food logs for the date range
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  }).sort({ date: 1 });

  if (foodLogs.length === 0) {
    throw createError('No food logs found for the specified date range', 404);
  }

  // Calculate user age if date of birth is available
  const userAge = user.dateOfBirth 
    ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;

  // Prepare data for AI analysis
  const analysisInput = {
    foodLogs,
    userProfile: {
      age: userAge,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel,
      healthGoals: user.healthGoals,
      allergies: user.allergies,
      dietaryRestrictions: user.dietaryRestrictions,
      weightGoal: user.weightGoal,
      weightGoalTimeframe: user.weightGoalTimeframe
    }
  };

  // Calculate comprehensive nutrition totals from food items
  const calculateNutritionTotal = (nutrient: string) => {
    return foodLogs.reduce((sum, log) => {
      return sum + log.foods.reduce((foodSum, food) => {
        return foodSum + ((food as any)[nutrient] || 0);
      }, 0);
    }, 0);
  };

  // Calculate actual unique days
  const uniqueDates = [...new Set(foodLogs.map(log => 
    new Date(log.date).toDateString()
  ))];
  const actualDays = uniqueDates.length;

  // Generate AI analysis
  const aiResult = await aiService.analyzeNutrition({
    foodLogs,
    userProfile: analysisInput.userProfile,
    actualDays: actualDays,
    requestedDays: days,
    totalCalories: foodLogs.reduce((sum, log) => sum + log.totalCalories, 0),
    totalProtein: foodLogs.reduce((sum, log) => sum + log.totalProtein, 0),
    totalCarbs: foodLogs.reduce((sum, log) => sum + log.totalCarbs, 0),
    totalFat: foodLogs.reduce((sum, log) => sum + log.totalFat, 0),
    totalFiber: calculateNutritionTotal('fiber'),
    totalSugar: calculateNutritionTotal('sugar'),
    totalSodium: calculateNutritionTotal('sodium'),
    totalPotassium: calculateNutritionTotal('potassium'),
    totalSaturatedFat: calculateNutritionTotal('saturatedFat'),
    totalVitaminC: calculateNutritionTotal('vitaminC'),
    totalIron: calculateNutritionTotal('iron'),
    dateRange: {
      start: Math.min(...foodLogs.map(log => new Date(log.date).getTime())),
      end: Math.max(...foodLogs.map(log => new Date(log.date).getTime()))
    }
  });

  // Save analysis to database
  const analysis = await Analysis.create({
    userId: req.user.id,
    type: 'nutrition',
    date: new Date(),
    insights: aiResult.insights || ['Good nutritional variety', 'Consider increasing fiber intake'],
    recommendations: aiResult.recommendations || ['Add more vegetables', 'Drink more water'],
    confidence: aiResult.confidence || 0.8,
    summary: aiResult.summary,
    detailedAnalysis: aiResult.detailedAnalysis,
    llmModel: aiResult.llmModel,
    nutritionData: {
      totalCalories: foodLogs.reduce((sum, log) => sum + log.totalCalories, 0),
      macronutrients: {
        protein: foodLogs.reduce((sum, log) => sum + log.totalProtein, 0),
        carbs: foodLogs.reduce((sum, log) => sum + log.totalCarbs, 0),
        fat: foodLogs.reduce((sum, log) => sum + log.totalFat, 0)
      },
      period: days
    }
  });

  res.status(201).json({
    success: true,
    data: analysis
  });
}));

// @desc    Generate bloodwork analysis
// @route   POST /api/analysis/bloodwork
// @access  Private
router.post('/bloodwork', protect, asyncHandler(async (req, res) => {
  const { bloodworkId } = req.body;

  // Get user profile
  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  let bloodwork;
  
  if (bloodworkId) {
    // Get specific bloodwork by ID
    bloodwork = await Bloodwork.findOne({
      _id: bloodworkId,
      userId: req.user.id
    });
  } else {
    // Get most recent bloodwork if no ID provided
    bloodwork = await Bloodwork.findOne({
      userId: req.user.id
    }).sort({ testDate: -1, createdAt: -1 });
  }

  if (!bloodwork) {
    throw createError('No bloodwork found for analysis. Please upload or enter bloodwork data first.', 404);
  }

  // Calculate user age if date of birth is available
  const userAge = user.dateOfBirth 
    ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;

  // Prepare data for AI analysis
  const analysisInput = {
    bloodwork: [bloodwork], // Wrap in array to match interface
    userProfile: {
      age: userAge,
      gender: user.gender,
      weight: user.weight,
      height: user.height
    }
  };

  // Generate AI analysis
  const aiResult = await aiService.analyzeBloodwork({
    bloodwork: [bloodwork],
    userProfile: analysisInput.userProfile,
    testDate: bloodwork.testDate,
    labValues: bloodwork.labValues,
    labName: bloodwork.labName
  });

  // Analyze lab values
  const abnormalValues = bloodwork.labValues
    .filter(lab => lab.status && lab.status !== 'normal')
    .map(lab => lab.name);

  // Save analysis to database
  const analysis = await Analysis.create({
    userId: req.user.id,
    type: 'bloodwork',
    date: new Date(),
    insights: aiResult.insights || ['Most values are within normal range', 'Monitor cholesterol levels'],
    recommendations: aiResult.recommendations || ['Continue current health routine', 'Retest in 6 months'],
    confidence: aiResult.confidence || 0.75,
    summary: aiResult.summary,
    detailedAnalysis: aiResult.detailedAnalysis,
    llmModel: aiResult.llmModel,
    bloodworkData: {
      testDate: bloodwork.testDate,
      abnormalValues,
      totalValues: bloodwork.labValues.length
    }
  });

  res.status(201).json({
    success: true,
    data: analysis
  });
}));

// @desc    Generate correlation analysis
// @route   POST /api/analysis/correlation
// @access  Private
router.post('/correlation', protect, asyncHandler(async (req, res) => {
  const { nutritionDays = 30, bloodworkId } = req.body;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - nutritionDays);

  // Get user profile
  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  // Get food logs
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ date: 1 });

  // Get bloodwork (either specific ID or most recent)
  let bloodwork;
  if (bloodworkId) {
    bloodwork = await Bloodwork.findOne({ _id: bloodworkId, userId: req.user.id });
  } else {
    bloodwork = await Bloodwork.findOne({
      userId: req.user.id
    }).sort({ testDate: -1, createdAt: -1 });
  }

  if (foodLogs.length === 0) {
    throw createError('No food logs found for the specified period. Please log some food entries first.', 404);
  }

  if (!bloodwork) {
    throw createError('No bloodwork found for correlation analysis. Please upload or enter bloodwork data first.', 404);
  }

  // Calculate user age if date of birth is available
  const userAge = user.dateOfBirth 
    ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;

  // Prepare data for AI analysis
  const analysisInput = {
    foodLogs,
    bloodwork: [bloodwork], // Wrap in array to match interface
    userProfile: {
      age: userAge,
      gender: user.gender,
      weight: user.weight,
      height: user.height,
      activityLevel: user.activityLevel,
      healthGoals: user.healthGoals
    }
  };

  // Generate AI analysis
  const aiResult = await aiService.analyzeCorrelation(
    {
      foodLogs,
      userProfile: analysisInput.userProfile,
      nutritionDays
    },
    {
      bloodwork: [bloodwork],
      testDate: bloodwork.testDate,
      labValues: bloodwork.labValues
    }
  );

  // Save analysis to database
  const analysis = await Analysis.create({
    userId: req.user.id,
    type: 'correlation',
    date: new Date(),
    insights: aiResult.insights || ['High fiber intake may correlate with improved cholesterol levels', 'Protein intake aligns with muscle health markers'],
    recommendations: aiResult.recommendations || ['Continue current dietary pattern', 'Consider omega-3 supplementation'],
    confidence: aiResult.confidence || 0.65,
    summary: aiResult.summary,
    detailedAnalysis: aiResult.detailedAnalysis,
    llmModel: aiResult.llmModel,
    correlationData: {
      nutritionPeriod: nutritionDays,
      bloodworkDate: bloodwork.testDate,
      correlations: ['Fiber intake vs cholesterol', 'Protein vs muscle markers']
    }
  });

  res.status(201).json({
    success: true,
    data: analysis
  });
}));

// @desc    Get user's analyses
// @route   GET /api/analysis
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { 
    page = 1, 
    limit = 10,
    type 
  } = req.query;

  // Build query
  const query: any = { userId: req.user.id };

  if (type) {
    query.type = type;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const analyses = await Analysis.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Analysis.countDocuments(query);

  res.json({
    success: true,
    count: analyses.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: analyses
  });
}));

// @desc    Get user's analysis history
// @route   GET /api/analysis/history
// @access  Private
router.get('/history', protect, asyncHandler(async (req, res) => {
  const { 
    analysisType,
    page = 1, 
    limit = 10 
  } = req.query;

  // Build query
  const query: any = { userId: req.user.id };

  if (analysisType) {
    query.type = analysisType;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const analyses = await Analysis.find(query)
    .sort({ date: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await Analysis.countDocuments(query);

  res.json({
    success: true,
    count: analyses.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: analyses
  });
}));

// @desc    Get latest analysis summary
// @route   GET /api/analysis/latest
// @access  Private
router.get('/latest', protect, asyncHandler(async (req, res) => {
  const latestAnalyses = await Analysis.find({
    userId: req.user.id
  })
  .sort({ date: -1 })
  .limit(3)
  .select('type dateRange confidence dataQuality createdAt recommendations');

  res.json({
    success: true,
    data: latestAnalyses
  });
}));

// @desc    Get available AI models
// @route   GET /api/analysis/models
// @access  Private
router.get('/models', protect, asyncHandler(async (req, res) => {
  const models = aiService.getAvailableModels();
  const currentModel = aiService.getCurrentModel();

  res.json({
    success: true,
    data: {
      models,
      currentModel
    }
  });
}));

// @desc    Get analysis by ID
// @route   GET /api/analysis/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!analysis) {
    throw createError('Analysis not found', 404);
  }

  res.json({
    success: true,
    data: analysis
  });
}));

// @desc    Delete analysis
// @route   DELETE /api/analysis/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const analysis = await Analysis.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!analysis) {
    throw createError('Analysis not found', 404);
  }

  await Analysis.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Analysis deleted successfully'
  });
}));

export default router; 