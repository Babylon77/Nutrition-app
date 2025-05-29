import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodItem {
  name: string;
  quantity: number;
  unit: string;
  
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

export interface IFoodLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foods: IFoodItem[];
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const foodItemSchema = new Schema<IFoodItem>({
  name: {
    type: String,
    required: [true, 'Food name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [0, 'Quantity must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  
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
  thiamin: { type: Number, min: 0 }, // B1
  riboflavin: { type: Number, min: 0 }, // B2
  niacin: { type: Number, min: 0 }, // B3
  vitaminB6: { type: Number, min: 0 },
  folate: { type: Number, min: 0 }, // B9
  vitaminB12: { type: Number, min: 0 },
  biotin: { type: Number, min: 0 },
  pantothenicAcid: { type: Number, min: 0 }, // B5
  
  // Additional compounds
  cholesterol: { type: Number, min: 0 },
  creatine: { type: Number, min: 0 },
  
  // Metadata
  confidence: { type: Number, min: 0 },
  weightConversion: {
    grams: { type: Number, min: 0 },
    ounces: { type: Number, min: 0 },
    pounds: { type: Number, min: 0 }
  }
});

const foodLogSchema = new Schema<IFoodLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  mealType: {
    type: String,
    required: [true, 'Meal type is required'],
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  },
  foods: [foodItemSchema],
  totalCalories: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProtein: {
    type: Number,
    default: 0,
    min: 0
  },
  totalCarbs: {
    type: Number,
    default: 0,
    min: 0
  },
  totalFat: {
    type: Number,
    default: 0,
    min: 0
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Calculate totals before saving
foodLogSchema.pre('save', function(next) {
  this.totalCalories = this.foods.reduce((total, food) => total + (food.calories || 0), 0);
  this.totalProtein = this.foods.reduce((total, food) => total + (food.protein || 0), 0);
  this.totalCarbs = this.foods.reduce((total, food) => total + (food.carbs || 0), 0);
  this.totalFat = this.foods.reduce((total, food) => total + (food.fat || 0), 0);
  next();
});

// Index for efficient queries
foodLogSchema.index({ userId: 1, date: 1 });
foodLogSchema.index({ userId: 1, mealType: 1 });

export const FoodLog = mongoose.model<IFoodLog>('FoodLog', foodLogSchema); 