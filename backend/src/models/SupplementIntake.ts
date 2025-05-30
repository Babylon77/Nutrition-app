import mongoose, { Document, Schema } from 'mongoose';

export interface ISupplementIntake extends Document {
  userId: mongoose.Types.ObjectId;
  regimenId: mongoose.Types.ObjectId; // References SupplementRegimen
  
  // When it was taken
  dateTaken: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'with_meal' | 'other';
  
  // What was taken (snapshot from regimen at time of intake)
  supplementName: string;
  brand?: string;
  dosage: number;
  unit: string;
  form: string;
  
  // Optional intake details
  actualDosage?: number; // If different from prescribed
  notes?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const supplementIntakeSchema = new Schema<ISupplementIntake>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    index: true
  },
  regimenId: {
    type: Schema.Types.ObjectId,
    ref: 'SupplementRegimen',
    required: [true, 'Regimen ID is required'],
    index: true
  },
  
  // When it was taken
  dateTaken: {
    type: Date,
    required: [true, 'Date taken is required'],
    index: true
  },
  timeOfDay: {
    type: String,
    required: [true, 'Time of day is required'],
    enum: ['morning', 'afternoon', 'evening', 'night', 'with_meal', 'other'],
    index: true
  },
  
  // What was taken (snapshot)
  supplementName: {
    type: String,
    required: [true, 'Supplement name is required'],
    trim: true
  },
  brand: {
    type: String,
    trim: true
  },
  dosage: {
    type: Number,
    required: [true, 'Dosage is required'],
    min: [0.1, 'Dosage must be positive']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  form: {
    type: String,
    required: [true, 'Form is required'],
    trim: true
  },
  
  // Optional intake details
  actualDosage: {
    type: Number,
    min: [0.1, 'Actual dosage must be positive']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [500, 'Notes cannot exceed 500 characters']
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
supplementIntakeSchema.index({ userId: 1, dateTaken: -1 });
supplementIntakeSchema.index({ userId: 1, regimenId: 1, dateTaken: -1 });
supplementIntakeSchema.index({ userId: 1, timeOfDay: 1, dateTaken: -1 });

export const SupplementIntake = mongoose.model<ISupplementIntake>('SupplementIntake', supplementIntakeSchema); 