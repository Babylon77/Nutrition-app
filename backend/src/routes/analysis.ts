import express from 'express';
import Joi from 'joi';
import { Analysis } from '../models/Analysis';
import { FoodLog } from '../models/FoodLog';
import { Bloodwork } from '../models/Bloodwork';
import { User } from '../models/User';
import { SupplementRegimen } from '../models/SupplementRegimen';
import { SupplementIntake } from '../models/SupplementIntake';
import { aiService } from '../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';
import { logger } from '../utils/logger';

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
  const { days = 7, getSecondOpinion = false } = req.body;

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

  // Get active supplement regimens
  const supplementRegimens = await SupplementRegimen.find({
    userId: req.user.id,
    isActive: true,
    startDate: { $lte: endDate },
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: startDate } }
    ]
  });

  // Get supplement intake for the period
  const supplementIntakes = await SupplementIntake.find({
    userId: req.user.id,
    dateTaken: { $gte: startDate, $lte: endDate }
  });

  // Calculate actual days with data
  const actualDays = [...new Set(foodLogs.map(log => 
    new Date(log.date).toDateString()
  ))].length;

  if (foodLogs.length === 0 && supplementRegimens.length === 0) {
    throw createError('No nutrition or supplement data found for the specified date range. Please log some food entries or add supplement regimens first.', 404);
  }

  // Calculate user age if date of birth is available
  const userAge = user.dateOfBirth 
    ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;

  // Helper function to calculate nutrition totals (defined before use)
  const calculateNutritionTotal = (nutrient: string) => {
    return foodLogs.reduce((total, log) => {
      return total + log.foods.reduce((itemTotal, item) => {
        return itemTotal + ((item as any)[nutrient] || 0);
      }, 0);
    }, 0);
  };

  // Prepare data for AI analysis (this will be our inputData)
  const inputDataForAnalysis = {
    foodLogs,
    supplementRegimens,
    supplementIntakes,
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
    },
    period: { days, actualDays, startDate, endDate },
    // Add calculated totals directly to the inputData object
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
      start: foodLogs.length > 0 ? Math.min(...foodLogs.map(log => new Date(log.date).getTime())) : null,
      end: foodLogs.length > 0 ? Math.max(...foodLogs.map(log => new Date(log.date).getTime())) : null
    }
  };

  // Generate AI analysis with the prepared comprehensive inputData
  const aiResult = await aiService.analyzeNutrition(inputDataForAnalysis);

  let secondOpinionResult = null;
  if (getSecondOpinion) {
    try {
      const originalAnalysisDetailsForSecondOpinion = {
        insights: aiResult.insights,
        recommendations: aiResult.recommendations,
        summary: aiResult.summary,
        llmModel: aiResult.llmModel
      };
      // When getSecondOpinion is true on initial creation, let's default to a predefined second opinion model (e.g., Gemini via aiService.geminiModel)
      // The aiService.geminiModel is currently 'gemini-1.5-flash-latest'
      // We might want to make this choice more flexible later if needed for this specific route.
      const defaultSecondOpinionModel = (aiService as any).geminiModel || 'gemini-1.5-flash-latest'; 

      logger.info(`Requesting initial second opinion with model: ${defaultSecondOpinionModel}`);
      secondOpinionResult = await aiService.getSecondOpinionAnalysis(
        inputDataForAnalysis, 
        originalAnalysisDetailsForSecondOpinion,
        defaultSecondOpinionModel // Use the default model
      );
    } catch (error: any) {
      // Log the error but don't let it break the primary analysis saving/response
      logger.error('Failed to get second opinion during initial analysis creation:', { message: error.message });
      // Set to null so primary analysis can still be saved
      secondOpinionResult = null; 
    }
  }

  // Save analysis to database, including the inputDataForAnalysis
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
    inputData: inputDataForAnalysis, // Save the full input data
    secondOpinionText: secondOpinionResult?.secondOpinionText,
    secondOpinionLlmModel: secondOpinionResult?.llmModel,
    nutritionData: {
      totalCalories: foodLogs.reduce((sum, log) => sum + log.totalCalories, 0),
      macronutrients: {
        protein: foodLogs.reduce((sum, log) => sum + log.totalProtein, 0),
        carbs: foodLogs.reduce((sum, log) => sum + log.totalCarbs, 0),
        fat: foodLogs.reduce((sum, log) => sum + log.totalFat, 0)
      },
      period: days,
      supplementCount: supplementRegimens.length,
      supplementIntakeCount: supplementIntakes.length
    }
  });

  // Ensure the created analysis object (which is returned) includes the second opinion fields if they were set
  const analysisObject = analysis.toObject();
  if (secondOpinionResult) {
    analysisObject.secondOpinionText = secondOpinionResult.secondOpinionText;
    analysisObject.secondOpinionLlmModel = secondOpinionResult.llmModel;
  }

  res.status(201).json({
    success: true,
    data: analysisObject
  });
}));

