import express from 'express';
import Joi from 'joi';
import { FoodLog } from '../models/FoodLog';
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
  const { days = 30 } = req.query;

  const daysNum = parseInt(days as string);
  
  // Generate array of date strings for the range
  const dateStrings = [];
  for (let i = 0; i < daysNum; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    dateStrings.push(`${year}-${month}-${day}`);
  }

  const query = {
    userId: req.user.id,
    date: { $in: dateStrings }  // Use $in with array of date strings
  };

  const foodLogs = await FoodLog.find(query);

  // Get unique dates that have logs
  const uniqueDates = [...new Set(foodLogs.map(log => log.date))];
  const daysLogged = uniqueDates.length;

  // Calculate totals
  const summary = {
    daysLogged,
    totalCalories: foodLogs.reduce((sum, log) => sum + log.totalCalories, 0),
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
  const { date } = req.params;
  
  // Since date is now stored as string, do direct string comparison
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: date  // Direct string comparison instead of date range
  });

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

  // Fix: Store date as string to avoid timezone conversion issues
  // Delete existing logs for this date (compare by date string)
  await FoodLog.deleteMany({
    userId: req.user.id,
    date: date  // Compare directly with date string
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
        date: date,  // Fix: Store as string, not Date object
        mealType: mealTypeKey,
        foods
      });
      
      createdLogs.push(foodLog);
    }
  }

  // Return the grouped format by calling the get route logic
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: date  // Direct string comparison
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
    _id: date,
    userId: req.user.id,
    date: date,
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
  const { date } = req.params;
  const { meals } = req.body;
  
  if (!meals) {
    throw createError('Meals are required', 400);
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
        date: date,  // Fix: Store as string, not Date object
        mealType: mealTypeKey,
        foods
      });
      
      createdLogs.push(foodLog);
    }
  }

  // Return the grouped format by calling the get route logic
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: date  // Direct string comparison
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
    _id: date,
    userId: req.user.id,
    date: date,
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
  const { date } = req.params;
  const { meals } = req.body;
  
  if (!meals) {
    throw createError('Meals are required', 400);
  }

  // Delete existing logs for this date using string comparison
  await FoodLog.deleteMany({
    userId: req.user.id,
    date: date  // Direct string comparison
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
        date: date,  // Fix: Store as string, not Date object
        mealType: mealTypeKey,
        foods
      });
      
      createdLogs.push(foodLog);
    }
  }

  // Return the updated grouped format
  const foodLogs = await FoodLog.find({
    userId: req.user.id,
    date: date  // Direct string comparison
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
    _id: date,
    userId: req.user.id,
    date: date,
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

export default router; 