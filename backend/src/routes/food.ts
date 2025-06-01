import express from 'express';
import Joi from 'joi';
import { FoodLog } from '../models/FoodLog';
import PersonalFood from '../models/PersonalFood';
import { foodService } from '../services/foodService';
import { aiService } from '../services/aiService';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { protect } from '../middleware/auth';

const router = express.Router();

// Validation schemas
const foodLogSchema = Joi.object({
  date: Joi.date().required(),
  mealType: Joi.string().valid('breakfast', 'lunch', 'dinner', 'snack').required(),
  foods: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      quantity: Joi.number().positive().required(),
      unit: Joi.string().required(),
      calories: Joi.number().min(0).optional(),
      protein: Joi.number().min(0).optional(),
      carbs: Joi.number().min(0).optional(),
      fat: Joi.number().min(0).optional(),
      fiber: Joi.number().min(0).optional(),
      sugar: Joi.number().min(0).optional(),
      sodium: Joi.number().min(0).optional(),
      potassium: Joi.number().min(0).optional(),
      calcium: Joi.number().min(0).optional(),
      iron: Joi.number().min(0).optional(),
      vitaminC: Joi.number().min(0).optional(),
      vitaminD: Joi.number().min(0).optional(),
      vitaminB12: Joi.number().min(0).optional(),
      folate: Joi.number().min(0).optional()
    })
  ).min(1).required(),
  notes: Joi.string().max(500).optional()
});

// @desc    Search food database using AI
// @route   GET /api/food/search
// @access  Private
router.get('/search', protect, asyncHandler(async (req, res) => {
  const { q: query } = req.query;
  
  if (!query || typeof query !== 'string') {
    throw createError('Search query is required', 400);
  }

  try {
    // Use AI-powered food search
    const foods = await aiService.searchFoods(query);
    
    res.json({
      success: true,
      count: foods.length,
      data: foods
    });
  } catch (error) {
    // Fallback to static database if AI fails
    const foods = foodService.searchFood(query, 10);
    
    res.json({
      success: true,
      count: foods.length,
      data: foods.map(food => ({
        name: food.name,
        category: 'Unknown',
        commonPortions: [
          { amount: 1, unit: 'serving', description: '1 serving' },
          { amount: 100, unit: 'g', description: '100g' }
        ],
        estimatedNutrition: {
          calories: food.calories,
          protein: food.protein,
          carbs: food.carbs,
          fat: food.fat
        }
      })),
      fallback: true
    });
  }
}));

// @desc    Get all food categories
// @route   GET /api/food/categories
// @access  Private
router.get('/categories', protect, asyncHandler(async (req, res) => {
  const categories = foodService.getFoodCategories();

  res.json({
    success: true,
    data: categories
  });
}));

