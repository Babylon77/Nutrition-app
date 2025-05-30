import express from 'express';
import Joi from 'joi';
import { SupplementLog } from '../models/Supplement';
import { PersonalSupplement } from '../models/PersonalSupplement';
import { aiService } from '../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const supplementItemSchema = Joi.object({
  name: Joi.string().required(),
  brand: Joi.string().optional(),
  dosage: Joi.number().positive().required(),
  unit: Joi.string().required(),
  form: Joi.string().valid('capsule', 'tablet', 'liquid', 'powder', 'gummy', 'injection', 'patch', 'other').optional(),
  activeIngredients: Joi.array().items(Joi.string()).optional(),
  isPreScription: Joi.boolean().optional(),
  medicationClass: Joi.string().optional(),
  instructions: Joi.string().max(200).optional(),
  notes: Joi.string().max(300).optional(),
  confidence: Joi.number().min(0).max(1).optional()
});

const supplementLogSchema = Joi.object({
  date: Joi.date().required(),
  timeOfDay: Joi.string().valid('morning', 'afternoon', 'evening', 'night', 'with_meal', 'other').required(),
  supplements: Joi.array().items(supplementItemSchema).min(1).required(),
  notes: Joi.string().max(500).optional()
});

// @desc    Analyze supplement using AI
// @route   POST /api/supplements/analyze
// @access  Private
router.post('/analyze', protect, asyncHandler(async (req, res) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    throw createError('Supplement query is required', 400);
  }

  try {
    // Use AI to analyze the supplement
    const supplementData = await aiService.analyzeSupplementQuery(query);
    
    res.json({
      success: true,
      data: supplementData
    });
  } catch (error) {
    console.error('Supplement analysis error:', error);
    throw createError('Failed to analyze supplement. Please try again or enter manually.', 500);
  }
}));

// @desc    Create supplement log entry
// @route   POST /api/supplements/log
// @access  Private
router.post('/log', protect, asyncHandler(async (req, res) => {
  const { error } = supplementLogSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const { date, timeOfDay, supplements, notes } = req.body;

  // Create the supplement log
  const supplementLog = new SupplementLog({
    userId: req.user.id,
    date: new Date(date),
    timeOfDay,
    supplements,
    notes
  });

  await supplementLog.save();

  // Update personal supplement usage tracking
  for (const supplement of supplements) {
    try {
      const normalizedName = supplement.name.toLowerCase().trim();
      const personalSupplement = await PersonalSupplement.findOne({
        userId: req.user.id,
        normalizedName
      });

      if (personalSupplement) {
        await personalSupplement.incrementUsage();
      } else {
        // Create new personal supplement entry
        const newPersonalSupplement = new PersonalSupplement({
          userId: req.user.id,
          name: supplement.name,
          brand: supplement.brand,
          defaultDosage: supplement.dosage,
          defaultUnit: supplement.unit,
          form: supplement.form || 'capsule',
          content: {
            vitaminA: supplement.vitaminA,
            vitaminC: supplement.vitaminC,
            vitaminD: supplement.vitaminD,
            vitaminE: supplement.vitaminE,
            vitaminK: supplement.vitaminK,
            thiamin: supplement.thiamin,
            riboflavin: supplement.riboflavin,
            niacin: supplement.niacin,
            vitaminB6: supplement.vitaminB6,
            folate: supplement.folate,
            vitaminB12: supplement.vitaminB12,
            biotin: supplement.biotin,
            pantothenicAcid: supplement.pantothenicAcid,
            calcium: supplement.calcium,
            magnesium: supplement.magnesium,
            iron: supplement.iron,
            zinc: supplement.zinc,
            selenium: supplement.selenium,
            potassium: supplement.potassium,
            phosphorus: supplement.phosphorus,
            sodium: supplement.sodium,
            omega3: supplement.omega3,
            omega6: supplement.omega6,
            creatine: supplement.creatine,
            coq10: supplement.coq10,
            probioticCFU: supplement.probioticCFU,
            confidence: supplement.confidence
          },
          activeIngredients: supplement.activeIngredients,
          isPreScription: supplement.isPreScription,
          medicationClass: supplement.medicationClass,
          instructions: supplement.instructions,
          notes: supplement.notes,
          sourceType: 'ai_analyzed',
          timesUsed: 1,
          lastUsed: new Date()
        });

        await newPersonalSupplement.save();
      }
    } catch (error) {
      console.error('Error updating personal supplement:', error);
      // Continue processing other supplements
    }
  }

  res.status(201).json({
    success: true,
    data: supplementLog
  });
}));

