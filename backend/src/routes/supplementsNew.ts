import express from 'express';
import Joi from 'joi';
import { SupplementRegimen } from '../models/SupplementRegimen';
import { SupplementIntake } from '../models/SupplementIntake';
import { aiService } from '../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const regimenSchema = Joi.object({
  name: Joi.string().max(200).required(),
  brand: Joi.string().max(100).allow('').optional(),
  dosage: Joi.number().min(0.1).required(),
  unit: Joi.string().max(20).required(),
  form: Joi.string().valid('capsule', 'tablet', 'liquid', 'powder', 'gummy', 'injection', 'patch', 'other').required(),
  frequency: Joi.string().valid('daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed', 'custom').required(),
  timesPerDay: Joi.number().min(1).max(10).optional(),
  daysPerWeek: Joi.number().min(1).max(7).optional(),
  timeOfDay: Joi.array().items(Joi.string().valid('morning', 'afternoon', 'evening', 'night', 'with_meal')).min(1).required(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  instructions: Joi.string().max(500).allow('').optional(),
  notes: Joi.string().max(1000).allow('').optional(),
  prescribedBy: Joi.string().max(100).allow('').optional(),
  isPreScription: Joi.boolean().optional(),
  medicationClass: Joi.string().max(50).allow('').optional()
});

const intakeSchema = Joi.object({
  regimenId: Joi.string().required(),
  dateTaken: Joi.date().optional(),
  timeOfDay: Joi.string().valid('morning', 'afternoon', 'evening', 'night', 'with_meal', 'other').required(),
  actualDosage: Joi.number().min(0.1).optional(),
  notes: Joi.string().max(500).allow('').optional()
});

// @desc    Analyze supplement with AI
// @route   POST /api/supplements-new/analyze
// @access  Private
router.post('/analyze', protect, asyncHandler(async (req, res) => {
  const { query } = req.body;
  
  if (!query || typeof query !== 'string') {
    throw createError('Query is required', 400);
  }

  try {
    const analysisResult = await aiService.analyzeSupplementQuery(query);
    
    res.json({
      success: true,
      data: analysisResult
    });
  } catch (error) {
    throw createError('Failed to analyze supplement', 500);
  }
}));

// @desc    Create new supplement regimen
// @route   POST /api/supplements-new/regimens
// @access  Private
router.post('/regimens', protect, asyncHandler(async (req, res) => {
  const { error, value } = regimenSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  const regimen = await SupplementRegimen.create({
    ...value,
    userId: req.user.id,
    startDate: value.startDate || new Date()
  });

  res.status(201).json({
    success: true,
    data: regimen
  });
}));

// @desc    Get user's supplement regimens
// @route   GET /api/supplements-new/regimens
// @access  Private
router.get('/regimens', protect, asyncHandler(async (req, res) => {
  const { active, page = 1, limit = 20 } = req.query;

  const query: any = { userId: req.user.id };
  if (active !== undefined) {
    query.isActive = active === 'true';
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const regimens = await SupplementRegimen.find(query)
    .sort({ isActive: -1, startDate: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await SupplementRegimen.countDocuments(query);

  res.json({
    success: true,
    count: regimens.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: regimens
  });
}));

// @desc    Update supplement regimen
// @route   PUT /api/supplements-new/regimens/:id
// @access  Private
router.put('/regimens/:id', protect, asyncHandler(async (req, res) => {
  const { error, value } = regimenSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  let regimen = await SupplementRegimen.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!regimen) {
    throw createError('Supplement regimen not found', 404);
  }

  regimen = await SupplementRegimen.findByIdAndUpdate(
    req.params.id,
    value,
    { new: true, runValidators: true }
  );

  res.json({
    success: true,
    data: regimen
  });
}));

// @desc    Delete supplement regimen
// @route   DELETE /api/supplements-new/regimens/:id
// @access  Private
router.delete('/regimens/:id', protect, asyncHandler(async (req, res) => {
  const regimen = await SupplementRegimen.findOne({
    _id: req.params.id,
    userId: req.user.id
  });

  if (!regimen) {
    throw createError('Supplement regimen not found', 404);
  }

  await SupplementRegimen.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: 'Supplement regimen deleted successfully'
  });
}));

// @desc    Mark supplement as taken (create intake record)
// @route   POST /api/supplements-new/intake
// @access  Private
router.post('/intake', protect, asyncHandler(async (req, res) => {
  const { error, value } = intakeSchema.validate(req.body);
  
  if (error) {
    throw createError(error.details[0].message, 400);
  }

  // Verify regimen exists and belongs to user
  const regimen = await SupplementRegimen.findOne({
    _id: value.regimenId,
    userId: req.user.id,
    isActive: true
  });

  if (!regimen) {
    throw createError('Supplement regimen not found or inactive', 404);
  }

  // Create intake record
  const intake = await SupplementIntake.create({
    userId: req.user.id,
    regimenId: regimen._id,
    dateTaken: value.dateTaken || new Date(),
    timeOfDay: value.timeOfDay,
    supplementName: regimen.name,
    brand: regimen.brand,
    dosage: value.actualDosage || regimen.dosage,
    unit: regimen.unit,
    form: regimen.form,
    actualDosage: value.actualDosage,
    notes: value.notes
  });

  // Update regimen's tracking
  await regimen.markTaken(value.dateTaken);

  res.status(201).json({
    success: true,
    data: intake
  });
}));