// @desc    Get nutrition summary for date range
// @route   GET /api/food/summary
// @access  Private
router.get('/summary', protect, asyncHandler(async (req, res) => {
  const { days, date: specificDateStr } = req.query; // Add specificDateStr

  let foodLogs;
  let daysLogged = 0;

  if (specificDateStr && typeof specificDateStr === 'string') {
    // Query for a single specific date string
    console.log(`Querying food logs for specific date: ${specificDateStr}`);
    foodLogs = await FoodLog.find({
      userId: req.user.id,
      date: specificDateStr // Direct string comparison
    });
    if (foodLogs.length > 0) {
      daysLogged = 1; // If logs found for this date, it counts as 1 day logged
    }
    console.log(`Found ${foodLogs.length} food logs for specific date ${specificDateStr}`);
  } else {
    // Original logic for N days range (using server time for range, may need user timezone context for true "last N days")
    const daysNum = parseInt(days as string || '30');
    const endDate = new Date(); // Server's current date and time
    endDate.setHours(23, 59, 59, 999);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysNum + 1);
    startDate.setHours(0, 0, 0, 0);

    console.log(`Querying food logs from ${startDate.toISOString()} to ${endDate.toISOString()} (server time)`);
    // This part is tricky if FoodLog.date is a local date string. 
    // For now, this N-day query might not be perfectly aligned with user's local dates.
    // We are focusing on the single specificDateStr case for the calorie meter.
    // A proper N-day summary with local date strings would require generating N date strings.
    foodLogs = await FoodLog.find({
      userId: req.user.id,
      // date: { $gte: startDate, $lte: endDate } // This query is problematic with string dates
      // For N-days, we'd need to generate an array of date strings for the last N days from user's perspective
      // and use $in. This is a larger change. Let's assume specificDateStr is used for calorie meter for now.
    });
    // Placeholder for N-day foodLogs query if not using specificDateStr and want to fix N-day logic
    // For now, if specificDateStr is not provided, the foodLogs might be empty or not correctly filtered for N days
    // The calorie meter needs specificDateStr, so we prioritize that path.
    if (!specificDateStr) {
        // Fallback or adjusted logic for N days if specificDateStr isn't provided.
        // This is a placeholder: a full N-day query on string dates needs more work.
        // For the calorie meter, the specificDateStr path is key.
        console.warn("N-day summary query on string dates needs specific implementation, focusing on single date query for now.");
        // To prevent errors, let's fetch logs for today (server's today) if no specificDate or N-day logic is fully implemented for strings
        const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD for server's today
        foodLogs = await FoodLog.find({ userId: req.user.id, date: todayStr });
        if (foodLogs.length > 0) daysLogged = 1;
    }
  }

  // Calculate totals from the fetched foodLogs
  const summary = {
    daysLogged,
    totalCalories: foodLogs.reduce((sum, log) => {
      console.log(`Log calories: ${log.totalCalories}`);
      return sum + log.totalCalories;
    }, 0),
    totalProtein: foodLogs.reduce((sum, log) => sum + log.totalProtein, 0),
    totalCarbs: foodLogs.reduce((sum, log) => sum + log.totalCarbs, 0),
    totalFat: foodLogs.reduce((sum, log) => sum + log.totalFat, 0),
    averageCalories: 0,
    averageProtein: 0,
    averageCarbs: 0,
    averageFat: 0,
    goalCalories: 2000, // This should come from user profile
    mealTypeBreakdown: {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0
    }
  };

  if (daysLogged > 0) {
    summary.averageCalories = summary.totalCalories / daysLogged;
    summary.averageProtein = summary.totalProtein / daysLogged;
    summary.averageCarbs = summary.totalCarbs / daysLogged;
    summary.averageFat = summary.totalFat / daysLogged;

    // Count meal types
    foodLogs.forEach(log => {
      summary.mealTypeBreakdown[log.mealType]++;
    });
  }

  console.log('Summary result:', summary);

  res.json({
    success: true,
    data: summary
  });
}));

// @desc    Get nutrition info for a specific food
// @route   GET /api/food/:foodId/nutrition
// @access  Private
router.get('/:foodId/nutrition', protect, asyncHandler(async (req, res) => {
  const { foodId } = req.params;
  const { quantity, unit } = req.query;

  if (!quantity || !unit) {
    throw createError('Quantity and unit are required', 400);
  }

  // For now, use foodId as food name since we're using a static database
  const nutrition = foodService.calculateNutrition(
    foodId,
    parseFloat(quantity as string),
    unit as string
  );

  if (!nutrition) {
    throw createError('Food not found or invalid parameters', 404);
  }

  res.json({
    success: true,
    data: nutrition
  });
}));

// @desc    Get food log by date (grouped by meals)
// @route   GET /api/food/logs/:date
// @access  Private
router.get('/logs/:date', protect, asyncHandler(async (req, res) => {
  const { date } = req.params; // date is expected to be a 'YYYY-MM-DD' string
  console.log('Backend /api/food/logs/:date - Received date:', date, 'User ID:', req.user.id);
  
  // No need to convert to Date objects if FoodLog.date is a string 'YYYY-MM-DD'
  // const targetDate = new Date(date);
  // const startOfDay = new Date(targetDate);
  // startOfDay.setHours(0, 0, 0, 0);
  // const endOfDay = new Date(targetDate);
  // endOfDay.setHours(23, 59, 59, 999);

  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: date // Direct string comparison
  });
  console.log('Backend - Found foodLogs count:', foodLogs.length);

  // Group by meal type
  const meals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };

  let totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  // If no food logs exist, return empty structure instead of 404
  if (foodLogs.length > 0) {
    foodLogs.forEach(log => {
      const mealType = log.mealType === 'snack' ? 'snacks' : log.mealType;
      
      log.foods.forEach(food => {
        const foodItem = {
          food: {
            _id: food.name, // Use name as ID for now
            name: food.name,
            nutritionPer100g: food // Use the full nutrition data from database
          },
          quantity: food.quantity,
          unit: food.unit,
          nutrition: food, // Use the full nutrition data from database
          confidence: food.confidence || 0.8, // Use stored confidence or default
          weightConversion: food.weightConversion || undefined // Use stored weight conversion
        };
        
        meals[mealType].push(foodItem);
        
        // Add to total nutrition
        totalNutrition.calories += food.calories || 0;
        totalNutrition.protein += food.protein || 0;
        totalNutrition.carbs += food.carbs || 0;
        totalNutrition.fat += food.fat || 0;
        totalNutrition.fiber += food.fiber || 0;
        totalNutrition.sugar += food.sugar || 0;
        totalNutrition.sodium += food.sodium || 0;
      });
    });
  }

  const foodLogEntry = {
    _id: date,
    userId: req.user.id,
    date: date,
    meals,
    totalNutrition,
    createdAt: foodLogs[0]?.createdAt || new Date(),
    updatedAt: new Date()
  };
  console.log('Backend - foodLogEntry being sent:', JSON.stringify(foodLogEntry, null, 2));

  res.json({
    success: true,
    data: foodLogEntry
  });
}));

