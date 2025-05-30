import 'express-session';

declare module 'express-session' {
  interface SessionData {
    foodQueue?: Array<{
      id: string;
      name: string;
      quantity: number;
      unit: string;
      mealType: string;
      isPersonalFood: boolean;
      personalFoodId?: string;
      status: 'ready' | 'needs_analysis';
    }>;
  }
} 