// @desc    Get today's supplement schedule
// @route   GET /api/supplements-new/today
// @access  Private
router.get('/today', protect, asyncHandler(async (req, res) => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  console.log('Today range:', today, 'to', tomorrow);

  // Get active regimens - fix date comparison to use end of today
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);

  const regimens = await SupplementRegimen.find({
    userId: req.user.id,
    isActive: true,
    startDate: { $lte: endOfToday }, // Allow supplements that start anytime today
    $or: [
      { endDate: { $exists: false } },
      { endDate: { $gte: today } }
    ]
  });

  console.log(`Found ${regimens.length} active regimens:`, regimens.map(r => ({
    name: r.name,
    startDate: r.startDate,
    endDate: r.endDate,
    frequency: r.frequency,
    isActive: r.isActive
  })));

  // Get today's intake records
  const intakes = await SupplementIntake.find({
    userId: req.user.id,
    dateTaken: { $gte: today, $lt: tomorrow }
  });

  // Build schedule
  const schedule = [];
  
  for (const regimen of regimens) {
    // Use a more flexible date check
    const regimenStartDate = new Date(regimen.startDate);
    const isScheduledToday = regimen.isActive && 
                            regimenStartDate <= endOfToday &&
                            (!regimen.endDate || new Date(regimen.endDate) >= today);

    console.log(`Regimen ${regimen.name}: isActive=${regimen.isActive}, startDate=${regimenStartDate}, scheduled=${isScheduledToday}`);

    if (isScheduledToday) {
      let timesPerDay = 1;
      if (regimen.frequency === 'twice_daily') timesPerDay = 2;
      else if (regimen.frequency === 'three_times_daily') timesPerDay = 3;
      else if (regimen.frequency === 'weekly') {
        // For weekly, check if today matches the start day
        const startDay = regimenStartDate.getDay();
        const todayDay = today.getDay();
        if (startDay !== todayDay) continue;
      } else if (regimen.frequency === 'as_needed') {
        continue; // Skip as-needed supplements
      }

      for (let i = 0; i < timesPerDay; i++) {
        const timeOfDay = regimen.timeOfDay[i] || regimen.timeOfDay[0] || 'morning';
        
        // Check if already taken
        const taken = intakes.some(intake => 
          intake.regimenId.toString() === regimen._id.toString() && 
          intake.timeOfDay === timeOfDay
        );

        schedule.push({
          regimenId: regimen._id,
          name: regimen.name,
          brand: regimen.brand,
          dosage: regimen.dosage,
          unit: regimen.unit,
          form: regimen.form,
          timeOfDay,
          instructions: regimen.instructions,
          taken,
          isPreScription: regimen.isPreScription
        });
      }
    }
  }

  // Sort by time of day
  const timeOrder = ['morning', 'afternoon', 'evening', 'night', 'with_meal'];
  schedule.sort((a, b) => {
    const aIndex = timeOrder.indexOf(a.timeOfDay);
    const bIndex = timeOrder.indexOf(b.timeOfDay);
    return aIndex - bIndex;
  });

  console.log(`Final schedule has ${schedule.length} items:`, schedule.map(s => ({ name: s.name, timeOfDay: s.timeOfDay, taken: s.taken })));

  res.json({
    success: true,
    data: {
      date: today.toISOString().split('T')[0],
      schedule,
      totalScheduled: schedule.length,
      totalTaken: schedule.filter(s => s.taken).length
    }
  });
}));

// @desc    Get supplement intake history
// @route   GET /api/supplements-new/intake/history
// @access  Private
router.get('/intake/history', protect, asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    regimenId,
    page = 1, 
    limit = 30 
  } = req.query;

  const query: any = { userId: req.user.id };

  if (startDate || endDate) {
    query.dateTaken = {};
    if (startDate) query.dateTaken.$gte = new Date(startDate as string);
    if (endDate) query.dateTaken.$lte = new Date(endDate as string);
  }

  if (regimenId) {
    query.regimenId = regimenId;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const intakes = await SupplementIntake.find(query)
    .populate('regimenId', 'name brand isActive')
    .sort({ dateTaken: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await SupplementIntake.countDocuments(query);

  res.json({
    success: true,
    count: intakes.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: intakes
  });
}));

// @desc    Get supplement summary/analytics
// @route   GET /api/supplements-new/summary
// @access  Private
router.get('/summary', protect, asyncHandler(async (req, res) => {
  const { days = 30 } = req.query;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - parseInt(days as string));
  
  // Get intake stats
  const intakes = await SupplementIntake.find({
    userId: req.user.id,
    dateTaken: { $gte: startDate }
  });

  // Get active regimens
  const activeRegimens = await SupplementRegimen.countDocuments({
    userId: req.user.id,
    isActive: true
  });

  // Calculate adherence (simplified)
  const totalDays = parseInt(days as string);
  const totalTaken = intakes.length;
  
  // Group by supplement
  const supplementStats = intakes.reduce((stats, intake) => {
    const key = intake.supplementName;
    if (!stats[key]) {
      stats[key] = {
        name: intake.supplementName,
        brand: intake.brand,
        timesTaken: 0,
        lastTaken: null
      };
    }
    stats[key].timesTaken++;
    if (!stats[key].lastTaken || intake.dateTaken > stats[key].lastTaken) {
      stats[key].lastTaken = intake.dateTaken;
    }
    return stats;
  }, {} as any);

  res.json({
    success: true,
    data: {
      period: `${days} days`,
      activeRegimens,
      totalIntakes: totalTaken,
      averagePerDay: (totalTaken / totalDays).toFixed(1),
      supplementBreakdown: Object.values(supplementStats)
    }
  });
}));

export default router; 