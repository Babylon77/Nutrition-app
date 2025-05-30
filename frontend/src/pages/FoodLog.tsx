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
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { SmartFoodEntry } from '../components/SmartFoodEntry';

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

// Recommended Daily Values (simplified - ideally would come from user profile)
const getRecommendedDailyValues = () => ({
  // Macronutrients (example for adult male, 2000 cal diet)
  calories: 2000,
  protein: 50, // 10-35% of calories
  carbs: 300, // 45-65% of calories  
  fat: 67, // 20-35% of calories
  fiber: 25,
  sugar: 50, // <10% calories
  
  // Minerals (mg except where noted)
  sodium: 2300, // Upper limit
  potassium: 3500,
  calcium: 1000,
  magnesium: 400,
  phosphorus: 700,
  iron: 8,
  zinc: 11,
  selenium: 55, // mcg
  
  // Vitamins
  vitaminA: 900, // mcg
  vitaminC: 90, // mg
  vitaminD: 15, // mcg
  vitaminE: 15, // mg
  vitaminK: 120, // mcg
  thiamin: 1.2, // mg
  riboflavin: 1.3, // mg
  niacin: 16, // mg
  vitaminB6: 1.3, // mg
  folate: 400, // mcg
  vitaminB12: 2.4, // mcg
  biotin: 30, // mcg
  pantothenicAcid: 5, // mg
  
  // Fats (mg)
  omega3: 1600, // ALA + EPA/DHA
  omega6: 15000, // Rough estimate - 6-10% of calories
  saturatedFat: 22, // <10% calories (g)
  transFat: 0, // avoid
  
  // Special
  cholesterol: 300, // mg upper limit
  creatine: 3, // g (for those who supplement)
});

const getNutrientColor = (current: number, recommended: number, isUpperLimit: boolean = false): 'success' | 'warning' | 'error' | 'default' => {
  if (isUpperLimit) {
    // For nutrients where less is better (sodium, saturated fat, trans fat)
    if (current > recommended) return 'error';
    if (current > recommended * 0.8) return 'warning';
    return 'success';
  } else {
    // For nutrients where more is generally better
    if (current >= recommended) return 'success';
    if (current >= recommended * 0.7) return 'warning';
    return 'error';
  }
};