// @desc    Get user's food logs
// @route   GET /api/food/logs
// @access  Private
router.get('/logs', protect, asyncHandler(async (req, res) => {
  const { 
    startDate, 
    endDate, 
    mealType,
    page = 1, 
    limit = 10 
  } = req.query;

  // Build query
  const query: any = { userId: req.user.id };

  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = startDate as string;
    if (endDate) query.date.$lte = endDate as string;
  }

  if (mealType) {
    query.mealType = mealType;
  }

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  const foodLogs = await FoodLog.find(query)
    .sort({ date: -1, createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
    .populate('userId', 'name email');

  const total = await FoodLog.countDocuments(query);

  res.json({
    success: true,
    count: foodLogs.length,
    total,
    page: pageNum,
    pages: Math.ceil(total / limitNum),
    data: foodLogs
  });
}));

// @desc    Create food log entry (grouped meals)
// @route   POST /api/food/logs
// @access  Private
router.post('/logs', protect, asyncHandler(async (req, res) => {
  const { date, meals } = req.body;
  
  if (!date || !meals) {
    throw createError('Date and meals are required', 400);
  }

  const targetDate = new Date(date);
  
  // Delete existing logs for this date
  await FoodLog.deleteMany({
    userId: req.user.id,
    date: {
      $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      $lte: new Date(targetDate.setHours(23, 59, 59, 999))
    }
  });

  // Create new logs for each meal type
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const createdLogs = [];

  for (const mealType of mealTypes) {
    const mealTypeKey = mealType === 'snacks' ? 'snack' : mealType;
    const mealFoods = meals[mealType] || [];
    
    if (mealFoods.length > 0) {
      const foods = mealFoods.map(item => ({
        name: item.food.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.nutrition.calories,
        protein: item.nutrition.protein,
        carbs: item.nutrition.carbs,
        fat: item.nutrition.fat,
        fiber: item.nutrition.fiber,
        sugar: item.nutrition.sugar,
        sodium: item.nutrition.sodium
      }));

      const foodLog = await FoodLog.create({
        userId: req.user.id,
        date: targetDate,  // Use Date object instead of string
        mealType: mealTypeKey,
        foods
      });
      
      createdLogs.push(foodLog);
    }
  }

  // Return the grouped format by calling the get route logic
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: {
      $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
      $lte: new Date(targetDate.setHours(23, 59, 59, 999))
    }
  });

  // Group by meal type
  const resultMeals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };

  let totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  foodLogs.forEach(log => {
    const mealType = log.mealType === 'snack' ? 'snacks' : log.mealType;
    
    log.foods.forEach(food => {
      const foodItem = {
        food: {
          _id: food.name,
          name: food.name,
          nutritionPer100g: food // Use the full nutrition data from database
        },
        quantity: food.quantity,
        unit: food.unit,
        nutrition: food, // Use the full nutrition data from database
        confidence: food.confidence || 0.8, // Use stored confidence or default
        weightConversion: food.weightConversion || undefined // Use stored weight conversion
      };
      
      resultMeals[mealType].push(foodItem);
      
      // Add to total nutrition
      totalNutrition.calories += food.calories || 0;
      totalNutrition.protein += food.protein || 0;
      totalNutrition.carbs += food.carbs || 0;
      totalNutrition.fat += food.fat || 0;
      totalNutrition.fiber += food.fiber || 0;
      totalNutrition.sugar += food.sugar || 0;
      totalNutrition.sodium += food.sodium || 0;
    });
  });

  const foodLogEntry = {
    _id: targetDate.toISOString().split('T')[0],
    userId: req.user.id,
    date: targetDate,
    meals,
    totalNutrition,
    createdAt: createdLogs[0]?.createdAt || new Date(),
    updatedAt: new Date()
  };

  res.status(201).json({
    success: true,
    data: foodLogEntry
  });
}));

