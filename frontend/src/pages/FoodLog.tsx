import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  MenuItem,
  Stack,
  LinearProgress,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  LocalDining as LocalDiningIcon,
  Coffee as CoffeeIcon,
  Fastfood as FastFoodIcon,
  RoomService as DinnerIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  RemoveCircleOutline as RemoveCircleOutlineIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { SmartFoodEntry } from '../components/SmartFoodEntry';
import CompactNutritionSummary from '../components/visualizations/CompactNutritionSummary'; // Import the new component
import { useAuth } from '../contexts/AuthContext'; // Added import
import { User } from '../types'; // Added import for User type

interface EnhancedNutrition {
  // Macronutrients
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugar: number;
  
  // Fat breakdown
  saturatedFat: number;
  monounsaturatedFat: number;
  polyunsaturatedFat: number;
  transFat: number;
  omega3: number;
  omega6: number;
  
  // Minerals
  sodium: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  phosphorus: number;
  iron: number;
  zinc: number;
  selenium: number;
  
  // Vitamins
  vitaminA: number;
  vitaminC: number;
  vitaminD: number;
  vitaminE: number;
  vitaminK: number;
  thiamin: number; // B1
  riboflavin: number; // B2
  niacin: number; // B3
  vitaminB6: number;
  folate: number; // B9
  vitaminB12: number;
  biotin: number;
  pantothenicAcid: number; // B5
  
  // Additional compounds
  cholesterol: number;
  creatine: number;
}

interface WeightConversion {
  grams: number;
  ounces: number;
  pounds: number;
}

interface EnhancedFoodItem {
  name: string;
  quantity: number;
  unit: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
  nutrition: EnhancedNutrition;
  confidence: number;
  weightConversion?: WeightConversion;
}

interface AddFoodFormData {
  foodName: string;
  quantity: number;
  unit: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

// New getRecommendedDailyValues function (replaces the old one)
const getRecommendedDailyValues = (user: User | null) => {
  let targetCalories = 2000;
  let proteinGoal = 50;
  let carbGoal = 300;
  let fatGoal = 67;

  if (user && user.weight && user.height && user.gender && user.activityLevel && user.dateOfBirth) {
    const age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
    let bmr: number;
    if (user.gender === 'male') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * age + 5;
    } else { // female or other
      bmr = 10 * user.weight + 6.25 * user.height - 5 * age - 161;
    }
    // Use Dashboard's conservative activity multipliers
    const activityMultipliers = {
      sedentary: 1.15,
      lightly_active: 1.3,
      moderately_active: 1.45,
      very_active: 1.6,
      extra_active: 1.75 
    };
    const maintenanceCalories = bmr * activityMultipliers[user.activityLevel];
    targetCalories = maintenanceCalories;

    if (user.weightGoal && user.weightGoalTimeframe && user.weightGoalTimeframe > 0) {
        const currentWeightLbs = user.weight * 2.20462;
        const weightGoalLbs = user.weightGoal; 
        const weightChangeLbs = currentWeightLbs - weightGoalLbs;
        const weeklyTargetChangeLbs = weightChangeLbs / user.weightGoalTimeframe;
        
        // Cap weekly change at 3 lbs/week (gain or loss)
        const absWeeklyTargetChange = Math.abs(weeklyTargetChangeLbs);
        const cappedAbsWeeklyChange = Math.min(absWeeklyTargetChange, 3);
        const safeWeeklyChangeLbs = cappedAbsWeeklyChange * Math.sign(weeklyTargetChangeLbs);
        
        const dailyCalorieAdjustment = (safeWeeklyChangeLbs * 3500) / 7;
        targetCalories = Math.round(maintenanceCalories - dailyCalorieAdjustment);
    }
    const minimumCalories = user.gender === 'male' ? 1500 : 1200;
    targetCalories = Math.max(targetCalories, minimumCalories);

    let proteinPerKg = 1.6;
    if (user.healthGoals?.includes('build_muscle')) proteinPerKg = 2.0;
    proteinGoal = Math.round(user.weight * proteinPerKg);
    const fatCalories = targetCalories * 0.25; // 25% from fat
    fatGoal = Math.round(fatCalories / 9);
    const carbCalories = targetCalories - (proteinGoal * 4) - (fatGoal * 9);
    carbGoal = Math.round(carbCalories / 4);
  }
  return {
    calories: targetCalories, protein: proteinGoal, carbs: carbGoal, fat: fatGoal, fiber: 25,
    sugar: Math.round(targetCalories * 0.1 / 4), saturatedFat: Math.round(targetCalories * 0.1 / 9), transFat: 0, cholesterol: 300,
    sodium: 2300, potassium: 3500, calcium: 1000, magnesium: 400, phosphorus: 700,
    iron: user?.gender === 'female' ? 18 : 8, zinc: user?.gender === 'female' ? 8 : 11, selenium: 55,
    vitaminA: user?.gender === 'female' ? 700 : 900, vitaminC: user?.gender === 'female' ? 75 : 90, vitaminD: 15, vitaminE: 15,
    vitaminK: user?.gender === 'female' ? 90 : 120, thiamin: 1.1, riboflavin: 1.1, niacin: 14, vitaminB6: 1.3,
    folate: 400, vitaminB12: 2.4, biotin: 30, pantothenicAcid: 5,
    omega3: 1600, omega6: 15000,
    creatine: user?.healthGoals?.includes('build_muscle') || user?.healthGoals?.includes('strength_training') ? 3000 : 0,
  };
};