// @desc    Get supplement logs for date range
// @route   GET /api/supplements/logs
// @access  Private
router.get('/logs', protect, asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    timeOfDay,
    page = 1, 
    limit = 50 
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);

  let dateQuery: any = { userId: req.user.id };

  if (startDate && endDate) {
    dateQuery.date = {
      $gte: new Date(startDate as string),
      $lte: new Date(endDate as string)
    };
  } else if (startDate) {
    dateQuery.date = { $gte: new Date(startDate as string) };
  } else if (endDate) {
    dateQuery.date = { $lte: new Date(endDate as string) };
  }

  if (timeOfDay) {
    dateQuery.timeOfDay = timeOfDay;
  }

  const logs = await SupplementLog.find(dateQuery)
    .sort({ date: -1, createdAt: -1 })
    .limit(limitNum)
    .skip((pageNum - 1) * limitNum);

  const total = await SupplementLog.countDocuments(dateQuery);

  res.json({
    success: true,
    data: logs,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      pages: Math.ceil(total / limitNum)
    }
  });
}));

// @desc    Get supplements for a specific date
// @route   GET /api/supplements/date/:date
// @access  Private
router.get('/date/:date', protect, asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  const startDate = new Date(date);
  startDate.setHours(0, 0, 0, 0);
  
  const endDate = new Date(date);
  endDate.setHours(23, 59, 59, 999);

  const logs = await SupplementLog.find({
    userId: req.user.id,
    date: { $gte: startDate, $lte: endDate }
  }).sort({ createdAt: 1 });

  res.json({
    success: true,
    data: logs
  });
}));

// @desc    Update supplement log
// @route   PUT /api/supplements/logs/:id
// @access  Private
router.put('/logs/:id', protect, asyncHandler(async (req, res) => {
  const { error } = supplementLogSchema.validate(req.body);
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const supplementLog = await SupplementLog.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!supplementLog) {
    throw createError('Supplement log not found', 404);
  }

  const { date, timeOfDay, supplements, notes } = req.body;

  supplementLog.date = new Date(date);
  supplementLog.timeOfDay = timeOfDay;
  supplementLog.supplements = supplements;
  supplementLog.notes = notes;

  await supplementLog.save();

  res.json({
    success: true,
    data: supplementLog
  });
}));

// @desc    Delete supplement log
// @route   DELETE /api/supplements/logs/:id
// @access  Private
router.delete('/logs/:id', protect, asyncHandler(async (req, res) => {
  const supplementLog = await SupplementLog.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!supplementLog) {
    throw createError('Supplement log not found', 404);
  }

  await SupplementLog.deleteOne({ _id: req.params.id });

  res.json({
    success: true,
    message: 'Supplement log deleted successfully'
  });
}));

// @desc    Get supplement summary for date range
// @route   GET /api/supplements/summary
// @access  Private
router.get('/summary', protect, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;

  const daysNum = parseInt(days as string);
  
  // Calculate date range for query
  const endDate = new Date();
  endDate.setHours(23, 59, 59, 999);
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysNum + 1);
  startDate.setHours(0, 0, 0, 0);

  const logs = await SupplementLog.find({
    userId: req.user.id,
    date: { 
      $gte: startDate,
      $lte: endDate 
    }
  });

  // Get unique dates that have logs
  const uniqueDates = [...new Set(logs.map(log => {
    const logDate = new Date(log.date);
    return logDate.toDateString();
  }))];
  const daysLogged = uniqueDates.length;

  // Calculate most common supplements
  const supplementCounts: { [key: string]: number } = {};
  const timeOfDayBreakdown = {
    morning: 0,
    afternoon: 0,
    evening: 0,
    night: 0,
    with_meal: 0,
    other: 0
  };

  logs.forEach(log => {
    timeOfDayBreakdown[log.timeOfDay]++;
    log.supplements.forEach(supplement => {
      const key = `${supplement.name}${supplement.brand ? ` (${supplement.brand})` : ''}`;
      supplementCounts[key] = (supplementCounts[key] || 0) + 1;
    });
  });

  const topSupplements = Object.entries(supplementCounts)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([name, count]) => ({ name, count }));

  const summary = {
    daysLogged,
    totalEntries: logs.length,
    averageSupplementsPerDay: daysLogged > 0 ? logs.length / daysLogged : 0,
    timeOfDayBreakdown,
    topSupplements
  };

  res.json({
    success: true,
    data: summary
  });
}));

export default router; 