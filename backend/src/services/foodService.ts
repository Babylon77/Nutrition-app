import { logger } from '../utils/logger';

export interface FoodNutrition {
  _id?: string;
  name: string;
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
  vitaminB12?: number;
  folate?: number;
  servingSize: string;
  servingUnit: string;
}

interface FoodNutritionBase {
  name: string;
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
  vitaminB12?: number;
  folate?: number;
  servingSize: string;
  servingUnit: string;
}

// Static food database - in production, this would be replaced with USDA API or database
const FOOD_DATABASE: FoodNutritionBase[] = [
  // Proteins
  {
    name: "Chicken Breast",
    calories: 165,
    protein: 31,
    carbs: 0,
    fat: 3.6,
    fiber: 0,
    sodium: 74,
    potassium: 256,
    calcium: 15,
    iron: 0.9,
    vitaminB12: 0.3,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Salmon",
    calories: 208,
    protein: 22,
    carbs: 0,
    fat: 12,
    fiber: 0,
    sodium: 59,
    potassium: 363,
    calcium: 12,
    iron: 0.8,
    vitaminD: 11,
    vitaminB12: 3.2,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Eggs",
    calories: 155,
    protein: 13,
    carbs: 1.1,
    fat: 11,
    fiber: 0,
    sodium: 124,
    potassium: 138,
    calcium: 56,
    iron: 1.8,
    vitaminD: 2,
    vitaminB12: 0.9,
    folate: 47,
    servingSize: "100",
    servingUnit: "g"
  },
  
  // Carbohydrates
  {
    name: "Brown Rice",
    calories: 111,
    protein: 2.6,
    carbs: 23,
    fat: 0.9,
    fiber: 1.8,
    sodium: 5,
    potassium: 43,
    calcium: 23,
    iron: 1.5,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Quinoa",
    calories: 120,
    protein: 4.4,
    carbs: 22,
    fat: 1.9,
    fiber: 2.8,
    sodium: 7,
    potassium: 172,
    calcium: 17,
    iron: 1.5,
    folate: 42,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Sweet Potato",
    calories: 86,
    protein: 1.6,
    carbs: 20,
    fat: 0.1,
    fiber: 3,
    sugar: 4.2,
    sodium: 54,
    potassium: 337,
    calcium: 30,
    iron: 0.6,
    vitaminC: 2.4,
    servingSize: "100",
    servingUnit: "g"
  },
  
  // Vegetables
  {
    name: "Broccoli",
    calories: 34,
    protein: 2.8,
    carbs: 7,
    fat: 0.4,
    fiber: 2.6,
    sugar: 1.5,
    sodium: 33,
    potassium: 316,
    calcium: 47,
    iron: 0.7,
    vitaminC: 89,
    folate: 63,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Spinach",
    calories: 23,
    protein: 2.9,
    carbs: 3.6,
    fat: 0.4,
    fiber: 2.2,
    sodium: 79,
    potassium: 558,
    calcium: 99,
    iron: 2.7,
    vitaminC: 28,
    folate: 194,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Carrots",
    calories: 41,
    protein: 0.9,
    carbs: 10,
    fat: 0.2,
    fiber: 2.8,
    sugar: 4.7,
    sodium: 69,
    potassium: 320,
    calcium: 33,
    iron: 0.3,
    vitaminC: 5.9,
    servingSize: "100",
    servingUnit: "g"
  },
  
  // Fruits
  {
    name: "Apple",
    calories: 52,
    protein: 0.3,
    carbs: 14,
    fat: 0.2,
    fiber: 2.4,
    sugar: 10,
    sodium: 1,
    potassium: 107,
    calcium: 6,
    iron: 0.1,
    vitaminC: 4.6,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Banana",
    calories: 89,
    protein: 1.1,
    carbs: 23,
    fat: 0.3,
    fiber: 2.6,
    sugar: 12,
    sodium: 1,
    potassium: 358,
    calcium: 5,
    iron: 0.3,
    vitaminC: 8.7,
    folate: 20,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Blueberries",
    calories: 57,
    protein: 0.7,
    carbs: 14,
    fat: 0.3,
    fiber: 2.4,
    sugar: 10,
    sodium: 1,
    potassium: 77,
    calcium: 6,
    iron: 0.3,
    vitaminC: 9.7,
    servingSize: "100",
    servingUnit: "g"
  },
  
  // Dairy
  {
    name: "Greek Yogurt",
    calories: 59,
    protein: 10,
    carbs: 3.6,
    fat: 0.4,
    sugar: 3.6,
    sodium: 36,
    potassium: 141,
    calcium: 110,
    iron: 0.1,
    vitaminB12: 0.5,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Milk",
    calories: 42,
    protein: 3.4,
    carbs: 5,
    fat: 1,
    sugar: 5,
    sodium: 44,
    potassium: 150,
    calcium: 113,
    iron: 0.03,
    vitaminD: 1.3,
    vitaminB12: 0.5,
    servingSize: "100",
    servingUnit: "ml"
  },
  
  // Nuts and Seeds
  {
    name: "Almonds",
    calories: 579,
    protein: 21,
    carbs: 22,
    fat: 50,
    fiber: 12,
    sodium: 1,
    potassium: 733,
    calcium: 269,
    iron: 3.7,
    vitaminC: 0,
    servingSize: "100",
    servingUnit: "g"
  },
  {
    name: "Chia Seeds",
    calories: 486,
    protein: 17,
    carbs: 42,
    fat: 31,
    fiber: 34,
    sodium: 16,
    potassium: 407,
    calcium: 631,
    iron: 7.7,
    servingSize: "100",
    servingUnit: "g"
  }
];

