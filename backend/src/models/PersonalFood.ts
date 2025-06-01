import mongoose, { Document, Schema } from 'mongoose';

// Nutrition interface - reusing the structure from FoodLog
export interface INutrition {
  // Macronutrients
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  
  // Fat breakdown
  saturatedFat?: number;
  monounsaturatedFat?: number;
  polyunsaturatedFat?: number;
  transFat?: number;
  omega3?: number;
  omega6?: number;
  
  // Minerals
  sodium?: number;
  potassium?: number;
  calcium?: number;
  magnesium?: number;
  phosphorus?: number;
  iron?: number;
  zinc?: number;
  selenium?: number;
  
  // Vitamins
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  thiamin?: number; // B1
  riboflavin?: number; // B2
  niacin?: number; // B3
  vitaminB6?: number;
  folate?: number; // B9
  vitaminB12?: number;
  biotin?: number;
  pantothenicAcid?: number; // B5
  
  // Additional compounds
  cholesterol?: number;
  creatine?: number;
  
  // Metadata
  confidence?: number;
  weightConversion?: {
    grams: number;
    ounces: number;
    pounds: number;
  };
}

export interface IPersonalFood extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string; // For searching/matching
  defaultQuantity: number;
  defaultUnit: string;
  nutrition: INutrition;
  
  // User customizations
  notes?: string;
  isFavorite?: boolean;
  category?: string; // e.g., 'breakfast', 'protein', 'snacks', etc.
  
  // Usage tracking
  timesUsed: number;
  lastUsed?: Date;
  
  // Source information
  sourceType: 'ai_analyzed' | 'user_created' | 'imported';
  originalQuery?: string; // If from AI analysis
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementUsage(): Promise<IPersonalFood>;
  toFoodItem(customQuantity?: number, customUnit?: string): any;
}

const nutritionSchema = new Schema<INutrition>({
  // Macronutrients
  calories: { type: Number, min: 0 },
  protein: { type: Number, min: 0 },
  carbs: { type: Number, min: 0 },
  fat: { type: Number, min: 0 },
  fiber: { type: Number, min: 0 },
  sugar: { type: Number, min: 0 },
  
  // Fat breakdown
  saturatedFat: { type: Number, min: 0 },
  monounsaturatedFat: { type: Number, min: 0 },
  polyunsaturatedFat: { type: Number, min: 0 },
  transFat: { type: Number, min: 0 },
  omega3: { type: Number, min: 0 },
  omega6: { type: Number, min: 0 },
  
  // Minerals
  sodium: { type: Number, min: 0 },
  potassium: { type: Number, min: 0 },
  calcium: { type: Number, min: 0 },
  magnesium: { type: Number, min: 0 },
  phosphorus: { type: Number, min: 0 },
  iron: { type: Number, min: 0 },
  zinc: { type: Number, min: 0 },
  selenium: { type: Number, min: 0 },
  
  // Vitamins
  vitaminA: { type: Number, min: 0 },
  vitaminC: { type: Number, min: 0 },
  vitaminD: { type: Number, min: 0 },
  vitaminE: { type: Number, min: 0 },
  vitaminK: { type: Number, min: 0 },
  thiamin: { type: Number, min: 0 },
  riboflavin: { type: Number, min: 0 },
  niacin: { type: Number, min: 0 },
  vitaminB6: { type: Number, min: 0 },
  folate: { type: Number, min: 0 },
  vitaminB12: { type: Number, min: 0 },
  biotin: { type: Number, min: 0 },
  pantothenicAcid: { type: Number, min: 0 },
  
  // Additional compounds
  cholesterol: { type: Number, min: 0 },
  creatine: { type: Number, min: 0 },
  
  // Metadata
  confidence: { type: Number, min: 0, max: 1 },
  weightConversion: {
    grams: { type: Number, min: 0 },
    ounces: { type: Number, min: 0 },
    pounds: { type: Number, min: 0 }
  }
}, { _id: false });