// Modified getNutrientColor function
const getNutrientColor = (
  nutrientName: string,
  current: number,
  recommended: number,
  goalStatus: 'lose' | 'gain' | 'maintain' | null,
  isUpperLimit: boolean = false
): 'success' | 'warning' | 'error' | 'default' => {
  if (nutrientName === 'calories' && goalStatus) {
    const calorieRatio = recommended > 0 ? current / recommended : 0;
    if (goalStatus === 'lose') {
      if (calorieRatio > 1.05) return 'error'; // More than 5% over target
      if (calorieRatio > 1.0) return 'warning';   // At or slightly over target (up to 5%)
      // if (calorieRatio < 0.85) return 'warning'; // Optional: significantly under might be a warning too
      return 'success'; // At or under target (and not significantly under if warning above is active)
    } else if (goalStatus === 'gain') {
      if (calorieRatio < 0.90) return 'error'; // More than 10% under target
      if (calorieRatio < 1.0) return 'warning';   // Under target (up to 10%)
      return 'success'; // At or over target
    } else { // maintain
      if (calorieRatio > 1.1 || calorieRatio < 0.9) return 'warning'; // +/- 10% from target
      return 'success'; // Within +/- 10% of target
    }
  }

  if (isUpperLimit) {
    if (current > recommended) return 'error';
    if (current > recommended * 0.8 && recommended > 0) return 'warning'; // Avoid division by zero if recommended is 0
    return 'success';
  }

  // Default logic for nutrients where more is generally better (or no specific goalStatus applies)
  if (recommended === 0) return current > 0 ? 'warning' : 'default'; // If goal is 0, any intake is a warning or default
  const ratio = current / recommended;
  if (ratio >= 1) return 'success';
  if (ratio >= 0.7) return 'warning';
  return 'error';
};

// getNutrientColorStyle might need to be updated if its direct calls to getNutrientColor change significantly
// For now, assuming it's mainly for individual nutrient chips, not the summary display
const getNutrientColorStyle = (nutrientName: string, current: number, recommended: number, goalStatus: 'lose' | 'gain' | 'maintain' | null, isUpperLimit: boolean = false) => {
  const color = getNutrientColor(nutrientName, current, recommended, goalStatus, isUpperLimit);
  switch (color) {
    case 'success':
      return { 
        backgroundColor: 'var(--color-primary-green)', 
        color: 'white',
        '&:hover': { backgroundColor: 'var(--color-primary-green-dark)' }
      };
    case 'warning':
      return { 
        backgroundColor: 'var(--color-accent-yellow)', 
        color: 'var(--color-text-primary)',
        '&:hover': { backgroundColor: 'var(--color-accent-yellow-dark)' }
      };
    case 'error':
      return { 
        backgroundColor: 'var(--color-error)', 
        color: 'white',
        '&:hover': { backgroundColor: 'var(--color-error)' }
      };
    default:
      return {};
  }
};

