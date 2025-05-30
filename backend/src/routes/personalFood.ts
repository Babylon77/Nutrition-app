import { Router } from 'express';
import { protect } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import PersonalFood from '../models/PersonalFood';

const router = Router();

// @desc    Get user's personal foods
// @route   GET /api/personal-foods
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { 
    search, 
    category, 
    favorites, 
    limit = 20, 
    sort = 'frequent',
    page = 1
  } = req.query;

  const options = {
    search: search as string,
    category: category as string,
    favorites: favorites === 'true',
    limit: parseInt(limit as string),
    sort: sort as string
  };

  const skip = (parseInt(page as string) - 1) * options.limit;
  
  // Use the static method from our model
  const foods = await (PersonalFood as any).findByUser(req.user._id, options).skip(skip);
  
  // Get total count for pagination
  let countQuery = PersonalFood.find({ userId: req.user._id });
  if (options.search) {
    countQuery = countQuery.find({
      $or: [
        { normalizedName: new RegExp(options.search.toLowerCase(), 'i') },
        { name: new RegExp(options.search, 'i') }
      ]
    });
  }
  if (options.category) {
    countQuery = countQuery.find({ category: options.category });
  }
  if (options.favorites) {
    countQuery = countQuery.find({ isFavorite: true });
  }
  
  const totalCount = await countQuery.countDocuments();
  
  res.json({
    success: true,
    data: {
      foods,
      pagination: {
        page: parseInt(page as string),
        limit: options.limit,
        total: totalCount,
        pages: Math.ceil(totalCount / options.limit)
      }
    }
  });
}));

// @desc    Clear imported foods (for re-import with correct usage counts)
// @route   DELETE /api/personal-foods/clear-imported
// @access  Private
router.delete('/clear-imported', protect, asyncHandler(async (req, res) => {
  const result = await PersonalFood.deleteMany({
    userId: req.user._id,
    sourceType: 'imported'
  });

  res.json({
    success: true,
    data: {
      deletedCount: result.deletedCount
    },
    message: `Cleared ${result.deletedCount} imported foods from your personal database`
  });
}));

// @desc    Get single personal food by ID
// @route   GET /api/personal-foods/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const food = await PersonalFood.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!food) {
    throw createError('Personal food not found', 404);
  }

  res.json({
    success: true,
    data: food
  });
}));

// @desc    Save analyzed food to personal database
// @route   POST /api/personal-foods/save-analyzed
// @access  Private
router.post('/save-analyzed', protect, asyncHandler(async (req, res) => {
  const {
    name,
    quantity,
    unit,
    nutrition,
    originalQuery,
    category,
    notes
  } = req.body;

  if (!name || !quantity || !unit || !nutrition) {
    throw createError('Name, quantity, unit, and nutrition data are required', 400);
  }

  // Check if this food already exists for the user
  const existingFood = await PersonalFood.findOne({
    userId: req.user._id,
    normalizedName: name.toLowerCase().trim()
  });

  if (existingFood) {
    throw createError('This food already exists in your personal database', 409);
  }

  const personalFood = await PersonalFood.create({
    userId: req.user._id,
    name,
    defaultQuantity: quantity,
    defaultUnit: unit,
    nutrition,
    sourceType: 'ai_analyzed',
    originalQuery,
    category: category || 'other',
    notes,
    timesUsed: 1,
    lastUsed: new Date()
  });

  res.status(201).json({
    success: true,
    data: personalFood,
    message: 'Food saved to your personal database'
  });
}));

// @desc    Create custom personal food
// @route   POST /api/personal-foods
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
  const {
    name,
    defaultQuantity,
    defaultUnit,
    nutrition,
    category,
    notes
  } = req.body;

  if (!name || !defaultQuantity || !defaultUnit) {
    throw createError('Name, quantity, and unit are required', 400);
  }

  // Check if this food already exists for the user
  const existingFood = await PersonalFood.findOne({
    userId: req.user._id,
    normalizedName: name.toLowerCase().trim()
  });

  if (existingFood) {
    throw createError('This food already exists in your personal database', 409);
  }

  const personalFood = await PersonalFood.create({
    userId: req.user._id,
    name,
    defaultQuantity,
    defaultUnit,
    nutrition: nutrition || {},
    sourceType: 'user_created',
    category: category || 'other',
    notes
  });

  res.status(201).json({
    success: true,
    data: personalFood,
    message: 'Personal food created successfully'
  });
}));