// @desc    Generate bloodwork analysis
// @route   POST /api/analysis/bloodwork
// @access  Private
router.post('/bloodwork', protect, asyncHandler(async (req, res) => {
  const { bloodworkId, includeAll = true } = req.body;

  // Get user profile
  const user = await User.findById(req.user.id);
  if (!user) {
    throw createError('User not found', 404);
  }

  let bloodworkEntries;
  
  if (bloodworkId) {
    // Get specific bloodwork by ID (single entry)
    const singleBloodwork = await Bloodwork.findOne({
      _id: bloodworkId,
      userId: req.user.id
    });
    bloodworkEntries = singleBloodwork ? [singleBloodwork] : [];
  } else if (includeAll) {
    // Get all bloodwork entries for comprehensive analysis
    bloodworkEntries = await Bloodwork.find({
      userId: req.user.id
    }).sort({ testDate: -1, createdAt: -1 });
  } else {
    // Get most recent bloodwork only
    const recentBloodwork = await Bloodwork.findOne({
      userId: req.user.id
    }).sort({ testDate: -1, createdAt: -1 });
    bloodworkEntries = recentBloodwork ? [recentBloodwork] : [];
  }

  if (!bloodworkEntries || bloodworkEntries.length === 0) {
    throw createError('No bloodwork found for analysis. Please upload or enter bloodwork data first.', 404);
  }

  // Calculate user age if date of birth is available
  const userAge = user.dateOfBirth 
    ? Math.floor((Date.now() - user.dateOfBirth.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
    : undefined;

  // Prepare data for AI analysis
  const analysisInput = {
    bloodworkEntries,
    userProfile: {
      age: userAge,
      gender: user.gender,
      weight: user.weight,
      height: user.height
    },
    entryCount: bloodworkEntries.length,
    dateRange: bloodworkEntries.length > 1 ? {
      earliest: bloodworkEntries[bloodworkEntries.length - 1].testDate,
      latest: bloodworkEntries[0].testDate
    } : null
  };

  // Generate AI analysis with all available data
  const aiResult = await aiService.analyzeBloodwork({
    bloodwork: bloodworkEntries,
    userProfile: analysisInput.userProfile,
    entryCount: bloodworkEntries.length,
    dateRange: analysisInput.dateRange
  });

  // Analyze lab values across all entries
  const allAbnormalValues = bloodworkEntries.flatMap(entry =>
    entry.labValues
      .filter(lab => lab.status && lab.status !== 'normal')
      .map(lab => lab.name)
  );
  const uniqueAbnormalValues = [...new Set(allAbnormalValues)];

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
      testDate: bloodworkEntries[0].testDate, // Most recent test date
      abnormalValues: uniqueAbnormalValues,
      totalValues: bloodworkEntries.reduce((sum, entry) => sum + entry.labValues.length, 0),
      entriesAnalyzed: bloodworkEntries.length,
      dateRange: analysisInput.dateRange
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

// @desc    Get second opinion for an existing nutrition analysis
// @route   PATCH /api/analysis/:id/second-opinion
// @access  Private
router.patch('/:id/second-opinion', protect, asyncHandler(async (req, res) => {
  const analysisId = req.params.id;
  const userId = req.user.id;
  const { secondOpinionModel } = req.body; // Get the requested model from the request body

  if (!secondOpinionModel) {
    throw createError('A model for the second opinion (secondOpinionModel) must be specified.', 400);
  }

  const analysis = await Analysis.findOne({ _id: analysisId, userId: userId });

  if (!analysis) {
    throw createError('Analysis not found', 404);
  }

  if (analysis.type !== 'nutrition') {
    throw createError('Second opinion is currently only supported for nutrition analyses.', 400);
  }

  if (!analysis.inputData) {
    throw createError('Cannot generate second opinion: Original input data not found for this analysis. This may be an older analysis created before this feature was available.', 400);
  }

  // Prevent re-generating if a second opinion already exists with the *same model*.
  // If you want to allow re-generating with a different model, this logic might need adjustment
  // or simply allow overwriting by removing this check.
  if (analysis.secondOpinionText && analysis.secondOpinionLlmModel === secondOpinionModel) {
    logger.info(`Second opinion with model ${secondOpinionModel} already exists for analysis ${analysisId}. Returning existing data.`);
    return res.status(200).json({
      success: true,
      message: `Second opinion with model ${secondOpinionModel} already exists.`, // Updated message
      data: analysis.toObject()
    });
  }

  try {
    const originalAnalysisDetails = {
      insights: analysis.insights,
      recommendations: analysis.recommendations,
      summary: analysis.summary,
      llmModel: analysis.llmModel
    };

    const secondOpinionResult = await aiService.getSecondOpinionAnalysis(
      analysis.inputData, 
      originalAnalysisDetails,
      secondOpinionModel // Pass the requested model
    );

    analysis.secondOpinionText = secondOpinionResult.secondOpinionText;
    analysis.secondOpinionLlmModel = secondOpinionResult.llmModel; // This will be the model actually used (e.g. specific Gemini or OpenAI model)
    analysis.updatedAt = new Date();

    await analysis.save();

    res.status(200).json({
      success: true,
      data: analysis.toObject()
    });

  } catch (error: any) {
    logger.error(`Failed to get second opinion for analysis ${analysisId} with model ${secondOpinionModel}:`, { message: error.message });
    throw createError(`Failed to generate second opinion with ${secondOpinionModel}: ${error.message}`, 500);
  }
}));

export default router; 