// @desc    Create/Update food log entry for specific date (URL-based date)
// @route   POST /api/food/logs/:date
// @access  Private
router.post('/logs/:date', protect, asyncHandler(async (req, res) => {
  const { date } = req.params; // This is the 'YYYY-MM-DD' string
  const { meals } = req.body;
  
  if (!meals) {
    throw createError('Meals are required', 400);
  }

  // const targetDate = new Date(date); // OLD: Converted to Date object
  const dateString = date; // NEW: Use the string directly
  
  // Delete existing logs for this date
  await FoodLog.deleteMany({
    userId: req.user.id,
    // date: { // OLD: Date object comparison
    //   $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
    //   $lte: new Date(targetDate.setHours(23, 59, 59, 999))
    // }
    date: dateString // NEW: String comparison
  });

  // Create new logs for each meal type
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const createdLogs = [];

  for (const mealType of mealTypes) {
    const mealTypeKey = mealType === 'snacks' ? 'snack' : mealType;
    const mealFoods = meals[mealType] || [];
    
    if (mealFoods.length > 0) {
      const foods = mealFoods.map(item => ({
        name: item.food.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.nutrition.calories || 0,
        protein: item.nutrition.protein || 0,
        carbs: item.nutrition.carbs || 0,
        fat: item.nutrition.fat || 0,
        fiber: item.nutrition.fiber || 0,
        sugar: item.nutrition.sugar || 0,
        sodium: item.nutrition.sodium || 0,
        // Add all the additional micronutrients
        saturatedFat: item.nutrition.saturatedFat || 0,
        monounsaturatedFat: item.nutrition.monounsaturatedFat || 0,
        polyunsaturatedFat: item.nutrition.polyunsaturatedFat || 0,
        transFat: item.nutrition.transFat || 0,
        omega3: item.nutrition.omega3 || 0,
        omega6: item.nutrition.omega6 || 0,
        potassium: item.nutrition.potassium || 0,
        calcium: item.nutrition.calcium || 0,
        magnesium: item.nutrition.magnesium || 0,
        phosphorus: item.nutrition.phosphorus || 0,
        iron: item.nutrition.iron || 0,
        zinc: item.nutrition.zinc || 0,
        selenium: item.nutrition.selenium || 0,
        vitaminA: item.nutrition.vitaminA || 0,
        vitaminC: item.nutrition.vitaminC || 0,
        vitaminD: item.nutrition.vitaminD || 0,
        vitaminE: item.nutrition.vitaminE || 0,
        vitaminK: item.nutrition.vitaminK || 0,
        thiamin: item.nutrition.thiamin || 0,
        riboflavin: item.nutrition.riboflavin || 0,
        niacin: item.nutrition.niacin || 0,
        vitaminB6: item.nutrition.vitaminB6 || 0,
        folate: item.nutrition.folate || 0,
        vitaminB12: item.nutrition.vitaminB12 || 0,
        biotin: item.nutrition.biotin || 0,
        pantothenicAcid: item.nutrition.pantothenicAcid || 0,
        cholesterol: item.nutrition.cholesterol || 0,
        creatine: item.nutrition.creatine || 0,
        // Add metadata
        confidence: item.confidence || 0.8,
        weightConversion: item.weightConversion || undefined
      }));

      const foodLog = await FoodLog.create({
        userId: req.user.id,
        // date: targetDate,  // OLD: Use Date object instead of string
        date: dateString, // NEW: Use the 'YYYY-MM-DD' string
        mealType: mealTypeKey,
        foods
      });
      
      createdLogs.push(foodLog);
    }
  }

  // Return the grouped format by calling the get route logic
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    // date: { // OLD: Date object comparison
    //   $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
    //   $lte: new Date(targetDate.setHours(23, 59, 59, 999))
    // }
    date: dateString // NEW: String comparison
  });

  // Group by meal type
  const resultMeals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };

  let totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  foodLogs.forEach(log => {
    const mealType = log.mealType === 'snack' ? 'snacks' : log.mealType;
    
    log.foods.forEach(food => {
      const foodItem = {
        food: {
          _id: food.name,
          name: food.name,
          nutritionPer100g: food // Use the full nutrition data from database
        },
        quantity: food.quantity,
        unit: food.unit,
        nutrition: food, // Use the full nutrition data from database
        confidence: food.confidence || 0.8, // Use stored confidence or default
        weightConversion: food.weightConversion || undefined // Use stored weight conversion
      };
      
      resultMeals[mealType].push(foodItem);
      
      // Add to total nutrition
      totalNutrition.calories += food.calories || 0;
      totalNutrition.protein += food.protein || 0;
      totalNutrition.carbs += food.carbs || 0;
      totalNutrition.fat += food.fat || 0;
      totalNutrition.fiber += food.fiber || 0;
      totalNutrition.sugar += food.sugar || 0;
      totalNutrition.sodium += food.sodium || 0;
    });
  });

  const foodLogEntry = {
    _id: targetDate.toISOString().split('T')[0], // This _id is fine for response structure
    userId: req.user.id,
    date: dateString, // NEW: Use the 'YYYY-MM-DD' string in response
    meals,
    totalNutrition,
    createdAt: createdLogs[0]?.createdAt || new Date(),
    updatedAt: new Date()
  };

  res.status(201).json({
    success: true,
    data: foodLogEntry
  });
}));

