import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplementItem {
  name: string;
  brand?: string;
  dosage: number;
  unit: string; // mg, mcg, IU, capsules, tablets, ml, etc.
  
  // Supplement specific fields
  form?: 'capsule' | 'tablet' | 'liquid' | 'powder' | 'gummy' | 'injection' | 'patch' | 'other';
  activeIngredients?: string[]; // ['Vitamin D3', 'K2', etc.]
  
  // Nutritional content (if applicable)
  calories?: number;
  
  // Vitamins (if supplement contains them)
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
  
  // Minerals (if supplement contains them)
  calcium?: number;
  magnesium?: number;
  iron?: number;
  zinc?: number;
  selenium?: number;
  potassium?: number;
  phosphorus?: number;
  sodium?: number;
  
  // Common supplement compounds
  omega3?: number;
  omega6?: number;
  creatine?: number;
  coq10?: number;
  probioticCFU?: number; // Colony Forming Units for probiotics
  
  // Medication specific fields
  isPreScription?: boolean;
  medicationClass?: string; // 'statin', 'blood_pressure', 'diabetes', etc.
  
  // Timing and instructions
  instructions?: string; // "Take with food", "Take on empty stomach", etc.
  notes?: string;
  
  // Metadata
  confidence?: number; // AI analysis confidence
}

export interface ISupplementLog extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'with_meal' | 'other';
  supplements: ISupplementItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const supplementItemSchema = new Schema<ISupplementItem>({
  name: {
    type: String,
    required: [true, 'Supplement name is required'],
    trim: true,
    maxlength: [200, 'Supplement name cannot exceed 200 characters']
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  dosage: {
    type: Number,
    required: [true, 'Dosage is required'],
    min: [0, 'Dosage must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  
  // Supplement specific fields
  form: {
    type: String,
    enum: ['capsule', 'tablet', 'liquid', 'powder', 'gummy', 'injection', 'patch', 'other'],
    default: 'capsule'
  },
  activeIngredients: [{
    type: String,
    trim: true,
    maxlength: [100, 'Active ingredient name cannot exceed 100 characters']
  }],
  
  // Nutritional content
  calories: { type: Number, min: 0 },
  
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
  
  // Minerals
  calcium: { type: Number, min: 0 },
  magnesium: { type: Number, min: 0 },
  iron: { type: Number, min: 0 },
  zinc: { type: Number, min: 0 },
  selenium: { type: Number, min: 0 },
  potassium: { type: Number, min: 0 },
  phosphorus: { type: Number, min: 0 },
  sodium: { type: Number, min: 0 },
  
  // Common supplement compounds
  omega3: { type: Number, min: 0 },
  omega6: { type: Number, min: 0 },
  creatine: { type: Number, min: 0 },
  coq10: { type: Number, min: 0 },
  probioticCFU: { type: Number, min: 0 },
  
  // Medication specific fields
  isPreScription: { type: Boolean, default: false },
  medicationClass: {
    type: String,
    trim: true,
    maxlength: [50, 'Medication class cannot exceed 50 characters']
  },
  
  // Instructions and notes
  instructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Instructions cannot exceed 200 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [300, 'Notes cannot exceed 300 characters']
  },
  
  // Metadata
  confidence: { type: Number, min: 0, max: 1 }
});

const supplementLogSchema = new Schema<ISupplementLog>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  timeOfDay: {
    type: String,
    required: [true, 'Time of day is required'],
    enum: ['morning', 'afternoon', 'evening', 'night', 'with_meal', 'other'],
    default: 'morning'
  },
  supplements: [supplementItemSchema],
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
supplementLogSchema.index({ userId: 1, date: 1 });
supplementLogSchema.index({ userId: 1, timeOfDay: 1 });
supplementLogSchema.index({ userId: 1, date: 1, timeOfDay: 1 });

export const SupplementLog = mongoose.model<ISupplementLog>('SupplementLog', supplementLogSchema); 