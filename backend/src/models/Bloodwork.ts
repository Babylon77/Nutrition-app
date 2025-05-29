import mongoose, { Document, Schema } from 'mongoose';

export interface ILabValue {
  name: string;
  value: number;
  unit: string;
  referenceRange?: string;
  status?: 'normal' | 'low' | 'high' | 'critical';
}

export interface IBloodwork extends Document {
  userId: mongoose.Types.ObjectId;
  testDate: Date;
  labName?: string;
  doctorName?: string;
  uploadedFile?: {
    filename: string;
    originalName: string;
    path: string;
    size: number;
    mimetype: string;
  };
  labValues: ILabValue[];
  parsedText?: string;
  isManualEntry: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const labValueSchema = new Schema<ILabValue>({
  name: {
    type: String,
    required: [true, 'Lab value name is required'],
    trim: true
  },
  value: {
    type: Number,
    required: [true, 'Lab value is required']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true
  },
  referenceRange: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['normal', 'low', 'high', 'critical']
  }
});

const bloodworkSchema = new Schema<IBloodwork>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  testDate: {
    type: Date,
    required: [true, 'Test date is required']
  },
  labName: {
    type: String,
    trim: true,
    maxlength: [100, 'Lab name cannot exceed 100 characters']
  },
  doctorName: {
    type: String,
    trim: true,
    maxlength: [100, 'Doctor name cannot exceed 100 characters']
  },
  uploadedFile: {
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    mimetype: String
  },
  labValues: [labValueSchema],
  parsedText: {
    type: String
  },
  isManualEntry: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Index for efficient queries
bloodworkSchema.index({ userId: 1, testDate: -1 });
bloodworkSchema.index({ userId: 1, 'labValues.name': 1 });

export const Bloodwork = mongoose.model<IBloodwork>('Bloodwork', bloodworkSchema); 