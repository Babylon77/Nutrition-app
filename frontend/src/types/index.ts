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
  insights: string[];
  recommendations: string[];
  summary?: string;
  detailedAnalysis?: string;
  llmModel?: string;
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
  height?: number;
  weight?: number;
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