class FoodService {
  searchFood(query: string, limit: number = 10): FoodNutrition[] {
    const searchTerm = query.toLowerCase().trim();
    
    let results: any[];
    if (!searchTerm) {
      results = FOOD_DATABASE.slice(0, limit);
    } else {
      // Search by name (fuzzy matching)
      results = FOOD_DATABASE.filter(food => 
        food.name.toLowerCase().includes(searchTerm)
      );
      
      // Sort by relevance (exact matches first, then partial matches)
      results.sort((a, b) => {
        const aExact = a.name.toLowerCase() === searchTerm;
        const bExact = b.name.toLowerCase() === searchTerm;
        
        if (aExact && !bExact) return -1;
        if (!aExact && bExact) return 1;
        
        const aStarts = a.name.toLowerCase().startsWith(searchTerm);
        const bStarts = b.name.toLowerCase().startsWith(searchTerm);
        
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        
        return a.name.localeCompare(b.name);
      });
      
      results = results.slice(0, limit);
    }
    
    // Add _id field based on name (for compatibility with frontend)
    return results.map(food => ({
      ...food,
      _id: food.name.toLowerCase().replace(/\s+/g, '-')
    }));
  }
  
  getFoodByName(name: string): FoodNutrition | null {
    const food = FOOD_DATABASE.find(food => 
      food.name.toLowerCase() === name.toLowerCase()
    );
    
    return food || null;
  }
  
  calculateNutrition(foodName: string, quantity: number, unit: string): Partial<FoodNutrition> | null {
    const food = this.getFoodByName(foodName);
    
    if (!food) {
      return null;
    }
    
    // Convert quantity to the food's serving size unit
    const conversionFactor = this.getConversionFactor(unit, food.servingUnit, quantity, parseFloat(food.servingSize));
    
    if (conversionFactor === null) {
      logger.warn(`Cannot convert ${unit} to ${food.servingUnit} for ${foodName}`);
      return null;
    }
    
    // Calculate nutrition values based on quantity
    const multiplier = conversionFactor;
    
    return {
      name: food.name,
      calories: Math.round(food.calories * multiplier),
      protein: Math.round(food.protein * multiplier * 10) / 10,
      carbs: Math.round(food.carbs * multiplier * 10) / 10,
      fat: Math.round(food.fat * multiplier * 10) / 10,
      fiber: food.fiber ? Math.round(food.fiber * multiplier * 10) / 10 : undefined,
      sugar: food.sugar ? Math.round(food.sugar * multiplier * 10) / 10 : undefined,
      sodium: food.sodium ? Math.round(food.sodium * multiplier) : undefined,
      potassium: food.potassium ? Math.round(food.potassium * multiplier) : undefined,
      calcium: food.calcium ? Math.round(food.calcium * multiplier) : undefined,
      iron: food.iron ? Math.round(food.iron * multiplier * 10) / 10 : undefined,
      vitaminC: food.vitaminC ? Math.round(food.vitaminC * multiplier * 10) / 10 : undefined,
      vitaminD: food.vitaminD ? Math.round(food.vitaminD * multiplier * 10) / 10 : undefined,
      vitaminB12: food.vitaminB12 ? Math.round(food.vitaminB12 * multiplier * 10) / 10 : undefined,
      folate: food.folate ? Math.round(food.folate * multiplier) : undefined,
      servingSize: quantity.toString(),
      servingUnit: unit
    };
  }
  
  private getConversionFactor(fromUnit: string, toUnit: string, quantity: number, baseQuantity: number): number | null {
    // Normalize units
    const from = fromUnit.toLowerCase().trim();
    const to = toUnit.toLowerCase().trim();
    
    // If units are the same, calculate ratio
    if (from === to) {
      return quantity / baseQuantity;
    }
    
    // Common conversions
    const conversions: { [key: string]: { [key: string]: number } } = {
      'g': {
        'kg': 1000,
        'oz': 28.35,
        'lb': 453.6,
        'cup': 240, // approximate for most foods
        'tbsp': 15,
        'tsp': 5
      },
      'ml': {
        'l': 1000,
        'cup': 240,
        'fl oz': 29.57,
        'tbsp': 15,
        'tsp': 5
      }
    };
    
    // Try direct conversion
    if (conversions[to] && conversions[to][from]) {
      return quantity / (baseQuantity / conversions[to][from]);
    }
    
    if (conversions[from] && conversions[from][to]) {
      return (quantity * conversions[from][to]) / baseQuantity;
    }
    
    // Default to 1:1 ratio if no conversion found
    logger.warn(`No conversion found from ${from} to ${to}, using 1:1 ratio`);
    return quantity / baseQuantity;
  }
  
  getAllFoods(): FoodNutrition[] {
    return [...FOOD_DATABASE];
  }
  
  getFoodCategories(): string[] {
    return [
      'Proteins',
      'Carbohydrates', 
      'Vegetables',
      'Fruits',
      'Dairy',
      'Nuts and Seeds',
      'Beverages',
      'Snacks'
    ];
  }
}

export const foodService = new FoodService(); 