// @desc    Update food log (grouped meals)
// @route   PUT /api/food/logs/:date
// @access  Private
router.put('/logs/:date', protect, asyncHandler(async (req, res) => {
  const { date } = req.params; // This is the 'YYYY-MM-DD' string
  const { meals } = req.body;
  
  if (!meals) {
    throw createError('Meals are required', 400);
  }

  // const targetDate = new Date(date); // OLD: Converted to Date object
  const dateString = date; // NEW: Use the string directly
  
  // Delete existing logs for this date
  await FoodLog.deleteMany({
    userId: req.user.id,
    // date: { // OLD: Date object comparison
    //  $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
    //  $lte: new Date(targetDate.setHours(23, 59, 59, 999))
    // }
    date: dateString // NEW: String comparison
  });

  // Create new logs for each meal type
  const mealTypes = ['breakfast', 'lunch', 'dinner', 'snacks'];
  const createdLogs = [];

  for (const mealType of mealTypes) {
    const mealTypeKey = mealType === 'snacks' ? 'snack' : mealType;
    const mealFoods = meals[mealType] || [];
    
    if (mealFoods.length > 0) {
      const foods = mealFoods.map(item => ({
        name: item.food.name,
        quantity: item.quantity,
        unit: item.unit,
        calories: item.nutrition.calories,
        protein: item.nutrition.protein,
        carbs: item.nutrition.carbs,
        fat: item.nutrition.fat,
        fiber: item.nutrition.fiber,
        sugar: item.nutrition.sugar,
        sodium: item.nutrition.sodium
      }));

      const foodLog = await FoodLog.create({
        userId: req.user.id,
        // date: targetDate,  // OLD: Use Date object instead of string
        date: dateString, // NEW: Use the 'YYYY-MM-DD' string
        mealType: mealTypeKey,
        foods
      });
      
      createdLogs.push(foodLog);
    }
  }

  // Return the updated grouped format
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    // date: { // OLD: Date object comparison
    //  $gte: new Date(targetDate.setHours(0, 0, 0, 0)),
    //  $lte: new Date(targetDate.setHours(23, 59, 59, 999))
    // }
    date: dateString // NEW: String comparison
  });

  // Group by meal type
  const resultMeals = {
    breakfast: [],
    lunch: [],
    dinner: [],
    snacks: []
  };

  let totalNutrition = {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0
  };

  foodLogs.forEach(log => {
    const mealType = log.mealType === 'snack' ? 'snacks' : log.mealType;
    
    log.foods.forEach(food => {
      const foodItem = {
        food: {
          _id: food.name,
          name: food.name,
          nutritionPer100g: {
            calories: food.calories || 0,
            protein: food.protein || 0,
            carbs: food.carbs || 0,
            fat: food.fat || 0,
            fiber: food.fiber || 0,
            sugar: food.sugar || 0,
            sodium: food.sodium || 0
          }
        },
        quantity: food.quantity,
        unit: food.unit,
        nutrition: {
          calories: food.calories || 0,
          protein: food.protein || 0,
          carbs: food.carbs || 0,
          fat: food.fat || 0,
          fiber: food.fiber || 0,
          sugar: food.sugar || 0,
          sodium: food.sodium || 0
        },
        confidence: food.confidence || 0.8, // Use stored confidence or default
        weightConversion: food.weightConversion || undefined // Use stored weight conversion
      };
      
      resultMeals[mealType].push(foodItem);
      
      // Add to total nutrition
      totalNutrition.calories += food.calories || 0;
      totalNutrition.protein += food.protein || 0;
      totalNutrition.carbs += food.carbs || 0;
      totalNutrition.fat += food.fat || 0;
      totalNutrition.fiber += food.fiber || 0;
      totalNutrition.sugar += food.sugar || 0;
      totalNutrition.sodium += food.sodium || 0;
    });
  });

  const foodLogEntry = {
    _id: targetDate.toISOString().split('T')[0], // This _id is fine for response structure
    userId: req.user.id,
    date: dateString, // NEW: Use the 'YYYY-MM-DD' string in response
    meals: resultMeals,
    totalNutrition,
    createdAt: createdLogs[0]?.createdAt || new Date(),
    updatedAt: new Date()
  };

  res.json({
    success: true,
    data: foodLogEntry
  });
}));

