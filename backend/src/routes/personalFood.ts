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

export default router; 