export const FoodLog: React.FC = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [foodItems, setFoodItems] = useState<EnhancedFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSmartEntryOpen, setIsSmartEntryOpen] = useState(false);
  const [addingFood, setAddingFood] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const [personalFoodSuggestions, setPersonalFoodSuggestions] = useState<any[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [expandedNutrition, setExpandedNutrition] = useState<Set<number>>(new Set());

  // State for personalized recommended daily values
  const [personalizedRdvs, setPersonalizedRdvs] = useState(() => getRecommendedDailyValues(null));

  const { register, handleSubmit, reset, setValue, watch, getValues, formState: { errors } } = useForm<AddFoodFormData>({
    defaultValues: {
      foodName: '',
      quantity: 1,
      unit: 'serving',
      mealType: 'breakfast',
    }
  });

  const watchedFoodName = watch('foodName');

  // Load food logs for the selected date
  const loadFoodLogs = async (date: Date) => {
    try {
      setLoading(true);
      setError('');
      
      // Fix: Preserve local date instead of converting through UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      const response = await fetch(`/api/food/logs/${dateStr}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          // No food logs for this date yet
          setFoodItems([]);
          return;
        }
        throw new Error('Failed to load food logs');
      }

      const result = await response.json();
      
      if (result.success && result.data && result.data.meals) {
        const allFoods: EnhancedFoodItem[] = [];
        Object.keys(result.data.meals).forEach(mealKey => {
          result.data.meals[mealKey].forEach((item: any) => {
            allFoods.push({
            name: item.food.name,
            quantity: item.quantity,
            unit: item.unit,
              mealType: mealKey as any, 
              nutrition: item.nutrition,
              confidence: item.confidence,
              weightConversion: item.weightConversion
          });
        });
      });
        setFoodItems(allFoods);
      } else {
        setFoodItems([]);
      }
    } catch (err: any) {
      console.error('Failed to load food logs:', err);
      setError(err.message || 'Failed to load food logs');
    } finally {
      setLoading(false);
    }
  };

  // Save food logs to the backend
  const saveFoodLogs = async (date: Date, items: EnhancedFoodItem[]) => {
    try {
      // Fix: Preserve local date instead of converting through UTC
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      
      console.log('🗂️ SAVE FOOD LOGS - Date:', dateStr);
      console.log('🍽️ SAVE FOOD LOGS - Items to save:', items);
      
      // Group items by meal type
      const meals = {
        breakfast: [] as any[],
        lunch: [] as any[],
        dinner: [] as any[],
        snacks: [] as any[]
      };

      items.forEach(item => {
        const mealData = {
          food: {
            name: item.name,
            nutritionPer100g: item.nutrition // This format matches backend expectations
          },
          quantity: item.quantity,
          unit: item.unit,
          nutrition: item.nutrition,
          confidence: item.confidence,
          weightConversion: item.weightConversion
        };
        
        console.log(`📝 Adding ${item.name} to ${item.mealType}:`, mealData);
        meals[item.mealType].push(mealData);
      });

      console.log('🍽️ SAVE FOOD LOGS - Grouped meals:', meals);

      const response = await fetch(`/api/food/logs/${dateStr}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ meals }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ SAVE FOOD LOGS - Error response:', errorData);
        throw new Error('Failed to save food logs');
      }
      
      const responseData = await response.json();
      console.log('✅ SAVE FOOD LOGS - Success response:', responseData);
    } catch (err: any) {
      console.error('❌ SAVE FOOD LOGS - Failed to save food logs:', err);
      setError(err.message || 'Failed to save food logs');
    }
  };

  // Load food logs when component mounts or date changes
  useEffect(() => {
    loadFoodLogs(selectedDate);
  }, [selectedDate]);

  // Search personal foods when food name changes
  useEffect(() => {
    const searchPersonalFoods = async () => {
      if (watchedFoodName && watchedFoodName.length >= 2) {
        try {
          setSearchingSuggestions(true);
          const response = await fetch(`/api/personal-foods?search=${encodeURIComponent(watchedFoodName)}&limit=5`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });

          if (response.ok) {
            const result = await response.json();
            setPersonalFoodSuggestions(result.data.foods || []);
          }
        } catch (error) {
          console.error('Error searching personal foods:', error);
        } finally {
          setSearchingSuggestions(false);
        }
      } else {
        setPersonalFoodSuggestions([]);
      }
    };

    const timeoutId = setTimeout(searchPersonalFoods, 300); // Debounce
    return () => clearTimeout(timeoutId);
  }, [watchedFoodName]);

  // Quick add from personal food database
  const addFromPersonalFood = async (personalFood: any, customQuantity?: number, customUnit?: string) => {
    try {
      setAddingFood(true);
      setError('');

      console.log('🥗 PERSONAL FOOD - Adding personal food:', personalFood);

      // Get form data for meal type
      const formData = getValues();

      const newFoodItem: EnhancedFoodItem = {
        name: personalFood.name,
        quantity: customQuantity || personalFood.defaultQuantity,
        unit: customUnit || personalFood.defaultUnit,
        mealType: formData.mealType,
        nutrition: personalFood.nutrition,
        confidence: 0.95, // High confidence since it's from personal database
        weightConversion: undefined,
      };

      console.log('🔢 PERSONAL FOOD - Created food item:', newFoodItem);

      // Update local state
      const updatedItems = [...foodItems, newFoodItem];
      console.log('📋 PERSONAL FOOD - Updated items list:', updatedItems);
      setFoodItems(updatedItems);
      
      // Save to backend
      console.log('💾 PERSONAL FOOD - Calling saveFoodLogs...');
      await saveFoodLogs(selectedDate, updatedItems);
      
      // Increment usage count in personal database
      console.log('📊 PERSONAL FOOD - Incrementing usage count...');
      await fetch(`/api/personal-foods/${personalFood.id}/use`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          quantity: customQuantity || personalFood.defaultQuantity,
          unit: customUnit || personalFood.defaultUnit,
        }),
      });

      setIsSmartEntryOpen(false);
      reset();
      setPersonalFoodSuggestions([]);
      console.log('✅ PERSONAL FOOD - Successfully added personal food');
    } catch (err: any) {
      console.error('❌ PERSONAL FOOD - Error:', err);
      setError(err.message || 'Failed to add food item');
    } finally {
      setAddingFood(false);
    }
  };

  // Handle date change
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  // Handle quantity editing with nutrition scaling
  const startEditingQuantity = (index: number, currentQuantity: number, currentUnit: string) => {
    setEditingItemIndex(index);
    setEditQuantity(String(currentQuantity));
    setEditUnit(currentUnit);
  };

  const cancelEditingQuantity = () => {
    setEditingItemIndex(null);
  };

  const saveQuantityEdit = async (index: number, newQuantity?: number, newUnit?: string) => {
    const itemToUpdate = foodItems[index];
    if (!itemToUpdate) return;

    const quantityToSave = newQuantity !== undefined ? newQuantity : parseFloat(editQuantity);
    const unitToSave = newUnit !== undefined ? newUnit : editUnit;

    if (isNaN(quantityToSave) || quantityToSave <= 0) {
      setError('Invalid quantity.');
        return;
      }

    // Create a deep copy of the item and its nutrition to avoid direct state mutation issues
    const updatedItem = JSON.parse(JSON.stringify(itemToUpdate));
    const oldQuantity = updatedItem.quantity;

    updatedItem.quantity = quantityToSave;
    updatedItem.unit = unitToSave;

    // Rescale nutrition
    const ratio = oldQuantity > 0 ? updatedItem.quantity / oldQuantity : 1;
    if (updatedItem.nutrition) {
      for (const key in updatedItem.nutrition) {
        if (typeof updatedItem.nutrition[key] === 'number') {
          updatedItem.nutrition[key] = updatedItem.nutrition[key] * ratio;
        }
      }
    }

      const updatedItems = [...foodItems];
      updatedItems[index] = updatedItem;

    setFoodItems(updatedItems);
      await saveFoodLogs(selectedDate, updatedItems);
    setEditingItemIndex(null); // Exit edit mode
  };
  
  const adjustQuantityStep = async (globalIndex: number, step: number) => {
    const itemToUpdate = foodItems[globalIndex];
    if (!itemToUpdate) return;

    let newQuantity = parseFloat((itemToUpdate.quantity + step).toFixed(2)); // toFixed for precision with 0.5 steps
    if (newQuantity < 0.1) {
      newQuantity = 0.1; // Minimum quantity
    }
    // Call saveQuantityEdit with the new quantity and existing unit
    await saveQuantityEdit(globalIndex, newQuantity, itemToUpdate.unit);
  };

  const toggleNutritionExpansion = (globalIndex: number) => {
    const newExpanded = new Set(expandedNutrition);
    if (newExpanded.has(globalIndex)) {
      newExpanded.delete(globalIndex);
    } else {
      newExpanded.add(globalIndex);
    }
    setExpandedNutrition(newExpanded);
  };

  const addFoodItem = async (data: AddFoodFormData) => {
    if (!data.foodName.trim()) {
      setError('Please enter a food item');
      return;
    }

    try {
      setAddingFood(true);
      setError('');

      console.log('🤖 AI LOOKUP - Starting AI food lookup for:', data.foodName);

      // Use the AI food lookup API
      const response = await fetch('/api/food/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          foodQuery: data.foodName,
          quantity: data.quantity,
          unit: data.unit,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get nutrition data');
      }

      const result = await response.json();
      
      console.log('🤖 AI LOOKUP - AI Food Lookup Result:', result.data);
      
      const newFoodItem: EnhancedFoodItem = {
        name: result.data.name,
        quantity: data.quantity,
        unit: data.unit,
        mealType: data.mealType,
        nutrition: {
          calories: result.data.nutrition.calories || 0,
          protein: result.data.nutrition.protein || 0,
          carbs: result.data.nutrition.carbs || 0,
          fat: result.data.nutrition.fat || 0,
          fiber: result.data.nutrition.fiber || 0,
          sugar: result.data.nutrition.sugar || 0,
          saturatedFat: result.data.nutrition.saturatedFat || 0,
          monounsaturatedFat: result.data.nutrition.monounsaturatedFat || 0,
          polyunsaturatedFat: result.data.nutrition.polyunsaturatedFat || 0,
          transFat: result.data.nutrition.transFat || 0,
          omega3: result.data.nutrition.omega3 || 0,
          omega6: result.data.nutrition.omega6 || 0,
          sodium: result.data.nutrition.sodium || 0,
          potassium: result.data.nutrition.potassium || 0,
          calcium: result.data.nutrition.calcium || 0,
          magnesium: result.data.nutrition.magnesium || 0,
          phosphorus: result.data.nutrition.phosphorus || 0,
          iron: result.data.nutrition.iron || 0,
          zinc: result.data.nutrition.zinc || 0,
          selenium: result.data.nutrition.selenium || 0,
          vitaminA: result.data.nutrition.vitaminA || 0,
          vitaminC: result.data.nutrition.vitaminC || 0,
          vitaminD: result.data.nutrition.vitaminD || 0,
          vitaminE: result.data.nutrition.vitaminE || 0,
          vitaminK: result.data.nutrition.vitaminK || 0,
          thiamin: result.data.nutrition.thiamin || 0,
          riboflavin: result.data.nutrition.riboflavin || 0,
          niacin: result.data.nutrition.niacin || 0,
          vitaminB6: result.data.nutrition.vitaminB6 || 0,
          folate: result.data.nutrition.folate || 0,
          vitaminB12: result.data.nutrition.vitaminB12 || 0,
          biotin: result.data.nutrition.biotin || 0,
          pantothenicAcid: result.data.nutrition.pantothenicAcid || 0,
          cholesterol: result.data.nutrition.cholesterol || 0,
          creatine: result.data.nutrition.creatine || 0,
        },
        confidence: result.data.confidence || 0.8,
        weightConversion: result.data.weightConversion || undefined,
      };

      console.log('🔢 AI LOOKUP - Created food item:', newFoodItem);

      // Update local state
      const updatedItems = [...foodItems, newFoodItem];
      console.log('📋 AI LOOKUP - Updated items list:', updatedItems);
      setFoodItems(updatedItems);
      
      // Save to backend
      console.log('💾 AI LOOKUP - Calling saveFoodLogs...');
      await saveFoodLogs(selectedDate, updatedItems);
      
      setIsSmartEntryOpen(false);
      reset();
      console.log('✅ AI LOOKUP - Successfully added AI analyzed food');
    } catch (err: any) {
      console.error('❌ AI LOOKUP - Error:', err);
      setError(err.message || 'Failed to add food item');
    } finally {
      setAddingFood(false);
    }
  };

  const removeFoodItem = async (index: number) => {
    try {
      const updatedItems = foodItems.filter((_, i) => i !== index);
      setFoodItems(updatedItems);
      
      // Save to backend
      await saveFoodLogs(selectedDate, updatedItems);
    } catch (err: any) {
      setError('Failed to remove food item');
      // Revert the change if save failed
      loadFoodLogs(selectedDate);
    }
  };

  const handleSmartFoodsAdded = async (newFoodItems: any[]) => {
    try {
      // Convert the smart entry format to our EnhancedFoodItem format
      const convertedItems: EnhancedFoodItem[] = newFoodItems.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        mealType: item.mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks',
        nutrition: {
          calories: item.nutrition?.calories || 0,
          protein: item.nutrition?.protein || 0,
          carbs: item.nutrition?.carbs || 0,
          fat: item.nutrition?.fat || 0,
          fiber: item.nutrition?.fiber || 0,
          sugar: item.nutrition?.sugar || 0,
          saturatedFat: item.nutrition?.saturatedFat || 0,
          monounsaturatedFat: item.nutrition?.monounsaturatedFat || 0,
          polyunsaturatedFat: item.nutrition?.polyunsaturatedFat || 0,
          transFat: item.nutrition?.transFat || 0,
          omega3: item.nutrition?.omega3 || 0,
          omega6: item.nutrition?.omega6 || 0,
          sodium: item.nutrition?.sodium || 0,
          potassium: item.nutrition?.potassium || 0,
          calcium: item.nutrition?.calcium || 0,
          magnesium: item.nutrition?.magnesium || 0,
          phosphorus: item.nutrition?.phosphorus || 0,
          iron: item.nutrition?.iron || 0,
          zinc: item.nutrition?.zinc || 0,
          selenium: item.nutrition?.selenium || 0,
          vitaminA: item.nutrition?.vitaminA || 0,
          vitaminC: item.nutrition?.vitaminC || 0,
          vitaminD: item.nutrition?.vitaminD || 0,
          vitaminE: item.nutrition?.vitaminE || 0,
          vitaminK: item.nutrition?.vitaminK || 0,
          thiamin: item.nutrition?.thiamin || 0,
          riboflavin: item.nutrition?.riboflavin || 0,
          niacin: item.nutrition?.niacin || 0,
          vitaminB6: item.nutrition?.vitaminB6 || 0,
          folate: item.nutrition?.folate || 0,
          vitaminB12: item.nutrition?.vitaminB12 || 0,
          biotin: item.nutrition?.biotin || 0,
          pantothenicAcid: item.nutrition?.pantothenicAcid || 0,
          cholesterol: item.nutrition?.cholesterol || 0,
          creatine: item.nutrition?.creatine || 0,
        },
        confidence: item.confidence || 0.8,
        weightConversion: item.weightConversion
      }));

      const updatedItems = [...foodItems, ...convertedItems];
      setFoodItems(updatedItems);
      
      await saveFoodLogs(selectedDate, updatedItems);
    } catch (err: any) {
      console.error('Failed to add food items:', err);
      setError(err.message || 'Failed to add food items');
    }
  };

  const getMealIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return <CoffeeIcon color="primary" />;
      case 'lunch': return <FastFoodIcon color="secondary" />;
      case 'dinner': return <DinnerIcon color="success" />;
      case 'snacks': return <LocalDiningIcon color="warning" />;
      default: return <RestaurantIcon />;
    }
  };

  const getMealItems = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks') => {
    return foodItems.filter(item => item.mealType === mealType);
  };

  const calculateTotalNutrition = () => {
    return foodItems.reduce(
      (total, item) => ({
        calories: total.calories + (item.nutrition.calories || 0),
        protein: total.protein + (item.nutrition.protein || 0),
        carbs: total.carbs + (item.nutrition.carbs || 0),
        fat: total.fat + (item.nutrition.fat || 0),
        fiber: total.fiber + (item.nutrition.fiber || 0),
        sugar: total.sugar + (item.nutrition.sugar || 0),
        saturatedFat: total.saturatedFat + (item.nutrition.saturatedFat || 0),
        monounsaturatedFat: total.monounsaturatedFat + (item.nutrition.monounsaturatedFat || 0),
        polyunsaturatedFat: total.polyunsaturatedFat + (item.nutrition.polyunsaturatedFat || 0),
        transFat: total.transFat + (item.nutrition.transFat || 0),
        omega3: total.omega3 + (item.nutrition.omega3 || 0),
        omega6: total.omega6 + (item.nutrition.omega6 || 0),
        sodium: total.sodium + (item.nutrition.sodium || 0),
        potassium: total.potassium + (item.nutrition.potassium || 0),
        calcium: total.calcium + (item.nutrition.calcium || 0),
        magnesium: total.magnesium + (item.nutrition.magnesium || 0),
        phosphorus: total.phosphorus + (item.nutrition.phosphorus || 0),
        iron: total.iron + (item.nutrition.iron || 0),
        zinc: total.zinc + (item.nutrition.zinc || 0),
        selenium: total.selenium + (item.nutrition.selenium || 0),
        vitaminA: total.vitaminA + (item.nutrition.vitaminA || 0),
        vitaminC: total.vitaminC + (item.nutrition.vitaminC || 0),
        vitaminD: total.vitaminD + (item.nutrition.vitaminD || 0),
        vitaminE: total.vitaminE + (item.nutrition.vitaminE || 0),
        vitaminK: total.vitaminK + (item.nutrition.vitaminK || 0),
        thiamin: total.thiamin + (item.nutrition.thiamin || 0),
        riboflavin: total.riboflavin + (item.nutrition.riboflavin || 0),
        niacin: total.niacin + (item.nutrition.niacin || 0),
        vitaminB6: total.vitaminB6 + (item.nutrition.vitaminB6 || 0),
        folate: total.folate + (item.nutrition.folate || 0),
        vitaminB12: total.vitaminB12 + (item.nutrition.vitaminB12 || 0),
        biotin: total.biotin + (item.nutrition.biotin || 0),
        pantothenicAcid: total.pantothenicAcid + (item.nutrition.pantothenicAcid || 0),
        cholesterol: total.cholesterol + (item.nutrition.cholesterol || 0),
        creatine: total.creatine + (item.nutrition.creatine || 0),
      }),
      {
        calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0,
        saturatedFat: 0, monounsaturatedFat: 0, polyunsaturatedFat: 0, transFat: 0,
        omega3: 0, omega6: 0,
        sodium: 0, potassium: 0, calcium: 0, magnesium: 0, phosphorus: 0,
        iron: 0, zinc: 0, selenium: 0,
        vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
        thiamin: 0, riboflavin: 0, niacin: 0, vitaminB6: 0, folate: 0, vitaminB12: 0,
        biotin: 0, pantothenicAcid: 0, cholesterol: 0, creatine: 0
      }
    );
  };

  const totalNutrition = calculateTotalNutrition();
  
  // Determine user's weight goal status - MOVED EARLIER & CORRECTED
  let userWeightGoalStatus: 'lose' | 'gain' | 'maintain' | null = null;
  if (user && typeof user.weight === 'number' && user.weightGoal !== undefined && user.weightGoal !== null) {
    const weightInKg = user.weight;
    const weightGoalInKg = user.weightGoal * 0.453592; // Convert lbs (user.weightGoal) to kg
    const tolerance = weightInKg * 0.01; // 1% tolerance for maintain

    if (weightGoalInKg < weightInKg - tolerance) {
      userWeightGoalStatus = 'lose';
    } else if (weightGoalInKg > weightInKg + tolerance) {
      userWeightGoalStatus = 'gain';
    } else {
      userWeightGoalStatus = 'maintain';
    }
  } else if (user) {
    userWeightGoalStatus = 'maintain'; // Default to maintain if goal not fully set
  }

  // Calculate calorie color AFTER userWeightGoalStatus is defined
  const calorieColorForSummary = getNutrientColor(
    'calories',
    totalNutrition.calories,
    personalizedRdvs.calories,
    userWeightGoalStatus // Now defined
  );

  const renderMealSection = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', title: string) => {
    const mealItems = getMealItems(mealType);

    return (
      <Card sx={{ mb: 2 }} data-tour={mealType === 'breakfast' ? 'meal-section' : undefined}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={1} mb={2}>
            {getMealIcon(mealType)}
            <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.125rem' } }}>
              {title}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.secondary" 
              sx={{ ml: 'auto', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              {mealItems.reduce((sum, item) => sum + (item.nutrition.calories || 0), 0).toFixed(0)} cal
            </Typography>
          </Box>
          
          <Stack spacing={2}>
            {mealItems.map((item, index) => {
              const globalIndex = foodItems.indexOf(item);
              const isEditing = editingItemIndex === globalIndex;
              const isExpanded = expandedNutrition.has(globalIndex);
              
              return (
                <Card key={index} variant="outlined" sx={{ p: { xs: 1, sm: 2 } }}>
                  <Box display="flex" justifyContent="space-between" alignItems="start" mb={{ xs: 1, sm: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Typography 
                        variant="subtitle1" 
                        fontWeight="bold"
                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                      >
                        {item.name}
                      </Typography>
                      
                      {isEditing ? (
                        <Box display="flex" gap={1} alignItems="center" mt={1} flexWrap="wrap">
                          <TextField
                            size="small"
                            label="Qty"
                            type="number"
                            value={editQuantity}
                            onChange={(e) => setEditQuantity(e.target.value)}
                            inputProps={{ step: 0.1, min: 0.1 }}
                            sx={{ 
                              width: { xs: 60, sm: 80 },
                              '& .MuiInputBase-input': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                            }}
                          />
                          <TextField
                            size="small"
                            label="Unit"
                            select
                            value={editUnit}
                            onChange={(e) => setEditUnit(e.target.value)}
                            sx={{ 
                              width: { xs: 80, sm: 100 },
                              '& .MuiInputBase-input': { fontSize: { xs: '0.75rem', sm: '0.875rem' } }
                            }}
                          >
                            <MenuItem value="serving">serving</MenuItem>
                            <MenuItem value="cup">cup</MenuItem>
                            <MenuItem value="oz">oz</MenuItem>
                            <MenuItem value="g">g</MenuItem>
                            <MenuItem value="tbsp">tbsp</MenuItem>
                            <MenuItem value="tsp">tsp</MenuItem>
                            <MenuItem value="piece">piece</MenuItem>
                            <MenuItem value="slice">slice</MenuItem>
                          </TextField>
                          <Box display="flex" gap={0.5}>
                            <IconButton 
                              size="small" 
                              color="primary"
                              onClick={() => saveQuantityEdit(globalIndex)}
                            >
                              <CheckIcon />
                            </IconButton>
                            <IconButton 
                              size="small" 
                              onClick={cancelEditingQuantity}
                            >
                              <CloseIcon />
                            </IconButton>
                          </Box>
                        </Box>
                      ) : (
                        <Box>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                          >
                            {item.quantity} {item.unit}
                            {item.weightConversion && item.weightConversion.grams && item.weightConversion.ounces && (
                              <span> • {(item.weightConversion.grams || 0).toFixed(0)}g</span>
                            )}
                          </Typography>
                          
                          {/* Mobile-friendly controls */}
                          <Box 
                            display="flex" 
                            alignItems="center" 
                            gap={0.5} 
                            mt={1}
                            flexWrap="wrap"
                          >
                            <IconButton
                              size="small"
                              onClick={() => startEditingQuantity(globalIndex, item.quantity, item.unit)}
                              sx={{ p: 0.5 }}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            
                            <IconButton 
                                size="small"
                              onClick={() => adjustQuantityStep(globalIndex, -0.5)} 
                              sx={{ p: 0.5 }}
                            >
                              <RemoveCircleOutlineIcon fontSize="small" />
                            </IconButton>
                            <IconButton 
                                size="small"
                              onClick={() => adjustQuantityStep(globalIndex, 0.5)} 
                              sx={{ p: 0.5 }}
                            >
                              <AddCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => removeFoodItem(globalIndex)}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Compact nutrition summary - always visible */}
                  <Box mb={1}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        <Chip 
                          label={`${Math.round(item.nutrition.calories || 0)} cal`} 
                          size="small" 
                          color="primary"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                        <Chip 
                          label={`${(item.nutrition.protein || 0).toFixed(1)}g P`} 
                          size="small"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                        <Chip 
                          label={`${(item.nutrition.carbs || 0).toFixed(1)}g C`} 
                          size="small"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                        <Chip 
                          label={`${(item.nutrition.fat || 0).toFixed(1)}g F`} 
                          size="small"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      </Stack>
                      <Button
                        size="small"
                        onClick={() => toggleNutritionExpansion(globalIndex)}
                        startIcon={isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        sx={{ 
                          minWidth: 'auto',
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          px: { xs: 0.5, sm: 1 }
                        }}
                      >
                        {isExpanded ? 'Less' : 'More'}
                      </Button>
                    </Box>
                  </Box>

                  {/* Detailed nutrition - collapsible */}
                  {isExpanded && (
                    <Box>
                      {/* Additional Macros */}
                      {((item.nutrition.fiber || 0) > 0 || (item.nutrition.sugar || 0) > 0) && (
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            Additional Macros
                          </Typography>
                          <Box mt={0.5}>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                              {(item.nutrition.fiber || 0) > 0 && (
                                <Chip label={`${(item.nutrition.fiber || 0).toFixed(1)}g fiber`} size="small" variant="outlined" />
                              )}
                              {(item.nutrition.sugar || 0) > 0 && (
                                <Chip label={`${(item.nutrition.sugar || 0).toFixed(1)}g sugar`} size="small" variant="outlined" />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      )}

                      {/* Fat Breakdown */}
                      {((item.nutrition.fat || 0) > 0 || 
                        (item.nutrition.saturatedFat || 0) > 0 || 
                        (item.nutrition.omega3 || 0) > 0 || 
                        (item.nutrition.omega6 || 0) > 0) && (
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            Fat Profile
                          </Typography>
                          <Box mt={0.5}>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                              {(item.nutrition.saturatedFat || 0) > 0 && (
                                <Chip 
                                  label={`Sat: ${(item.nutrition.saturatedFat || 0).toFixed(1)}g`} 
                                  size="small" 
                                  variant="outlined"
                                  sx={{ 
                                    fontSize: { xs: '0.625rem', sm: '0.75rem' }, 
                                    height: { xs: '20px', sm: '24px' },
                                    ...getNutrientColorStyle('saturatedFat', item.nutrition.saturatedFat, personalizedRdvs.saturatedFat, userWeightGoalStatus, true)
                                  }}
                                />
                              )}
                              {(item.nutrition.monounsaturatedFat || 0) > 0 && (
                                <Chip label={`${(item.nutrition.monounsaturatedFat || 0).toFixed(1)}g mono`} size="small" variant="outlined" />
                              )}
                              {(item.nutrition.polyunsaturatedFat || 0) > 0 && (
                                <Chip label={`${(item.nutrition.polyunsaturatedFat || 0).toFixed(1)}g poly`} size="small" variant="outlined" />
                              )}
                              {(item.nutrition.omega3 || 0) > 0 && (
                                <Chip 
                                  label={`ω-3: ${Math.round(item.nutrition.omega3 || 0)}mg`} 
                                  size="small"
                                  sx={{ 
                                    fontSize: { xs: '0.625rem', sm: '0.75rem' }, 
                                    height: { xs: '20px', sm: '24px' },
                                    ...getNutrientColorStyle('omega3', item.nutrition.omega3, personalizedRdvs.omega3, userWeightGoalStatus, false)
                                  }}
                                />
                              )}
                              {(item.nutrition.omega6 || 0) > 0 && (
                                <Chip label={`${(item.nutrition.omega6 || 0).toFixed(0)}mg ω-6`} size="small" />
                              )}
                              {(item.nutrition.transFat || 0) > 0 && (
                                <Chip 
                                  label={`Trans: ${(item.nutrition.transFat || 0).toFixed(1)}g`} 
                                  size="small"
                                  sx={{ 
                                    fontSize: { xs: '0.625rem', sm: '0.75rem' }, 
                                    height: { xs: '20px', sm: '24px' },
                                    backgroundColor: 'var(--color-error)', 
                                    color: 'white',
                                    '&:hover': { backgroundColor: 'var(--color-error)' }
                                  }}
                                />
                              )}
                              {(item.nutrition.cholesterol || 0) > 0 && (
                                <Chip 
                                  label={`Chol: ${Math.round(item.nutrition.cholesterol || 0)}mg`} 
                                  size="small"
                                  sx={{ 
                                    fontSize: { xs: '0.625rem', sm: '0.75rem' }, 
                                    height: { xs: '20px', sm: '24px' },
                                    ...getNutrientColorStyle('cholesterol', item.nutrition.cholesterol, personalizedRdvs.cholesterol, userWeightGoalStatus, true)
                                  }}
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      )}

                      {/* Top Micronutrients */}
                      {(item.nutrition.calories || 0) > 10 && (
                        <Box mb={2}>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">
                            Key Micronutrients
                          </Typography>
                          <Box mt={0.5}>
                            <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                              {(item.nutrition.sodium || 0) > 0 && (
                                <Chip label={`${Math.round(item.nutrition.sodium || 0)}mg sodium`} size="small" />
                              )}
                              {(item.nutrition.potassium || 0) > 0 && (
                                <Chip label={`${Math.round(item.nutrition.potassium || 0)}mg potassium`} size="small" />
                              )}
                              {(item.nutrition.calcium || 0) > 0 && (
                                <Chip label={`${Math.round(item.nutrition.calcium || 0)}mg calcium`} size="small" />
                              )}
                              {(item.nutrition.magnesium || 0) > 0 && (
                                <Chip label={`${Math.round(item.nutrition.magnesium || 0)}mg magnesium`} size="small" />
                              )}
                              {(item.nutrition.iron || 0) > 0 && (
                                <Chip label={`${(item.nutrition.iron || 0).toFixed(1)}mg iron`} size="small" />
                              )}
                              {(item.nutrition.zinc || 0) > 0 && (
                                <Chip label={`${(item.nutrition.zinc || 0).toFixed(1)}mg zinc`} size="small" />
                              )}
                              {(item.nutrition.vitaminC || 0) > 0 && (
                                <Chip label={`${(item.nutrition.vitaminC || 0).toFixed(1)}mg Vit C`} size="small" />
                              )}
                              {(item.nutrition.vitaminD || 0) > 0 && (
                                <Chip label={`${(item.nutrition.vitaminD || 0).toFixed(1)}mcg Vit D`} size="small" />
                              )}
                              {(item.nutrition.vitaminB12 || 0) > 0 && (
                                <Chip label={`${(item.nutrition.vitaminB12 || 0).toFixed(1)}mcg B12`} size="small" />
                              )}
                              {(item.nutrition.folate || 0) > 0 && (
                                <Chip label={`${Math.round(item.nutrition.folate || 0)}mcg folate`} size="small" />
                              )}
                              
                              {/* Show message if no micronutrients */}
                              {!(item.nutrition.sodium || 0) && !(item.nutrition.potassium || 0) && 
                               !(item.nutrition.calcium || 0) && !(item.nutrition.magnesium || 0) && 
                               !(item.nutrition.iron || 0) && !(item.nutrition.zinc || 0) && 
                               !(item.nutrition.vitaminA || 0) && !(item.nutrition.vitaminC || 0) && 
                               !(item.nutrition.vitaminD || 0) && (
                                <Chip 
                                  label="Limited micronutrient data" 
                                  size="small" 
                                  variant="outlined" 
                                  color="secondary"
                                />
                              )}
                            </Stack>
                          </Box>
                        </Box>
                      )}
                    </Box>
                  )}
                </Card>
              );
            })}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  const getDefaultMealTypeForSmartEntry = () => {
    const currentHour = new Date().getHours();
    if (currentHour < 10) return 'breakfast';
    if (currentHour < 14) return 'lunch';
    if (currentHour < 18) return 'dinner';
    return 'snacks';
  };

  useEffect(() => {
    // Update RDVs when user profile changes
    setPersonalizedRdvs(getRecommendedDailyValues(user));
  }, [user]);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap' }}>
          <Typography variant="h4" sx={{ fontSize: { xs: '1.8rem', sm: '2rem', md: '2.2rem' }, fontWeight: 'bold', color: 'primary.main' }}>
            Food Log
        </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
            onClick={() => setIsSmartEntryOpen(true)}
            size="small"
          >
                  Add Food
              </Button>
            </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <DatePicker
          label="Selected Date"
          value={selectedDate}
          onChange={handleDateChange}
          sx={{ mb: 2, width: { xs: '100%', sm: 'auto' } }}
        />

        {/* Smart Food Entry Dialog */}
        <SmartFoodEntry 
          open={isSmartEntryOpen} 
          onClose={() => setIsSmartEntryOpen(false)} 
          onFoodsAdded={handleSmartFoodsAdded} 
          selectedDate={selectedDate} 
          defaultMealType={getDefaultMealTypeForSmartEntry()}
        />

        {/* Display Total Nutrition Summary using the new component */}
        {foodItems.length > 0 && (
          <CompactNutritionSummary 
            totalNutrition={calculateTotalNutrition()} 
            recommendedValues={personalizedRdvs} 
            calorieDisplayColor={calorieColorForSummary === 'default' ? undefined : calorieColorForSummary}
          />
        )}

        {/* Meal Sections */}
        {renderMealSection('breakfast', 'Breakfast')}
        {renderMealSection('lunch', 'Lunch')}
        {renderMealSection('dinner', 'Dinner')}
        {renderMealSection('snacks', 'Snacks')}

        {/* Empty State */}
        {foodItems.length === 0 && (
          <Card>
            <CardContent>
              <Box textAlign="center" py={6}>
                <RestaurantIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No foods logged yet
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Start tracking your nutrition with AI-powered food analysis
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => setIsSmartEntryOpen(true)}
                >
                  Add Your First Food
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}
      </Box>
    </LocalizationProvider>
  );
}; 