export const FoodLog: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [foodItems, setFoodItems] = useState<EnhancedFoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [addFoodOpen, setAddFoodOpen] = useState(false);
  const [addingFood, setAddingFood] = useState(false);
  const [searchingSuggestions, setSearchingSuggestions] = useState(false);
  const [personalFoodSuggestions, setPersonalFoodSuggestions] = useState<any[]>([]);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [expandedNutrition, setExpandedNutrition] = useState<Set<number>>(new Set());

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
      
      // Convert backend format to frontend format
      const loadedItems: EnhancedFoodItem[] = [];
      
      console.log('📥 Loading food logs from backend:', result.data);
      
      // Process each meal type
      ['breakfast', 'lunch', 'dinner', 'snacks'].forEach(mealType => {
        const mealItems = result.data.meals[mealType] || [];
        mealItems.forEach((item: any) => {
          loadedItems.push({
            name: item.food.name,
            quantity: item.quantity,
            unit: item.unit,
            mealType: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snacks',
            nutrition: {
              calories: item.nutrition.calories || 0,
              protein: item.nutrition.protein || 0,
              carbs: item.nutrition.carbs || 0,
              fat: item.nutrition.fat || 0,
              fiber: item.nutrition.fiber || 0,
              sugar: item.nutrition.sugar || 0,
              saturatedFat: item.nutrition.saturatedFat || 0,
              monounsaturatedFat: item.nutrition.monounsaturatedFat || 0,
              polyunsaturatedFat: item.nutrition.polyunsaturatedFat || 0,
              transFat: item.nutrition.transFat || 0,
              omega3: item.nutrition.omega3 || 0,
              omega6: item.nutrition.omega6 || 0,
              sodium: item.nutrition.sodium || 0,
              potassium: item.nutrition.potassium || 0,
              calcium: item.nutrition.calcium || 0,
              magnesium: item.nutrition.magnesium || 0,
              phosphorus: item.nutrition.phosphorus || 0,
              iron: item.nutrition.iron || 0,
              zinc: item.nutrition.zinc || 0,
              selenium: item.nutrition.selenium || 0,
              vitaminA: item.nutrition.vitaminA || 0,
              vitaminC: item.nutrition.vitaminC || 0,
              vitaminD: item.nutrition.vitaminD || 0,
              vitaminE: item.nutrition.vitaminE || 0,
              vitaminK: item.nutrition.vitaminK || 0,
              thiamin: item.nutrition.thiamin || 0,
              riboflavin: item.nutrition.riboflavin || 0,
              niacin: item.nutrition.niacin || 0,
              vitaminB6: item.nutrition.vitaminB6 || 0,
              folate: item.nutrition.folate || 0,
              vitaminB12: item.nutrition.vitaminB12 || 0,
              biotin: item.nutrition.biotin || 0,
              pantothenicAcid: item.nutrition.pantothenicAcid || 0,
              cholesterol: item.nutrition.cholesterol || 0,
              creatine: item.nutrition.creatine || 0,
            },
            confidence: item.confidence || 0.8,
            weightConversion: item.weightConversion || undefined,
          });
        });
      });
      
      setFoodItems(loadedItems);
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
      
      // Group items by meal type
      const meals = {
        breakfast: [] as any[],
        lunch: [] as any[],
        dinner: [] as any[],
        snacks: [] as any[]
      };

      items.forEach(item => {
        meals[item.mealType].push({
          food: {
            name: item.name,
            nutritionPer100g: item.nutrition // This format matches backend expectations
          },
          quantity: item.quantity,
          unit: item.unit,
          nutrition: item.nutrition,
          confidence: item.confidence,
          weightConversion: item.weightConversion
        });
      });

      const response = await fetch(`/api/food/logs/${dateStr}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ meals }),
      });

      if (!response.ok) {
        throw new Error('Failed to save food logs');
      }
    } catch (err: any) {
      console.error('Failed to save food logs:', err);
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

      // Update local state
      const updatedItems = [...foodItems, newFoodItem];
      setFoodItems(updatedItems);
      
      // Save to backend
      await saveFoodLogs(selectedDate, updatedItems);
      
      // Increment usage count in personal database
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

      setAddFoodOpen(false);
      reset();
      setPersonalFoodSuggestions([]);
    } catch (err: any) {
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
    setEditQuantity(currentQuantity.toString());
    setEditUnit(currentUnit);
  };

  const cancelEditingQuantity = () => {
    setEditingItemIndex(null);
    setEditQuantity('');
    setEditUnit('');
  };

  const saveQuantityEdit = async (index: number) => {
    try {
      const newQuantity = parseFloat(editQuantity);
      if (isNaN(newQuantity) || newQuantity <= 0) {
        setError('Quantity must be a positive number');
        return;
      }

      const item = foodItems[index];
      const oldQuantity = item.quantity;
      const ratio = newQuantity / oldQuantity;

      // Scale all nutrition values
      const scaledNutrition = {
        calories: Math.round((item.nutrition.calories || 0) * ratio),
        protein: Math.round((item.nutrition.protein || 0) * ratio * 10) / 10,
        carbs: Math.round((item.nutrition.carbs || 0) * ratio * 10) / 10,
        fat: Math.round((item.nutrition.fat || 0) * ratio * 10) / 10,
        fiber: Math.round((item.nutrition.fiber || 0) * ratio * 10) / 10,
        sugar: Math.round((item.nutrition.sugar || 0) * ratio * 10) / 10,
        saturatedFat: Math.round((item.nutrition.saturatedFat || 0) * ratio * 10) / 10,
        monounsaturatedFat: Math.round((item.nutrition.monounsaturatedFat || 0) * ratio * 10) / 10,
        polyunsaturatedFat: Math.round((item.nutrition.polyunsaturatedFat || 0) * ratio * 10) / 10,
        transFat: Math.round((item.nutrition.transFat || 0) * ratio * 10) / 10,
        omega3: Math.round((item.nutrition.omega3 || 0) * ratio),
        omega6: Math.round((item.nutrition.omega6 || 0) * ratio),
        sodium: Math.round((item.nutrition.sodium || 0) * ratio),
        potassium: Math.round((item.nutrition.potassium || 0) * ratio),
        calcium: Math.round((item.nutrition.calcium || 0) * ratio),
        magnesium: Math.round((item.nutrition.magnesium || 0) * ratio),
        phosphorus: Math.round((item.nutrition.phosphorus || 0) * ratio),
        iron: Math.round((item.nutrition.iron || 0) * ratio * 10) / 10,
        zinc: Math.round((item.nutrition.zinc || 0) * ratio * 10) / 10,
        selenium: Math.round((item.nutrition.selenium || 0) * ratio),
        vitaminA: Math.round((item.nutrition.vitaminA || 0) * ratio),
        vitaminC: Math.round((item.nutrition.vitaminC || 0) * ratio * 10) / 10,
        vitaminD: Math.round((item.nutrition.vitaminD || 0) * ratio * 10) / 10,
        vitaminE: Math.round((item.nutrition.vitaminE || 0) * ratio * 10) / 10,
        vitaminK: Math.round((item.nutrition.vitaminK || 0) * ratio),
        thiamin: Math.round((item.nutrition.thiamin || 0) * ratio * 10) / 10,
        riboflavin: Math.round((item.nutrition.riboflavin || 0) * ratio * 10) / 10,
        niacin: Math.round((item.nutrition.niacin || 0) * ratio * 10) / 10,
        vitaminB6: Math.round((item.nutrition.vitaminB6 || 0) * ratio * 10) / 10,
        folate: Math.round((item.nutrition.folate || 0) * ratio),
        vitaminB12: Math.round((item.nutrition.vitaminB12 || 0) * ratio * 10) / 10,
        biotin: Math.round((item.nutrition.biotin || 0) * ratio),
        pantothenicAcid: Math.round((item.nutrition.pantothenicAcid || 0) * ratio * 10) / 10,
        cholesterol: Math.round((item.nutrition.cholesterol || 0) * ratio),
        creatine: Math.round((item.nutrition.creatine || 0) * ratio)
      };

      // Scale weight conversion if it exists
      const scaledWeightConversion = item.weightConversion ? {
        grams: Math.round((item.weightConversion.grams || 0) * ratio),
        ounces: Math.round((item.weightConversion.ounces || 0) * ratio * 10) / 10,
        pounds: Math.round((item.weightConversion.pounds || 0) * ratio * 100) / 100
      } : undefined;

      const updatedItem = {
        ...item,
        quantity: newQuantity,
        unit: editUnit,
        nutrition: scaledNutrition,
        weightConversion: scaledWeightConversion
      };

      const updatedItems = [...foodItems];
      updatedItems[index] = updatedItem;
      setFoodItems(updatedItems);

      // Save to backend
      await saveFoodLogs(selectedDate, updatedItems);

      cancelEditingQuantity();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to update quantity');
    }
  };

  // Quick portion adjustment (0.5x, 1.5x, 2x, etc.)
  const quickAdjustPortion = async (index: number, multiplier: number) => {
    try {
      const item = foodItems[index];
      const newQuantity = Math.round(item.quantity * multiplier * 10) / 10; // Round to 1 decimal place

      // Scale all nutrition values
      const scaledNutrition = {
        calories: Math.round((item.nutrition.calories || 0) * multiplier),
        protein: Math.round((item.nutrition.protein || 0) * multiplier * 10) / 10,
        carbs: Math.round((item.nutrition.carbs || 0) * multiplier * 10) / 10,
        fat: Math.round((item.nutrition.fat || 0) * multiplier * 10) / 10,
        fiber: Math.round((item.nutrition.fiber || 0) * multiplier * 10) / 10,
        sugar: Math.round((item.nutrition.sugar || 0) * multiplier * 10) / 10,
        saturatedFat: Math.round((item.nutrition.saturatedFat || 0) * multiplier * 10) / 10,
        monounsaturatedFat: Math.round((item.nutrition.monounsaturatedFat || 0) * multiplier * 10) / 10,
        polyunsaturatedFat: Math.round((item.nutrition.polyunsaturatedFat || 0) * multiplier * 10) / 10,
        transFat: Math.round((item.nutrition.transFat || 0) * multiplier * 10) / 10,
        omega3: Math.round((item.nutrition.omega3 || 0) * multiplier),
        omega6: Math.round((item.nutrition.omega6 || 0) * multiplier),
        sodium: Math.round((item.nutrition.sodium || 0) * multiplier),
        potassium: Math.round((item.nutrition.potassium || 0) * multiplier),
        calcium: Math.round((item.nutrition.calcium || 0) * multiplier),
        magnesium: Math.round((item.nutrition.magnesium || 0) * multiplier),
        phosphorus: Math.round((item.nutrition.phosphorus || 0) * multiplier),
        iron: Math.round((item.nutrition.iron || 0) * multiplier * 10) / 10,
        zinc: Math.round((item.nutrition.zinc || 0) * multiplier * 10) / 10,
        selenium: Math.round((item.nutrition.selenium || 0) * multiplier),
        vitaminA: Math.round((item.nutrition.vitaminA || 0) * multiplier),
        vitaminC: Math.round((item.nutrition.vitaminC || 0) * multiplier * 10) / 10,
        vitaminD: Math.round((item.nutrition.vitaminD || 0) * multiplier * 10) / 10,
        vitaminE: Math.round((item.nutrition.vitaminE || 0) * multiplier * 10) / 10,
        vitaminK: Math.round((item.nutrition.vitaminK || 0) * multiplier),
        thiamin: Math.round((item.nutrition.thiamin || 0) * multiplier * 10) / 10,
        riboflavin: Math.round((item.nutrition.riboflavin || 0) * multiplier * 10) / 10,
        niacin: Math.round((item.nutrition.niacin || 0) * multiplier * 10) / 10,
        vitaminB6: Math.round((item.nutrition.vitaminB6 || 0) * multiplier * 10) / 10,
        folate: Math.round((item.nutrition.folate || 0) * multiplier),
        vitaminB12: Math.round((item.nutrition.vitaminB12 || 0) * multiplier * 10) / 10,
        biotin: Math.round((item.nutrition.biotin || 0) * multiplier),
        pantothenicAcid: Math.round((item.nutrition.pantothenicAcid || 0) * multiplier * 10) / 10,
        cholesterol: Math.round((item.nutrition.cholesterol || 0) * multiplier),
        creatine: Math.round((item.nutrition.creatine || 0) * multiplier)
      };

      // Scale weight conversion if it exists
      const scaledWeightConversion = item.weightConversion ? {
        grams: Math.round((item.weightConversion.grams || 0) * multiplier),
        ounces: Math.round((item.weightConversion.ounces || 0) * multiplier * 10) / 10,
        pounds: Math.round((item.weightConversion.pounds || 0) * multiplier * 100) / 100
      } : undefined;

      const updatedItem = {
        ...item,
        quantity: newQuantity,
        nutrition: scaledNutrition,
        weightConversion: scaledWeightConversion
      };

      const updatedItems = [...foodItems];
      updatedItems[index] = updatedItem;
      setFoodItems(updatedItems);

      // Save to backend
      await saveFoodLogs(selectedDate, updatedItems);

      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to adjust portion');
    }
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
      
      console.log('🍕 AI Food Lookup Result:', result.data);
      
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

      // Update local state
      const updatedItems = [...foodItems, newFoodItem];
      setFoodItems(updatedItems);
      
      // Save to backend
      await saveFoodLogs(selectedDate, updatedItems);
      
      setAddFoodOpen(false);
      reset();
    } catch (err: any) {
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
  const rdv = getRecommendedDailyValues();

  const renderMealSection = (mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks', title: string) => {
    const mealItems = getMealItems(mealType);
    
    if (mealItems.length === 0) return null;

    return (
      <Card sx={{ mb: 2 }}>
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
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                            
                            {/* Quick portion adjustments - mobile optimized */}
                            <Box display="flex" gap={0.5}>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => quickAdjustPortion(globalIndex, 0.5)}
                                sx={{ 
                                  minWidth: 'auto', 
                                  px: { xs: 0.5, sm: 1 }, 
                                  fontSize: { xs: '0.625rem', sm: '0.7rem' },
                                  height: { xs: '24px', sm: '28px' }
                                }}
                              >
                                ½×
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => quickAdjustPortion(globalIndex, 1.5)}
                                sx={{ 
                                  minWidth: 'auto', 
                                  px: { xs: 0.5, sm: 1 }, 
                                  fontSize: { xs: '0.625rem', sm: '0.7rem' },
                                  height: { xs: '24px', sm: '28px' }
                                }}
                              >
                                1½×
                              </Button>
                              <Button
                                size="small"
                                variant="outlined"
                                onClick={() => quickAdjustPortion(globalIndex, 2)}
                                sx={{ 
                                  minWidth: 'auto', 
                                  px: { xs: 0.5, sm: 1 }, 
                                  fontSize: { xs: '0.625rem', sm: '0.7rem' },
                                  height: { xs: '24px', sm: '28px' }
                                }}
                              >
                                2×
                              </Button>
                            </Box>
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
                                <Chip label={`${(item.nutrition.saturatedFat || 0).toFixed(1)}g saturated`} size="small" variant="outlined" />
                              )}
                              {(item.nutrition.monounsaturatedFat || 0) > 0 && (
                                <Chip label={`${(item.nutrition.monounsaturatedFat || 0).toFixed(1)}g mono`} size="small" variant="outlined" />
                              )}
                              {(item.nutrition.polyunsaturatedFat || 0) > 0 && (
                                <Chip label={`${(item.nutrition.polyunsaturatedFat || 0).toFixed(1)}g poly`} size="small" variant="outlined" />
                              )}
                              {(item.nutrition.omega3 || 0) > 0 && (
                                <Chip label={`${(item.nutrition.omega3 || 0).toFixed(0)}mg ω-3`} size="small" />
                              )}
                              {(item.nutrition.omega6 || 0) > 0 && (
                                <Chip label={`${(item.nutrition.omega6 || 0).toFixed(0)}mg ω-6`} size="small" />
                              )}
                              {(item.nutrition.transFat || 0) > 0 && (
                                <Chip label={`${(item.nutrition.transFat || 0).toFixed(1)}g trans`} size="small" color="error" />
                              )}
                              {(item.nutrition.cholesterol || 0) > 0 && (
                                <Chip label={`${Math.round(item.nutrition.cholesterol || 0)}mg cholesterol`} size="small" />
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

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Enhanced Food Log
        </Typography>
        <Typography 
          variant="body1" 
          color="text.secondary" 
          gutterBottom
          sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' } }}
        >
          AI-powered nutrition tracking with comprehensive micronutrient analysis
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {loading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={20} />
              Loading food logs...
            </Box>
          </Alert>
        )}

        {/* Header */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
              <DatePicker
                label="Select Date"
                value={selectedDate}
                onChange={handleDateChange}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { 
                      '& .MuiInputBase-input': { 
                        fontSize: { xs: '0.75rem', sm: '0.875rem' } 
                      }
                    }
                  }
                }}
              />
              <Button
                variant="contained"
                size="small"
                startIcon={<AddIcon />}
                onClick={() => setAddFoodOpen(true)}
                sx={{ 
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 1 }
                }}
              >
                {/* Show shorter text on mobile */}
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                  Add Food
                </Box>
                <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                  Add
                </Box>
              </Button>
            </Box>

            {/* Daily Summary */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Daily Nutrition Summary
              </Typography>
              
              {/* Basic Macros - Mobile Optimized */}
              <Box mb={3}>
                {/* Main Macros */}
                <Box 
                  display="flex" 
                  flexWrap="wrap" 
                  gap={{ xs: 0.5, sm: 1 }}
                  mb={2}
                  sx={{ 
                    '& > *': { 
                      flex: { xs: '1 1 calc(50% - 2px)', sm: '1 1 calc(25% - 6px)' },
                      minWidth: { xs: '70px', sm: '80px' }
                    }
                  }}
                >
                  <Box textAlign="center" p={{ xs: 0.5, sm: 1 }} bgcolor="primary.50" borderRadius={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                      Calories
                    </Typography>
                    <Typography variant="h6" color="primary.main" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {Math.round(totalNutrition.calories)}
                    </Typography>
                  </Box>
                  <Box textAlign="center" p={{ xs: 0.5, sm: 1 }} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                      Protein
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {Math.round(totalNutrition.protein)}g
                    </Typography>
                  </Box>
                  <Box textAlign="center" p={{ xs: 0.5, sm: 1 }} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                      Carbs
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {Math.round(totalNutrition.carbs)}g
                    </Typography>
                  </Box>
                  <Box textAlign="center" p={{ xs: 0.5, sm: 1 }} bgcolor="grey.50" borderRadius={1}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                      Fat
                    </Typography>
                    <Typography variant="h6" sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      {Math.round(totalNutrition.fat)}g
                    </Typography>
                  </Box>
                </Box>

                {/* Key Micronutrients - More compact for mobile */}
                <Box mb={2}>
                  <Typography 
                    variant="subtitle2" 
                    gutterBottom
                    sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                  >
                    Key Nutrients (vs Daily Targets)
                  </Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                    <Chip 
                      label={`Na: ${Math.round(totalNutrition.sodium || 0)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.sodium, rdv.sodium, true)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                    <Chip 
                      label={`K: ${Math.round(totalNutrition.potassium || 0)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.potassium, rdv.potassium)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                    <Chip 
                      label={`Ca: ${Math.round(totalNutrition.calcium || 0)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.calcium, rdv.calcium)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                    <Chip 
                      label={`Mg: ${Math.round(totalNutrition.magnesium || 0)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.magnesium, rdv.magnesium)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                    <Chip 
                      label={`C: ${(totalNutrition.vitaminC || 0).toFixed(1)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.vitaminC, rdv.vitaminC)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                    <Chip 
                      label={`D: ${(totalNutrition.vitaminD || 0).toFixed(1)}mcg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.vitaminD, rdv.vitaminD)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                    <Chip 
                      label={`Fe: ${(totalNutrition.iron || 0).toFixed(1)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.iron, rdv.iron)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                    <Chip 
                      label={`B12: ${(totalNutrition.vitaminB12 || 0).toFixed(1)}mcg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.vitaminB12, rdv.vitaminB12)}
                      sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                    />
                  </Stack>
                </Box>

                {/* Fat Profile - Show only if there's significant fat content */}
                {totalNutrition.fat > 5 && (
                  <Box mb={2}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      Fat Profile
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                      {totalNutrition.saturatedFat > 0 && (
                        <Chip 
                          label={`Sat: ${(totalNutrition.saturatedFat || 0).toFixed(1)}g`} 
                          size="small" 
                          variant="outlined"
                          color={getNutrientColor(totalNutrition.saturatedFat, rdv.saturatedFat, true)}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                      {totalNutrition.omega3 > 0 && (
                        <Chip 
                          label={`ω-3: ${Math.round(totalNutrition.omega3 || 0)}mg`} 
                          size="small"
                          color={getNutrientColor(totalNutrition.omega3, rdv.omega3)}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                      {totalNutrition.transFat > 0 && (
                        <Chip 
                          label={`Trans: ${(totalNutrition.transFat || 0).toFixed(1)}g`} 
                          size="small"
                          color="error"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                      {totalNutrition.cholesterol > 0 && (
                        <Chip 
                          label={`Chol: ${Math.round(totalNutrition.cholesterol || 0)}mg`} 
                          size="small"
                          color={getNutrientColor(totalNutrition.cholesterol, rdv.cholesterol, true)}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                    </Stack>
                  </Box>
                )}

                {/* B-Vitamins - Show only if present and significant */}
                {(totalNutrition.thiamin > 0.1 || totalNutrition.riboflavin > 0.1 || totalNutrition.niacin > 1 || 
                  totalNutrition.vitaminB6 > 0.1 || totalNutrition.folate > 10 || totalNutrition.vitaminB12 > 0.1) && (
                  <Box mb={2}>
                    <Typography 
                      variant="subtitle2" 
                      gutterBottom
                      sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                    >
                      B-Vitamins
                    </Typography>
                    <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                      {totalNutrition.thiamin > 0.1 && (
                        <Chip 
                          label={`B1: ${(totalNutrition.thiamin || 0).toFixed(1)}mg`} 
                          size="small"
                          color={getNutrientColor(totalNutrition.thiamin, rdv.thiamin)}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                      {totalNutrition.riboflavin > 0.1 && (
                        <Chip 
                          label={`B2: ${(totalNutrition.riboflavin || 0).toFixed(1)}mg`} 
                          size="small"
                          color={getNutrientColor(totalNutrition.riboflavin, rdv.riboflavin)}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                      {totalNutrition.niacin > 1 && (
                        <Chip 
                          label={`B3: ${(totalNutrition.niacin || 0).toFixed(1)}mg`} 
                          size="small"
                          color={getNutrientColor(totalNutrition.niacin, rdv.niacin)}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                      {totalNutrition.folate > 10 && (
                        <Chip 
                          label={`Folate: ${Math.round(totalNutrition.folate || 0)}mcg`} 
                          size="small"
                          color={getNutrientColor(totalNutrition.folate, rdv.folate)}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Color Legend - Simplified */}
                <Box mt={2} p={{ xs: 1, sm: 1.5 }} bgcolor="grey.50" borderRadius={1}>
                  <Typography 
                    variant="caption" 
                    display="block" 
                    gutterBottom 
                    fontWeight="bold"
                    sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}
                  >
                    Color Guide:
                  </Typography>
                  <Stack direction="row" spacing={{ xs: 1, sm: 2 }} flexWrap="wrap" gap={1}>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Chip label="Good" color="success" size="small" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '16px', sm: '20px' } }} />
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>≥100%</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Chip label="OK" color="warning" size="small" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '16px', sm: '20px' } }} />
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>70-99%</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Chip label="Low" color="error" size="small" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '16px', sm: '20px' } }} />
                      <Typography variant="caption" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>&lt;70%</Typography>
                    </Box>
                  </Stack>
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>

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
                  onClick={() => setAddFoodOpen(true)}
                >
                  Add Your First Food
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Smart Food Entry */}
        <SmartFoodEntry
          open={addFoodOpen}
          onClose={() => setAddFoodOpen(false)}
          onFoodsAdded={handleSmartFoodsAdded}
          defaultMealType="breakfast"
          data-tour="smart-food-entry"
        />
      </Box>
    </LocalizationProvider>
  );
}; 