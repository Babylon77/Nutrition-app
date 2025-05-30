import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplementRegimen extends Document {
  userId: mongoose.Types.ObjectId;
  name: string;
  brand?: string;
  dosage: number;
  unit: string;
  form: 'capsule' | 'tablet' | 'liquid' | 'powder' | 'gummy' | 'injection' | 'patch' | 'other';
  
  // Frequency settings
  frequency: 'daily' | 'twice_daily' | 'three_times_daily' | 'weekly' | 'as_needed' | 'custom';
  timesPerDay?: number; // For custom frequency
  daysPerWeek?: number; // For weekly/custom frequency
  timeOfDay: ('morning' | 'afternoon' | 'evening' | 'night' | 'with_meal')[];
  
  // Active period
  startDate: Date;
  endDate?: Date; // Optional - for courses/temporary supplements
  isActive: boolean;
  
  // Instructions and metadata
  instructions?: string;
  notes?: string;
  prescribedBy?: string; // Doctor name
  isPreScription?: boolean;
  medicationClass?: string;
  
  // Usage tracking
  totalDosesTaken: number;
  lastTaken?: Date;
  
  // Supplement content (for analysis)
  content?: {
    vitaminA?: number;
    vitaminC?: number;
    vitaminD?: number;
    vitaminE?: number;
    vitaminK?: number;
    thiamin?: number;
    riboflavin?: number;
    niacin?: number;
    vitaminB6?: number;
    folate?: number;
    vitaminB12?: number;
    biotin?: number;
    pantothenicAcid?: number;
    calcium?: number;
    magnesium?: number;
    iron?: number;
    zinc?: number;
    selenium?: number;
    potassium?: number;
    phosphorus?: number;
    sodium?: number;
    omega3?: number;
    omega6?: number;
    creatine?: number;
    coq10?: number;
    probioticCFU?: number;
    confidence?: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  markTaken(date?: Date): Promise<ISupplementRegimen>;
  getNextDoseTime(): Date | null;
  isScheduledForToday(): boolean;
  getDosesForDateRange(startDate: Date, endDate: Date): any[];
}

const supplementRegimenSchema = new Schema<ISupplementRegimen>({
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
  brand: {
    type: String,
    trim: true,
    maxlength: [100, 'Brand name cannot exceed 100 characters']
  },
  dosage: {
    type: Number,
    required: [true, 'Dosage is required'],
    min: [0.1, 'Dosage must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    maxlength: [20, 'Unit cannot exceed 20 characters']
  },
  form: {
    type: String,
    required: [true, 'Form is required'],
    enum: ['capsule', 'tablet', 'liquid', 'powder', 'gummy', 'injection', 'patch', 'other'],
    default: 'capsule'
  },
  
  // Frequency settings
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['daily', 'twice_daily', 'three_times_daily', 'weekly', 'as_needed', 'custom'],
    default: 'daily'
  },
  timesPerDay: {
    type: Number,
    min: 1,
    max: 10,
    default: 1
  },
  daysPerWeek: {
    type: Number,
    min: 1,
    max: 7,
    default: 7
  },
  timeOfDay: [{
    type: String,
    enum: ['morning', 'afternoon', 'evening', 'night', 'with_meal'],
    default: ['morning']
  }],
  
  // Active period
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    validate: {
      validator: function(this: ISupplementRegimen, value: Date) {
        return !value || value > this.startDate;
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    index: true
  },
  
  // Instructions and metadata
  instructions: {
    type: String,
    trim: true,
    maxlength: [500, 'Instructions cannot exceed 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  prescribedBy: {
    type: String,
    trim: true,
    maxlength: [100, 'Prescriber name cannot exceed 100 characters']
  },
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
  
  // Usage tracking
  totalDosesTaken: {
    type: Number,
    default: 0,
    min: 0
  },
  lastTaken: {
    type: Date,
    index: true
  },
  
  // Supplement content
  content: {
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
    calcium: { type: Number, min: 0 },
    magnesium: { type: Number, min: 0 },
    iron: { type: Number, min: 0 },
    zinc: { type: Number, min: 0 },
    selenium: { type: Number, min: 0 },
    potassium: { type: Number, min: 0 },
    phosphorus: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 },
    omega3: { type: Number, min: 0 },
    omega6: { type: Number, min: 0 },
    creatine: { type: Number, min: 0 },
    coq10: { type: Number, min: 0 },
    probioticCFU: { type: Number, min: 0 },
    confidence: { type: Number, min: 0, max: 1 }
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
supplementRegimenSchema.index({ userId: 1, isActive: 1 });
supplementRegimenSchema.index({ userId: 1, startDate: 1, endDate: 1 });
supplementRegimenSchema.index({ userId: 1, frequency: 1 });

// Instance method to mark a dose as taken
supplementRegimenSchema.methods.markTaken = async function(this: ISupplementRegimen, date?: Date): Promise<ISupplementRegimen> {
  this.totalDosesTaken += 1;
  this.lastTaken = date || new Date();
  return this.save();
};

// Instance method to get next scheduled dose time
supplementRegimenSchema.methods.getNextDoseTime = function(this: ISupplementRegimen): Date | null {
  if (!this.isActive) return null;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Simple logic - can be enhanced based on specific time scheduling
  switch (this.frequency) {
    case 'daily':
      return new Date(today.getTime() + 24 * 60 * 60 * 1000); // Tomorrow
    case 'twice_daily':
      // Return next 12-hour interval
      return new Date(now.getTime() + 12 * 60 * 60 * 1000);
    case 'weekly':
      return new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // Next week
    default:
      return null;
  }
};

// Instance method to check if scheduled for today
supplementRegimenSchema.methods.isScheduledForToday = function(this: ISupplementRegimen): boolean {
  if (!this.isActive) return false;
  
  const now = new Date();
  
  // Check if we're within the active period
  if (now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  
  // Check frequency
  switch (this.frequency) {
    case 'daily':
    case 'twice_daily':
    case 'three_times_daily':
      return true;
    case 'weekly':
      // Check if today is the right day of the week (can be enhanced)
      return now.getDay() === this.startDate.getDay();
    case 'as_needed':
      return false; // User decides when to take
    default:
      return false;
  }
};

// Instance method to get doses for date range (for analysis)
supplementRegimenSchema.methods.getDosesForDateRange = function(
  this: ISupplementRegimen, 
  startDate: Date, 
  endDate: Date
): any[] {
  const doses = [];
  const current = new Date(Math.max(startDate.getTime(), this.startDate.getTime()));
  const end = this.endDate ? new Date(Math.min(endDate.getTime(), this.endDate.getTime())) : endDate;
  
  while (current <= end) {
    if (this.isScheduledForToday.call({ ...this, startDate: current } as any)) {
      const timesPerDay = this.frequency === 'daily' ? 1 : 
                         this.frequency === 'twice_daily' ? 2 :
                         this.frequency === 'three_times_daily' ? 3 : 1;
      
      for (let i = 0; i < timesPerDay; i++) {
        doses.push({
          date: new Date(current),
          supplement: {
            name: this.name,
            brand: this.brand,
            dosage: this.dosage,
            unit: this.unit,
            form: this.form,
            content: this.content
          },
          timeOfDay: this.timeOfDay[i] || this.timeOfDay[0] || 'morning'
        });
      }
    }
    current.setDate(current.getDate() + 1);
  }
  
  return doses;
};

export const SupplementRegimen = mongoose.model<ISupplementRegimen>('SupplementRegimen', supplementRegimenSchema); 