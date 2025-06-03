export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  height?: number;
  weight?: number;
  weightGoal?: number;
  weightGoalTimeframe?: number;
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  healthGoals?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Food {
  _id: string;
  name: string;
  brand?: string;
  category: string;
  nutritionPer100g: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    potassium?: number;
    calcium?: number;
    iron?: number;
    vitaminC?: number;
    vitaminD?: number;
  };
}

export interface FoodLogEntry {
  _id: string;
  userId: string;
  date: Date;
  meals: {
    breakfast: FoodItem[];
    lunch: FoodItem[];
    dinner: FoodItem[];
    snacks: FoodItem[];
  };
  totalNutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface FoodItem {
  food: Food;
  quantity: number;
  unit: string;
  nutrition: {
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

export interface BloodworkEntry {
  _id: string;
  userId: string;
  date: Date;
  source: 'pdf' | 'manual';
  filename?: string;
  labValues: LabValue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface LabValue {
  name: string;
  value: number;
  unit: string;
  referenceRange?: string;
  category?: 'lipids' | 'glucose' | 'liver' | 'kidney' | 'thyroid' | 'vitamins' | 'minerals' | 'other';
  status?: 'normal' | 'low' | 'high' | 'critical';
  isAbnormal?: boolean;
}

export interface Analysis {
  _id: string;
  userId: string;
  type: 'nutrition' | 'bloodwork' | 'correlation';
  date: Date;
  data: any;
  inputData?: any;
  insights: string[];
  recommendations: string[];
  summary?: string;
  detailedAnalysis?: string;
  llmModel?: string;
  secondOpinionText?: string;
  secondOpinionLlmModel?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
  loading: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  confirmPassword?: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  height?: number; // Stored in cm (backend), but UI should handle feet/inches conversion
  weight?: number; // Stored in kg (backend), but UI should handle lbs conversion
  weightGoal?: number; // Target weight in pounds (US units)
  weightGoalTimeframe?: number; // Timeframe in weeks
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  healthGoals?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
}

export interface LoginData {
  email: string;
  password: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface NutritionSummary {
  totalCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
  totalFiber: number;
  averageCalories: number;
  daysLogged: number;
  goalCalories?: number;
  suggestedCalories?: number;
  goalProtein?: number;
  goalCarbs?: number;
  goalFat?: number;
}

export interface SupplementItem {
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

export interface SupplementLog {
  _id: string;
  userId: string;
  date: Date;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'with_meal' | 'other';
  supplements: SupplementItem[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalSupplement {
  _id: string;
  userId: string;
  name: string;
  normalizedName: string;
  brand?: string;
  defaultDosage: number;
  defaultUnit: string;
  form: 'capsule' | 'tablet' | 'liquid' | 'powder' | 'gummy' | 'injection' | 'patch' | 'other';
  content: SupplementContent;
  
  // Supplement specific fields
  activeIngredients?: string[];
  isPreScription?: boolean;
  medicationClass?: string;
  
  // User customizations
  notes?: string;
  instructions?: string; // "Take with food", etc.
  isFavorite?: boolean;
  category?: 'vitamin' | 'mineral' | 'protein' | 'omega' | 'probiotic' | 'medication' | 'herb' | 'other';
  
  // Usage tracking
  timesUsed: number;
  lastUsed?: Date;
  
  // Source information
  sourceType: 'ai_analyzed' | 'user_created' | 'imported';
  originalQuery?: string; // If from AI analysis
  
  createdAt: Date;
  updatedAt: Date;
}

export interface SupplementContent {
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