const personalFoodSchema = new Schema<IPersonalFood>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true,
    maxlength: [200, 'Food name cannot exceed 200 characters']
  },
  normalizedName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  defaultQuantity: {
    type: Number,
    required: [true, 'Default quantity is required'],
    min: [0.1, 'Quantity must be at least 0.1']
  },
  defaultUnit: {
    type: String,
    required: [true, 'Default unit is required'],
    trim: true
  },
  nutrition: {
    type: nutritionSchema,
    required: true
  },
  
  // User customizations
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  category: {
    type: String,
    trim: true,
    enum: ['breakfast', 'lunch', 'dinner', 'snack', 'protein', 'carbs', 'vegetables', 'fruits', 'dairy', 'beverages', 'other'],
    default: 'other'
  },
  
  // Usage tracking
  timesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date
  },
  
  // Source information
  sourceType: {
    type: String,
    required: true,
    enum: ['ai_analyzed', 'user_created', 'imported']
  },
  originalQuery: {
    type: String,
    trim: true
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      ret.id = ret._id;
      delete ret._id;
      delete ret.__v;
      return ret;
    }
  }
});

// Compound indexes for efficient querying
personalFoodSchema.index({ userId: 1, normalizedName: 1 }, { unique: true });
personalFoodSchema.index({ userId: 1, timesUsed: -1 });
personalFoodSchema.index({ userId: 1, lastUsed: -1 });
personalFoodSchema.index({ userId: 1, isFavorite: -1, timesUsed: -1 });

// Pre-save middleware to normalize name
personalFoodSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.normalizedName = this.name.toLowerCase().trim();
  }
  next();
});

// Static methods for common queries
personalFoodSchema.statics.findByUser = function(userId: string, options: any = {}) {
  const {
    search,
    category,
    favorites = false,
    limit = 20,
    sort = 'timesUsed_desc' // Default to timesUsed_desc, matching one of the new explicit options
  } = options;

  let query = this.find({ userId });

  if (search) {
    const searchRegex = new RegExp(search.toLowerCase(), 'i');
    query = query.find({
      $or: [
        { normalizedName: searchRegex },
        { name: searchRegex } // Keep original name search as well if needed
      ]
    });
  }

  if (category && category !== 'all') { // Explicitly ignore 'all'
    query = query.find({ category });
  }

  if (favorites) {
    query = query.find({ isFavorite: true });
  }

  // Updated sort logic
  switch (sort) {
    case 'name_asc':
      query = query.sort({ normalizedName: 1 });
      break;
    case 'lastUsed_desc':
      query = query.sort({ lastUsed: -1 });
      break;
    case 'timesUsed_desc':
    default: // Default to sorting by timesUsed descending
      query = query.sort({ timesUsed: -1 });
      break;
  }

  return query.limit(limit);
};

// Instance methods
personalFoodSchema.methods.incrementUsage = function() {
  this.timesUsed += 1;
  this.lastUsed = new Date();
  return this.save();
};