// @desc    Delete food log
// @route   DELETE /api/food/logs/:date
// @access  Private
router.delete('/logs/:date', protect, asyncHandler(async (req, res) => {
  const { date } = req.params;
  
  // Fix: Use string comparison instead of date range
  const result = await FoodLog.deleteMany({
    userId: req.user.id,
    date: date  // Direct string comparison
  });

  res.json({
    success: true,
    message: `Deleted ${result.deletedCount} food log entries`
  });
}));

// @desc    Get detailed nutrition info for a food item using AI
// @route   POST /api/food/lookup
// @access  Private
router.post('/lookup', protect, asyncHandler(async (req, res) => {
  const { foodQuery, quantity = 1, unit = 'serving' } = req.body;
  
  if (!foodQuery) {
    throw createError('Food query is required', 400);
  }

  try {
    const nutritionData = await aiService.lookupFood(foodQuery, quantity, unit);
    
    res.json({
      success: true,
      data: nutritionData
    });
  } catch (error) {
    // Fallback to static database
    const nutrition = foodService.calculateNutrition(foodQuery, quantity, unit);
    
    if (!nutrition) {
      throw createError('Food not found', 404);
    }
    
    res.json({
      success: true,
      data: {
        name: foodQuery,
        normalizedName: foodQuery,
        quantity,
        unit,
        nutrition,
        confidence: 0.6,
        fallback: true
      }
    });
  }
}));