// @desc    Update personal food
// @route   PUT /api/personal-foods/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req, res) => {
  const food = await PersonalFood.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!food) {
    throw createError('Personal food not found', 404);
  }

  const {
    name,
    defaultQuantity,
    defaultUnit,
    nutrition,
    category,
    notes,
    isFavorite
  } = req.body;

  // If name is being changed, check for duplicates
  if (name && name.toLowerCase().trim() !== food.normalizedName) {
    const existingFood = await PersonalFood.findOne({
      userId: req.user._id,
      normalizedName: name.toLowerCase().trim(),
      _id: { $ne: food._id }
    });

    if (existingFood) {
      throw createError('A food with this name already exists in your database', 409);
    }
  }

  // Update fields
  if (name !== undefined) food.name = name;
  if (defaultQuantity !== undefined) food.defaultQuantity = defaultQuantity;
  if (defaultUnit !== undefined) food.defaultUnit = defaultUnit;
  if (nutrition !== undefined) {
    food.nutrition = Object.assign(food.nutrition, nutrition);
  }
  if (category !== undefined) food.category = category;
  if (notes !== undefined) food.notes = notes;
  if (isFavorite !== undefined) food.isFavorite = isFavorite;

  await food.save();

  res.json({
    success: true,
    data: food,
    message: 'Personal food updated successfully'
  });
}));

// @desc    Delete personal food
// @route   DELETE /api/personal-foods/:id
// @access  Private
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const food = await PersonalFood.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!food) {
    throw createError('Personal food not found', 404);
  }

  await food.deleteOne();

  res.json({
    success: true,
    message: 'Personal food deleted successfully'
  });
}));

// @desc    Use personal food (increment usage and return as food item)
// @route   POST /api/personal-foods/:id/use
// @access  Private
router.post('/:id/use', protect, asyncHandler(async (req, res) => {
  const { quantity, unit } = req.body;

  const food = await PersonalFood.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!food) {
    throw createError('Personal food not found', 404);
  }

  // Increment usage tracking
  await food.incrementUsage();

  // Convert to food item format with custom quantity/unit if provided
  const foodItem = food.toFoodItem(quantity, unit);

  res.json({
    success: true,
    data: {
      foodItem,
      personalFood: food
    },
    message: 'Food item ready for logging'
  });
}));

// @desc    Toggle favorite status
// @route   PATCH /api/personal-foods/:id/favorite
// @access  Private
router.patch('/:id/favorite', protect, asyncHandler(async (req, res) => {
  const food = await PersonalFood.findOne({
    _id: req.params.id,
    userId: req.user._id
  });

  if (!food) {
    throw createError('Personal food not found', 404);
  }

  food.isFavorite = !food.isFavorite;
  await food.save();

  res.json({
    success: true,
    data: food,
    message: food.isFavorite ? 'Added to favorites' : 'Removed from favorites'
  });
}));

// @desc    Get user's food categories with counts
// @route   GET /api/personal-foods/categories/stats
// @access  Private
router.get('/categories/stats', protect, asyncHandler(async (req, res) => {
  const stats = await PersonalFood.aggregate([
    { $match: { userId: req.user._id } },
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 },
        totalUsage: { $sum: '$timesUsed' }
      }
    },
    { $sort: { count: -1 } }
  ]);

  const totalFoods = await PersonalFood.countDocuments({ userId: req.user._id });
  const favoritesCount = await PersonalFood.countDocuments({ 
    userId: req.user._id, 
    isFavorite: true 
  });

  res.json({
    success: true,
    data: {
      categories: stats,
      totalFoods,
      favoritesCount
    }
  });
}));