personalFoodSchema.methods.toFoodItem = function(customQuantity?: number, customUnit?: string) {
  const quantity = customQuantity || this.defaultQuantity;
  const unit = customUnit || this.defaultUnit;
  
  // Scale nutrition values based on quantity ratio
  const ratio = quantity / this.defaultQuantity;
  
  const scaledNutrition: any = {};
  const nutritionObj = this.nutrition;
  
  // Handle each nutrition field
  if (nutritionObj.calories) scaledNutrition.calories = nutritionObj.calories * ratio;
  if (nutritionObj.protein) scaledNutrition.protein = nutritionObj.protein * ratio;
  if (nutritionObj.carbs) scaledNutrition.carbs = nutritionObj.carbs * ratio;
  if (nutritionObj.fat) scaledNutrition.fat = nutritionObj.fat * ratio;
  if (nutritionObj.fiber) scaledNutrition.fiber = nutritionObj.fiber * ratio;
  if (nutritionObj.sugar) scaledNutrition.sugar = nutritionObj.sugar * ratio;
  if (nutritionObj.saturatedFat) scaledNutrition.saturatedFat = nutritionObj.saturatedFat * ratio;
  if (nutritionObj.monounsaturatedFat) scaledNutrition.monounsaturatedFat = nutritionObj.monounsaturatedFat * ratio;
  if (nutritionObj.polyunsaturatedFat) scaledNutrition.polyunsaturatedFat = nutritionObj.polyunsaturatedFat * ratio;
  if (nutritionObj.transFat) scaledNutrition.transFat = nutritionObj.transFat * ratio;
  if (nutritionObj.omega3) scaledNutrition.omega3 = nutritionObj.omega3 * ratio;
  if (nutritionObj.omega6) scaledNutrition.omega6 = nutritionObj.omega6 * ratio;
  if (nutritionObj.sodium) scaledNutrition.sodium = nutritionObj.sodium * ratio;
  if (nutritionObj.potassium) scaledNutrition.potassium = nutritionObj.potassium * ratio;
  if (nutritionObj.calcium) scaledNutrition.calcium = nutritionObj.calcium * ratio;
  if (nutritionObj.magnesium) scaledNutrition.magnesium = nutritionObj.magnesium * ratio;
  if (nutritionObj.phosphorus) scaledNutrition.phosphorus = nutritionObj.phosphorus * ratio;
  if (nutritionObj.iron) scaledNutrition.iron = nutritionObj.iron * ratio;
  if (nutritionObj.zinc) scaledNutrition.zinc = nutritionObj.zinc * ratio;
  if (nutritionObj.selenium) scaledNutrition.selenium = nutritionObj.selenium * ratio;
  if (nutritionObj.vitaminA) scaledNutrition.vitaminA = nutritionObj.vitaminA * ratio;
  if (nutritionObj.vitaminC) scaledNutrition.vitaminC = nutritionObj.vitaminC * ratio;
  if (nutritionObj.vitaminD) scaledNutrition.vitaminD = nutritionObj.vitaminD * ratio;
  if (nutritionObj.vitaminE) scaledNutrition.vitaminE = nutritionObj.vitaminE * ratio;
  if (nutritionObj.vitaminK) scaledNutrition.vitaminK = nutritionObj.vitaminK * ratio;
  if (nutritionObj.thiamin) scaledNutrition.thiamin = nutritionObj.thiamin * ratio;
  if (nutritionObj.riboflavin) scaledNutrition.riboflavin = nutritionObj.riboflavin * ratio;
  if (nutritionObj.niacin) scaledNutrition.niacin = nutritionObj.niacin * ratio;
  if (nutritionObj.vitaminB6) scaledNutrition.vitaminB6 = nutritionObj.vitaminB6 * ratio;
  if (nutritionObj.folate) scaledNutrition.folate = nutritionObj.folate * ratio;
  if (nutritionObj.vitaminB12) scaledNutrition.vitaminB12 = nutritionObj.vitaminB12 * ratio;
  if (nutritionObj.biotin) scaledNutrition.biotin = nutritionObj.biotin * ratio;
  if (nutritionObj.pantothenicAcid) scaledNutrition.pantothenicAcid = nutritionObj.pantothenicAcid * ratio;
  if (nutritionObj.cholesterol) scaledNutrition.cholesterol = nutritionObj.cholesterol * ratio;
  if (nutritionObj.creatine) scaledNutrition.creatine = nutritionObj.creatine * ratio;
  
  // Handle confidence and weight conversion without scaling
  if (nutritionObj.confidence) scaledNutrition.confidence = nutritionObj.confidence;
  if (nutritionObj.weightConversion) {
    scaledNutrition.weightConversion = {
      grams: nutritionObj.weightConversion.grams ? nutritionObj.weightConversion.grams * ratio : 0,
      ounces: nutritionObj.weightConversion.ounces ? nutritionObj.weightConversion.ounces * ratio : 0,
      pounds: nutritionObj.weightConversion.pounds ? nutritionObj.weightConversion.pounds * ratio : 0
    };
  }

  return {
    name: this.name,
    quantity,
    unit,
    ...scaledNutrition
  };
};

export default mongoose.model<IPersonalFood>('PersonalFood', personalFoodSchema); 