// @desc    Smart food entry with personal lookup and bulk processing
// @route   POST /api/food/smart-entry
// @access  Private
router.post('/smart-entry', protect, asyncHandler(async (req, res) => {
  const { action, data } = req.body;

  switch (action) {
    case 'search_personal':
      // Search personal foods for suggestions
      console.log(`🔍 Searching for "${data.query}" for user: ${req.user._id}`);
      
      const personalFoods = await PersonalFood.find({
        userId: req.user._id,
        $or: [
          { name: { $regex: data.query, $options: 'i' } },
          { normalizedName: { $regex: data.query, $options: 'i' } }
        ]
      }).limit(5).sort({ timesUsed: -1 });

      console.log(`🔍 Personal food search for "${data.query}" by user ${req.user._id}: found ${personalFoods.length} results`);
      console.log(`📋 Found foods: ${personalFoods.map(f => f.name).join(', ')}`);
      
      return res.json({
        success: true,
        action: 'search_personal',
        data: { suggestions: personalFoods }
      });

    case 'add_to_queue':
      // Add item to processing queue (stored in session/memory for now)
      // In production, you might store this in Redis or database
      if (!req.session.foodQueue) {
        req.session.foodQueue = [];
      }

      const queueItem = {
        id: Date.now().toString(),
        name: data.name,
        quantity: data.quantity,
        unit: data.unit,
        mealType: data.mealType,
        isPersonalFood: data.isPersonalFood || false,
        personalFoodId: data.personalFoodId || null,
        personalFoodData: data.personalFoodData || null, // Store complete personal food data
        status: data.isPersonalFood ? 'ready' : 'needs_analysis'
      };

      console.log('🏗️ BACKEND ADD TO QUEUE - Adding item:', {
        name: queueItem.name,
        isPersonalFood: queueItem.isPersonalFood,
        hasPersonalFoodData: !!queueItem.personalFoodData,
        personalFoodId: queueItem.personalFoodId
      });

      req.session.foodQueue.push(queueItem);

      req.session.save((err) => {
        if (err) {
          console.error('Failed to save session after adding to queue:', err);
          return res.status(500).json({ success: false, message: 'Failed to update food queue' });
        }
        return res.json({
          success: true,
          action: 'add_to_queue',
          data: { queue: req.session.foodQueue }
        });
      });
      break;

    case 'get_queue':
      // Get current queue state
      return res.json({
        success: true,
        action: 'get_queue',
        data: { queue: req.session.foodQueue || [] }
      });

    case 'remove_from_queue':
      // Remove item from queue
      if (req.session.foodQueue) {
        req.session.foodQueue = req.session.foodQueue.filter(
          item => item.id !== data.itemId
        );
      }

      return res.json({
        success: true,
        action: 'remove_from_queue',
        data: { queue: req.session.foodQueue || [] }
      });

    case 'clear_queue':
      // Clear entire queue
      req.session.foodQueue = [];

      return res.json({
        success: true,
        action: 'clear_queue',
        data: { queue: [] }
      });

    case 'process_queue':
      // Process all items in queue
      const queue = req.body.data && req.body.data.itemsToProcess ? req.body.data.itemsToProcess : [];
      const readyItems = queue.filter(item => item.status === 'ready');
      const needsAnalysis = queue.filter(item => item.status === 'needs_analysis');

      console.log('🎯 BACKEND PROCESS QUEUE - Starting processing...');
      console.log('📋 BACKEND PROCESS QUEUE - Total queue items:', queue.length);
      console.log('🥗 BACKEND PROCESS QUEUE - Ready items (personal foods):', readyItems.length);
      console.log('🤖 BACKEND PROCESS QUEUE - Need analysis items (AI foods):', needsAnalysis.length);
      console.log('📝 BACKEND PROCESS QUEUE - Full queue:', JSON.stringify(queue, null, 2));

      let analysisResults = [];

      // Bulk analyze unknown foods if any
      if (needsAnalysis.length > 0) {
        console.log('🤖 BACKEND PROCESS QUEUE - Processing AI foods...');
        const foodQueries = needsAnalysis.map(item => 
          `${item.quantity} ${item.unit} ${item.name}`
        );

        try {
          analysisResults = await aiService.bulkLookupFoods(foodQueries);
          console.log('✅ BACKEND PROCESS QUEUE - AI analysis complete:', analysisResults.length);
        } catch (error) {
          console.log('⚠️ BACKEND PROCESS QUEUE - AI bulk failed, trying individual...');
          // Fallback to individual analysis
          const individualResults = [];
          for (const item of needsAnalysis) {
            try {
              const result = await aiService.lookupFood(
                `${item.quantity} ${item.unit} ${item.name}`
              );
              individualResults.push(result);
            } catch (err) {
              individualResults.push({
                name: item.name,
                error: 'Analysis failed',
                nutrition: { calories: 0, protein: 0, carbs: 0, fat: 0 }
              });
            }
          }
          analysisResults = individualResults;
          console.log('✅ BACKEND PROCESS QUEUE - Individual AI analysis complete:', analysisResults.length);
        }
      }

      // Prepare final food items for logging
      const finalFoodItems = [];

      // Add ready items (from personal foods)
      console.log('🥗 BACKEND PROCESS QUEUE - Processing personal foods...');
      for (let i = 0; i < readyItems.length; i++) {
        const item = readyItems[i];
        console.log(`🔍 BACKEND PROCESS QUEUE - Processing item ${i + 1}/${readyItems.length}:`, {
          name: item.name,
          isPersonalFood: item.isPersonalFood,
          personalFoodId: item.personalFoodId,
          quantity: item.quantity,
          unit: item.unit,
          mealType: item.mealType
        });

        if (item.isPersonalFood && item.personalFoodData) {
          console.log(`✅ BACKEND PROCESS QUEUE - Using stored personal food data: ${item.personalFoodData.name}`);
          
          const foodItem = {
            name: item.personalFoodData.name,
            quantity: item.quantity,
            unit: item.unit,
            mealType: item.mealType,
            nutrition: item.personalFoodData.nutrition,
            confidence: 1.0,
            source: 'personal'
          };
          console.log(`📝 BACKEND PROCESS QUEUE - Created food item from stored data:`, foodItem);
          finalFoodItems.push(foodItem);

          // Update usage stats if we have the ID
          if (item.personalFoodId) {
            console.log(`📊 BACKEND PROCESS QUEUE - Updating usage stats for: ${item.personalFoodId}`);
            try {
              await PersonalFood.findByIdAndUpdate(
                item.personalFoodId,
                {
                  $inc: { timesUsed: 1 },
                  $set: { lastUsed: new Date() }
                }
              );
              console.log(`✅ BACKEND PROCESS QUEUE - Usage stats updated`);
            } catch (error) {
              console.log(`⚠️ BACKEND PROCESS QUEUE - Failed to update usage stats:`, error);
            }
          }
        } else if (item.isPersonalFood && item.personalFoodId) {
          console.log(`🔎 BACKEND PROCESS QUEUE - Fallback: Looking up personal food ID: ${item.personalFoodId}`);
          
          try {
            const personalFood = await PersonalFood.findById(item.personalFoodId);
            console.log(`📋 BACKEND PROCESS QUEUE - Personal food lookup result:`, personalFood ? {
              found: true,
              id: personalFood._id,
              name: personalFood.name,
              userId: personalFood.userId
            } : { found: false });

            if (personalFood) {
              console.log(`✅ BACKEND PROCESS QUEUE - Adding personal food: ${personalFood.name}`);
              const foodItem = {
                name: personalFood.name,
                quantity: item.quantity,
                unit: item.unit,
                mealType: item.mealType,
                nutrition: personalFood.nutrition,
                confidence: 1.0,
                source: 'personal'
              };
              console.log(`📝 BACKEND PROCESS QUEUE - Created food item:`, foodItem);
              finalFoodItems.push(foodItem);

              // Update usage stats
              console.log(`📊 BACKEND PROCESS QUEUE - Updating usage stats for: ${personalFood._id}`);
              await PersonalFood.findByIdAndUpdate(
                item.personalFoodId,
                {
                  $inc: { timesUsed: 1 },
                  $set: { lastUsed: new Date() }
                }
              );
              console.log(`✅ BACKEND PROCESS QUEUE - Usage stats updated`);
            } else {
              console.error(`❌ BACKEND PROCESS QUEUE - Personal food not found for ID: ${item.personalFoodId}`);
            }
          } catch (error) {
            console.error(`❌ BACKEND PROCESS QUEUE - Error looking up personal food:`, error);
          }
        } else {
          console.log(`⚠️ BACKEND PROCESS QUEUE - Item not marked as personal food or missing ID`);
        }
      }

      // Add analyzed items
      console.log('🤖 BACKEND PROCESS QUEUE - Adding AI analyzed items...');
      for (let i = 0; i < analysisResults.length; i++) {
        const result = analysisResults[i];
        const originalItem = needsAnalysis[i];

        const foodItem = {
          name: result.name || originalItem.name,
          quantity: originalItem.quantity,
          unit: originalItem.unit,
          mealType: originalItem.mealType,
          nutrition: result.nutrition || {},
          confidence: result.confidence || 0.8,
          source: 'ai'
        };
        console.log(`🤖 BACKEND PROCESS QUEUE - Added AI food item:`, foodItem);
        finalFoodItems.push(foodItem);
      }

      console.log(`🎉 BACKEND PROCESS QUEUE - Final result: ${finalFoodItems.length} total items`);
      console.log('📋 BACKEND PROCESS QUEUE - Final items summary:', finalFoodItems.map(item => ({
        name: item.name,
        source: item.source,
        calories: item.nutrition?.calories || 0
      })));

      // Clear the queue
      req.session.foodQueue = [];

      return res.json({
        success: true,
        action: 'process_queue',
        data: {
          processedItems: finalFoodItems,
          analysisResults: analysisResults,
          queue: []
        }
      });

    case 'quick_add_personal':
      // Instantly add a personal food without queue
      console.log(`🚀 Quick add request for personalFoodId: ${data.personalFoodId} by user: ${req.user._id}`);
      
      const personalFood = await PersonalFood.findOne({
        _id: data.personalFoodId,
        userId: req.user._id
      });
      
      if (!personalFood) {
        console.log(`❌ Personal food not found: ${data.personalFoodId} for user: ${req.user._id}`);
        throw createError('Personal food not found', 404);
      }

      console.log(`✅ Found personal food: ${personalFood.name}`);

      const quickFoodItem = {
        name: personalFood.name,
        quantity: data.quantity || personalFood.defaultQuantity,
        unit: data.unit || personalFood.defaultUnit,
        mealType: data.mealType,
        nutrition: personalFood.nutrition,
        confidence: 1.0,
        source: 'personal'
      };

      // Update usage stats
      await PersonalFood.findByIdAndUpdate(
        data.personalFoodId,
        {
          $inc: { timesUsed: 1 },
          $set: { lastUsed: new Date() }
        }
      );

      console.log(`📝 Quick add successful: ${personalFood.name}`);

      return res.json({
        success: true,
        action: 'quick_add_personal',
        data: { foodItem: quickFoodItem }
      });

    default:
      throw createError('Invalid action', 400);
  }
}));

export default router; 