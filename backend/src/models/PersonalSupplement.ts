import mongoose, { Document, Schema } from 'mongoose';

// Supplement content interface - focused on what supplements typically contain
export interface ISupplementContent {
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
  
  // Metadata
  confidence?: number;
}

export interface IPersonalSupplement extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string; // For searching/matching
  brand?: string;
  defaultDosage: number;
  defaultUnit: string;
  form: 'capsule' | 'tablet' | 'liquid' | 'powder' | 'gummy' | 'injection' | 'patch' | 'other';
  content: ISupplementContent;
  
  // Supplement specific fields
  activeIngredients?: string[];
  isPreScription?: boolean;
  medicationClass?: string;
  
  // User customizations
  notes?: string;
  instructions?: string; // "Take with food", etc.
  isFavorite?: boolean;
  category?: string; // 'vitamin', 'mineral', 'protein', 'medication', etc.
  
  // Usage tracking
  timesUsed: number;
  lastUsed?: Date;
  
  // Source information
  sourceType: 'ai_analyzed' | 'user_created' | 'imported';
  originalQuery?: string; // If from AI analysis
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  incrementUsage(): Promise<IPersonalSupplement>;
  toSupplementItem(customDosage?: number, customUnit?: string): any;
}

const supplementContentSchema = new Schema<ISupplementContent>({
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
  
  // Metadata
  confidence: { type: Number, min: 0, max: 1 }
}, { _id: false });

const personalSupplementSchema = new Schema<IPersonalSupplement>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  name: {
    type: String,
    required: [true, 'Supplement name is required'],
    trim: true,
    maxlength: [200, 'Supplement name cannot exceed 200 characters']
  },
  normalizedName: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true
  },
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  defaultDosage: {
    type: Number,
    required: [true, 'Default dosage is required'],
    min: [0.1, 'Dosage must be at least 0.1']
  },
  defaultUnit: {
    type: String,
    required: [true, 'Default unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  form: {
    type: String,
    required: [true, 'Form is required'],
    enum: ['capsule', 'tablet', 'liquid', 'powder', 'gummy', 'injection', 'patch', 'other'],
    default: 'capsule'
  },
  content: {
    type: supplementContentSchema,
    required: true
  },
  
  // Supplement specific fields
  activeIngredients: [{
    type: String,
    trim: true,
    maxlength: [100, 'Active ingredient name cannot exceed 100 characters']
  }],
  isPreScription: { 
    type: Boolean, 
    default: false,
    index: true 
  },
  medicationClass: {
    type: String,
    trim: true,
    maxlength: [50, 'Medication class cannot exceed 50 characters']
  },
  
  // User customizations
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  },
  instructions: {
    type: String,
    trim: true,
    maxlength: [200, 'Instructions cannot exceed 200 characters']
  },
  isFavorite: {
    type: Boolean,
    default: false,
    index: true
  },
  category: {
    type: String,
    trim: true,
    enum: ['vitamin', 'mineral', 'protein', 'omega', 'probiotic', 'medication', 'herb', 'other'],
    default: 'other',
    index: true
  },
  
  // Usage tracking
  timesUsed: {
    type: Number,
    default: 0,
    min: 0
  },
  lastUsed: {
    type: Date,
    index: true
  },
  
  // Source information
  sourceType: {
    type: String,
    enum: ['ai_analyzed', 'user_created', 'imported'],
    required: true,
    default: 'user_created'
  },
  originalQuery: {
    type: String,
    trim: true,
    maxlength: [500, 'Original query cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
personalSupplementSchema.index({ userId: 1, normalizedName: 1 });
personalSupplementSchema.index({ userId: 1, category: 1 });
personalSupplementSchema.index({ userId: 1, isFavorite: 1, lastUsed: -1 });
personalSupplementSchema.index({ userId: 1, timesUsed: -1 });

// Text search index
personalSupplementSchema.index({
  name: 'text',
  brand: 'text',
  'activeIngredients': 'text'
});

// Instance method to increment usage
personalSupplementSchema.methods.incrementUsage = async function(this: IPersonalSupplement): Promise<IPersonalSupplement> {
  this.timesUsed += 1;
  this.lastUsed = new Date();
  return this.save();
};

// Instance method to convert to supplement item
personalSupplementSchema.methods.toSupplementItem = function(
  this: IPersonalSupplement,
  customDosage?: number,
  customUnit?: string
) {
  return {
    name: this.name,
    brand: this.brand,
    dosage: customDosage || this.defaultDosage,
    unit: customUnit || this.defaultUnit,
    form: this.form,
    activeIngredients: this.activeIngredients,
    isPreScription: this.isPreScription,
    medicationClass: this.medicationClass,
    instructions: this.instructions,
    notes: this.notes,
    
    // Copy all content fields directly
    calories: this.content.calories,
    vitaminA: this.content.vitaminA,
    vitaminC: this.content.vitaminC,
    vitaminD: this.content.vitaminD,
    vitaminE: this.content.vitaminE,
    vitaminK: this.content.vitaminK,
    thiamin: this.content.thiamin,
    riboflavin: this.content.riboflavin,
    niacin: this.content.niacin,
    vitaminB6: this.content.vitaminB6,
    folate: this.content.folate,
    vitaminB12: this.content.vitaminB12,
    biotin: this.content.biotin,
    pantothenicAcid: this.content.pantothenicAcid,
    calcium: this.content.calcium,
    magnesium: this.content.magnesium,
    iron: this.content.iron,
    zinc: this.content.zinc,
    selenium: this.content.selenium,
    potassium: this.content.potassium,
    phosphorus: this.content.phosphorus,
    sodium: this.content.sodium,
    omega3: this.content.omega3,
    omega6: this.content.omega6,
    creatine: this.content.creatine,
    coq10: this.content.coq10,
    probioticCFU: this.content.probioticCFU,
    
    confidence: this.content.confidence
  };
};

// Pre-save middleware to normalize name
personalSupplementSchema.pre('save', function(next) {
  if (this.isModified('name')) {
    this.normalizedName = this.name.toLowerCase().trim();
  }
  next();
});

export const PersonalSupplement = mongoose.model<IPersonalSupplement>('PersonalSupplement', personalSupplementSchema); 