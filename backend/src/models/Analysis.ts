import mongoose, { Document, Schema } from 'mongoose';

export interface IAnalysis extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'nutrition' | 'bloodwork' | 'correlation';
  date: Date;
  insights: string[];
  recommendations: string[];
  confidence: number;
  summary?: string;
  detailedAnalysis?: string;
  llmModel?: string;
  secondOpinionText?: string;
  secondOpinionLlmModel?: string;
  inputData: any; // To store the full input object for the analysis
  nutritionData?: {
    totalCalories: number;
    macronutrients: {
      protein: number;
      carbs: number;
      fat: number;
    };
    period: number; // days
  };
  bloodworkData?: {
    testDate: Date;
    abnormalValues: string[];
    totalValues: number;
  };
  correlationData?: {
    nutritionPeriod: number;
    bloodworkDate: Date;
    correlations: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const analysisSchema = new Schema<IAnalysis>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['nutrition', 'bloodwork', 'correlation']
  },
  date: {
    type: Date,
    required: true,
    default: Date.now
  },
  insights: [{
    type: String,
    required: true,
    trim: true
  }],
  recommendations: [{
    type: String,
    required: true,
    trim: true
  }],
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  },
  summary: {
    type: String,
    trim: true
  },
  detailedAnalysis: {
    type: String,
    trim: true
  },
  llmModel: {
    type: String,
    trim: true
  },
  secondOpinionText: {
    type: String,
    trim: true
  },
  secondOpinionLlmModel: {
    type: String,
    trim: true
  },
  inputData: { // Single, correct definition for inputData
    type: Schema.Types.Mixed,
    required: true
  },
  nutritionData: {
    totalCalories: Number,
    macronutrients: {
      protein: Number,
      carbs: Number,
      fat: Number
    },
    period: Number
  },
  bloodworkData: {
    testDate: Date,
    abnormalValues: [String],
    totalValues: Number
  },
  correlationData: {
    nutritionPeriod: Number,
    bloodworkDate: Date,
    correlations: [String]
  }
}, {
  timestamps: true
});

// Index for efficient queries
analysisSchema.index({ userId: 1, createdAt: -1 });
analysisSchema.index({ userId: 1, type: 1 });
analysisSchema.index({ userId: 1, date: -1 });

export const Analysis = mongoose.model<IAnalysis>('Analysis', analysisSchema); 