// @desc    Import foods from existing food logs to personal database  
// @route   POST /api/personal-foods/import-from-logs
// @access  Private
router.post('/import-from-logs', protect, asyncHandler(async (req, res) => {
  const { days = 30 } = req.body;
  
  // Get user's food logs from the last X days
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);
  
  const { FoodLog } = require('../models/FoodLog');
  const foodLogs = await FoodLog.find({
    userId: req.user._id,
    date: {
      $gte: startDate,
      $lte: endDate
    }
  });

  if (foodLogs.length === 0) {
    return res.json({
      success: true,
      data: {
        imported: 0,
        skipped: 0,
        duplicates: 0
      },
      message: 'No food logs found in the specified time period'
    });
  }

  // Collect all foods from all meal logs across all days
  const allFoods = [];
  foodLogs.forEach(log => {
    // Each log represents one meal, so go through all foods in that meal
    log.foods.forEach(food => {
      allFoods.push({
        name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        nutrition: {
          calories: food.calories || 0,
          protein: food.protein || 0,
          carbs: food.carbs || 0,
          fat: food.fat || 0,
          fiber: food.fiber || 0,
          sugar: food.sugar || 0,
          saturatedFat: food.saturatedFat || 0,
          monounsaturatedFat: food.monounsaturatedFat || 0,
          polyunsaturatedFat: food.polyunsaturatedFat || 0,
          transFat: food.transFat || 0,
          omega3: food.omega3 || 0,
          omega6: food.omega6 || 0,
          sodium: food.sodium || 0,
          potassium: food.potassium || 0,
          calcium: food.calcium || 0,
          magnesium: food.magnesium || 0,
          phosphorus: food.phosphorus || 0,
          iron: food.iron || 0,
          zinc: food.zinc || 0,
          selenium: food.selenium || 0,
          vitaminA: food.vitaminA || 0,
          vitaminC: food.vitaminC || 0,
          vitaminD: food.vitaminD || 0,
          vitaminE: food.vitaminE || 0,
          vitaminK: food.vitaminK || 0,
          thiamin: food.thiamin || 0,
          riboflavin: food.riboflavin || 0,
          niacin: food.niacin || 0,
          vitaminB6: food.vitaminB6 || 0,
          folate: food.folate || 0,
          vitaminB12: food.vitaminB12 || 0,
          biotin: food.biotin || 0,
          pantothenicAcid: food.pantothenicAcid || 0,
          cholesterol: food.cholesterol || 0,
          creatine: food.creatine || 0,
          confidence: food.confidence || 0.8,
          weightConversion: food.weightConversion
        }
      });
    });
  });

  console.log(`Found ${allFoods.length} food items across ${foodLogs.length} days`);

  // Count occurrences and track usage of each food
  const foodUsageMap = new Map();
  allFoods.forEach(food => {
    const normalizedName = food.name.toLowerCase().trim();
    if (!foodUsageMap.has(normalizedName)) {
      foodUsageMap.set(normalizedName, {
        food: food,
        count: 1,
        dates: []
      });
    } else {
      const existing = foodUsageMap.get(normalizedName);
      existing.count++;
      foodUsageMap.set(normalizedName, existing);
    }
  });

  // Also track the dates each food was used
  foodLogs.forEach(log => {
    log.foods.forEach(food => {
      const normalizedName = food.name.toLowerCase().trim();
      if (foodUsageMap.has(normalizedName)) {
        const usage = foodUsageMap.get(normalizedName);
        usage.dates.push(log.date);
        foodUsageMap.set(normalizedName, usage);
      }
    });
  });

  console.log(`Found ${foodUsageMap.size} unique foods to import with usage counts`);

  let imported = 0;
  let duplicates = 0;
  let skipped = 0;

  // Try to import each unique food with proper usage counts
  for (const [normalizedName, foodData] of foodUsageMap) {
    try {
      // Check if this food already exists in personal database
      const existingFood = await PersonalFood.findOne({
        userId: req.user._id,
        normalizedName: normalizedName
      });

      if (existingFood) {
        console.log(`⏭️  Food already exists: ${foodData.food.name} (used ${foodData.count} times)`);
        duplicates++;
        continue;
      }

      // Find the most recent usage date
      const mostRecentDate = foodData.dates.length > 0 
        ? new Date(Math.max(...foodData.dates.map(d => new Date(d).getTime())))
        : new Date();

      // Create personal food from food log item
      const personalFoodData = {
        userId: req.user._id,
        name: foodData.food.name,
        normalizedName: normalizedName,
        defaultQuantity: foodData.food.quantity,
        defaultUnit: foodData.food.unit,
        nutrition: foodData.food.nutrition,
        category: 'other', // Default category
        sourceType: 'imported' as const,
        originalQuery: foodData.food.name,
        timesUsed: foodData.count, // Use actual count from logs
        lastUsed: mostRecentDate, // Use most recent usage date
      };

      console.log(`🔄 Creating PersonalFood: ${foodData.food.name} (used ${foodData.count} times)`);

      const personalFood = new PersonalFood(personalFoodData);
      await personalFood.save();
      console.log(`✅ Successfully imported: ${foodData.food.name} with ${foodData.count} uses`);
      imported++;
      
    } catch (error: any) {
      console.log(`❌ Failed to import food ${foodData.food.name}:`, error.message);
      skipped++;
    }
  }

  res.json({
    success: true,
    data: {
      imported,
      duplicates,
      skipped,
      totalUnique: foodUsageMap.size,
    },
    message: `Successfully imported ${imported} foods to your personal database. ${duplicates} already existed, ${skipped} failed.`
  });
}));

export default router; 