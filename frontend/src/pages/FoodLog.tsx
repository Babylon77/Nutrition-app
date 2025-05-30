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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  LocalDining as LocalDiningIcon,
  Coffee as CoffeeIcon,
  Fastfood as FastFoodIcon,
  RoomService as DinnerIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';

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
  foodQuery: string;
  quantity: number;
  unit: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

// New interface for pending foods (before AI analysis)
interface PendingFoodItem {
  id: string; // Temporary ID for managing the pending list
  foodQuery: string;
  quantity: number;
  unit: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snacks';
}

// Bulk analysis result from backend
interface BulkAnalysisResult {
  analyzedFoods: {
    id: string; // Matches pending food ID
    name: string;
    normalizedName: string;
    quantity: number;
    unit: string;
    nutrition: EnhancedNutrition;
    confidence: number;
    weightConversion?: WeightConversion;
  }[];
  totalApiCost?: number;
  processingTime?: number;
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
  
  // New state for bulk food entry
  const [pendingFoods, setPendingFoods] = useState<PendingFoodItem[]>([]);
  const [bulkAnalyzing, setBulkAnalyzing] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<AddFoodFormData>({
    defaultValues: {
      foodQuery: '',
      quantity: 1,
      unit: 'serving',
      mealType: 'breakfast',
    },
  });

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

  // Handle date change
  const handleDateChange = (newDate: Date | null) => {
    if (newDate) {
      setSelectedDate(newDate);
    }
  };

  // New function: Add food to pending list instead of immediate analysis
  const addToPendingList = (data: AddFoodFormData) => {
    if (!data.foodQuery.trim()) {
      setError('Please enter a food item');
      return;
    }

    const newPendingFood: PendingFoodItem = {
      id: `pending-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      foodQuery: data.foodQuery,
      quantity: data.quantity,
      unit: data.unit,
      mealType: data.mealType,
    };

    setPendingFoods(prev => [...prev, newPendingFood]);
    reset();
    setError('');
  };

  // Remove food from pending list
  const removePendingFood = (id: string) => {
    setPendingFoods(prev => prev.filter(food => food.id !== id));
  };

  // Clear all pending foods
  const clearPendingFoods = () => {
    setPendingFoods([]);
  };

  // Bulk analyze all pending foods
  const analyzePendingFoods = async () => {
    if (pendingFoods.length === 0) {
      setError('No pending foods to analyze');
      return;
    }

    try {
      setBulkAnalyzing(true);
      setError('');

      // Call new bulk analysis API endpoint
      const response = await fetch('/api/food/bulk-lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          foods: pendingFoods.map(food => ({
            id: food.id,
            foodQuery: food.foodQuery,
            quantity: food.quantity,
            unit: food.unit,
            mealType: food.mealType,
          }))
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze foods');
      }

      const result: { data: BulkAnalysisResult } = await response.json();
      
      console.log('🔍 Bulk Analysis Result:', result.data);
      
      // Convert analyzed foods to EnhancedFoodItem format
      const newFoodItems: EnhancedFoodItem[] = result.data.analyzedFoods.map(food => ({
        name: food.name,
        quantity: food.quantity,
        unit: food.unit,
        mealType: pendingFoods.find(p => p.id === food.id)?.mealType || 'breakfast',
        nutrition: food.nutrition,
        confidence: food.confidence,
        weightConversion: food.weightConversion,
      }));

      // Update local state with new foods
      const updatedItems = [...foodItems, ...newFoodItems];
      setFoodItems(updatedItems);
      
      // Save to backend
      await saveFoodLogs(selectedDate, updatedItems);
      
      // Clear pending foods and close dialog
      clearPendingFoods();
      setAddFoodOpen(false);
      
      // Show success message with cost savings info
      if (result.data.totalApiCost) {
        console.log(`💰 API Cost: $${result.data.totalApiCost.toFixed(4)} (saved ${(newFoodItems.length - 1) * 0.002} vs individual calls)`);
      }
      
    } catch (err: any) {
      setError(err.message || 'Failed to analyze foods');
    } finally {
      setBulkAnalyzing(false);
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
            <Typography variant="h6">{title}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
              {mealItems.reduce((sum, item) => sum + (item.nutrition.calories || 0), 0).toFixed(0)} cal
            </Typography>
          </Box>
          
          <Stack spacing={2}>
            {mealItems.map((item, index) => (
              <Card key={index} variant="outlined" sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {item.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {item.quantity} {item.unit}
                      {item.weightConversion && item.weightConversion.grams && item.weightConversion.ounces && (
                        <span> • {(item.weightConversion.grams || 0).toFixed(0)}g ({(item.weightConversion.ounces || 0).toFixed(1)}oz)</span>
                      )}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => removeFoodItem(foodItems.indexOf(item))}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>

                {/* Macronutrients */}
                <Box mb={2}>
                  <Typography variant="subtitle2" gutterBottom>
                    Macronutrients
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    <Chip label={`${Math.round(item.nutrition.calories || 0)} cal`} size="small" />
                    <Chip label={`${(item.nutrition.protein || 0).toFixed(1)}g protein`} size="small" />
                    <Chip label={`${(item.nutrition.carbs || 0).toFixed(1)}g carbs`} size="small" />
                    <Chip label={`${(item.nutrition.fat || 0).toFixed(1)}g fat`} size="small" />
                    {(item.nutrition.fiber || 0) > 0 && (
                      <Chip label={`${(item.nutrition.fiber || 0).toFixed(1)}g fiber`} size="small" />
                    )}
                    {(item.nutrition.sugar || 0) > 0 && (
                      <Chip label={`${(item.nutrition.sugar || 0).toFixed(1)}g sugar`} size="small" />
                    )}
                  </Stack>
                </Box>

                {/* Fat Breakdown */}
                {((item.nutrition.fat || 0) > 0 || 
                  (item.nutrition.saturatedFat || 0) > 0 || 
                  (item.nutrition.monounsaturatedFat || 0) > 0 || 
                  (item.nutrition.polyunsaturatedFat || 0) > 0 || 
                  (item.nutrition.omega3 || 0) > 0 || 
                  (item.nutrition.omega6 || 0) > 0 || 
                  (item.nutrition.transFat || 0) > 0) && (
                  <Box mb={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Fat Breakdown
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
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
                        <Chip label={`${(item.nutrition.transFat || 0).toFixed(1)}g trans`} size="small" />
                      )}
                    </Stack>
                  </Box>
                )}

                {/* Key Micronutrients */}
                {(item.nutrition.calories || 0) > 10 && (
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Key Micronutrients
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                      {/* Always show sodium if present */}
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
                      {(item.nutrition.selenium || 0) > 0 && (
                        <Chip label={`${(item.nutrition.selenium || 0).toFixed(0)}mcg selenium`} size="small" />
                      )}
                      
                      {/* Vitamins */}
                      {(item.nutrition.vitaminA || 0) > 0 && (
                        <Chip label={`${Math.round(item.nutrition.vitaminA || 0)}mcg Vit A`} size="small" />
                      )}
                      {(item.nutrition.vitaminC || 0) > 0 && (
                        <Chip label={`${(item.nutrition.vitaminC || 0).toFixed(1)}mg Vit C`} size="small" />
                      )}
                      {(item.nutrition.vitaminD || 0) > 0 && (
                        <Chip label={`${(item.nutrition.vitaminD || 0).toFixed(1)}mcg Vit D`} size="small" />
                      )}
                      {(item.nutrition.vitaminE || 0) > 0 && (
                        <Chip label={`${(item.nutrition.vitaminE || 0).toFixed(1)}mg Vit E`} size="small" />
                      )}
                      {(item.nutrition.vitaminK || 0) > 0 && (
                        <Chip label={`${(item.nutrition.vitaminK || 0).toFixed(0)}mcg Vit K`} size="small" />
                      )}
                      
                      {/* B Vitamins */}
                      {(item.nutrition.thiamin || 0) > 0 && (
                        <Chip label={`${(item.nutrition.thiamin || 0).toFixed(1)}mg B1`} size="small" />
                      )}
                      {(item.nutrition.riboflavin || 0) > 0 && (
                        <Chip label={`${(item.nutrition.riboflavin || 0).toFixed(1)}mg B2`} size="small" />
                      )}
                      {(item.nutrition.niacin || 0) > 0 && (
                        <Chip label={`${(item.nutrition.niacin || 0).toFixed(1)}mg B3`} size="small" />
                      )}
                      {(item.nutrition.vitaminB6 || 0) > 0 && (
                        <Chip label={`${(item.nutrition.vitaminB6 || 0).toFixed(1)}mg B6`} size="small" />
                      )}
                      {(item.nutrition.folate || 0) > 0 && (
                        <Chip label={`${Math.round(item.nutrition.folate || 0)}mcg folate`} size="small" />
                      )}
                      {(item.nutrition.vitaminB12 || 0) > 0 && (
                        <Chip label={`${(item.nutrition.vitaminB12 || 0).toFixed(1)}mcg B12`} size="small" />
                      )}
                      
                      {/* Special compounds */}
                      {(item.nutrition.creatine || 0) > 0 && (
                        <Chip label={`${(item.nutrition.creatine || 0).toFixed(2)}g creatine`} size="small" />
                      )}
                      {(item.nutrition.cholesterol || 0) > 0 && (
                        <Chip label={`${Math.round(item.nutrition.cholesterol || 0)}mg cholesterol`} size="small" />
                      )}
                      
                      {/* Debug: Show if no micronutrients found */}
                      {!(item.nutrition.sodium || 0) && !(item.nutrition.potassium || 0) && 
                       !(item.nutrition.calcium || 0) && !(item.nutrition.magnesium || 0) && 
                       !(item.nutrition.iron || 0) && !(item.nutrition.zinc || 0) && 
                       !(item.nutrition.vitaminA || 0) && !(item.nutrition.vitaminC || 0) && 
                       !(item.nutrition.vitaminD || 0) && (
                        <Chip 
                          label="No micronutrient data available" 
                          size="small" 
                          variant="outlined" 
                          color="warning"
                        />
                      )}
                    </Stack>
                  </Box>
                )}
              </Card>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom>
          Enhanced Food Log
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
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
              />
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setAddFoodOpen(true)}
                color={pendingFoods.length > 0 ? "secondary" : "primary"}
              >
                {pendingFoods.length > 0 ? `Build List (${pendingFoods.length} foods)` : 'Add Foods'}
              </Button>
            </Box>

            {/* Daily Summary */}
            <Box>
              <Typography variant="h6" gutterBottom>
                Daily Nutrition Summary
              </Typography>
              
              {/* Basic Macros */}
              <Box display="flex" gap={3} mb={3} flexWrap="wrap">
                <Box>
                  <Typography variant="body2" color="text.secondary">Calories</Typography>
                  <Typography variant="h6">{Math.round(totalNutrition.calories)}</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Protein</Typography>
                  <Typography variant="h6">{Math.round(totalNutrition.protein)}g</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Carbs</Typography>
                  <Typography variant="h6">{Math.round(totalNutrition.carbs)}g</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Fat</Typography>
                  <Typography variant="h6">{Math.round(totalNutrition.fat)}g</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Fiber</Typography>
                  <Typography variant="h6">{Math.round(totalNutrition.fiber)}g</Typography>
                </Box>
                <Box>
                  <Typography variant="body2" color="text.secondary">Sugar</Typography>
                  <Typography variant="h6">{Math.round(totalNutrition.sugar)}g</Typography>
                </Box>
              </Box>

              {/* Fat Breakdown */}
              {totalNutrition.fat > 0 && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Fat Profile
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {totalNutrition.saturatedFat > 0 && (
                      <Chip 
                        label={`Saturated: ${(totalNutrition.saturatedFat || 0).toFixed(1)}g`} 
                        size="small" 
                        variant="outlined"
                        color={getNutrientColor(totalNutrition.saturatedFat, rdv.saturatedFat, true)}
                      />
                    )}
                    {totalNutrition.monounsaturatedFat > 0 && (
                      <Chip label={`Mono: ${(totalNutrition.monounsaturatedFat || 0).toFixed(1)}g`} size="small" variant="outlined" />
                    )}
                    {totalNutrition.polyunsaturatedFat > 0 && (
                      <Chip label={`Poly: ${(totalNutrition.polyunsaturatedFat || 0).toFixed(1)}g`} size="small" variant="outlined" />
                    )}
                    {totalNutrition.omega3 > 0 && (
                      <Chip 
                        label={`Omega-3: ${Math.round(totalNutrition.omega3 || 0)}mg`} 
                        size="small"
                        color={getNutrientColor(totalNutrition.omega3, rdv.omega3)}
                      />
                    )}
                    {totalNutrition.omega6 > 0 && (
                      <Chip label={`Omega-6: ${Math.round(totalNutrition.omega6 || 0)}mg`} size="small" />
                    )}
                    {totalNutrition.transFat > 0 && (
                      <Chip 
                        label={`Trans: ${(totalNutrition.transFat || 0).toFixed(1)}g`} 
                        size="small"
                        color="error"
                      />
                    )}
                    {totalNutrition.cholesterol > 0 && (
                      <Chip 
                        label={`Cholesterol: ${Math.round(totalNutrition.cholesterol || 0)}mg`} 
                        size="small"
                        color={getNutrientColor(totalNutrition.cholesterol, rdv.cholesterol, true)}
                      />
                    )}
                  </Stack>
                </Box>
              )}

              {/* Hydration & Electrolytes */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Hydration & Electrolytes
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip 
                    label={`Sodium: ${Math.round(totalNutrition.sodium || 0)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.sodium, rdv.sodium, true)}
                  />
                  <Chip 
                    label={`Potassium: ${Math.round(totalNutrition.potassium || 0)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.potassium, rdv.potassium)}
                  />
                  <Chip 
                    label={`Magnesium: ${Math.round(totalNutrition.magnesium || 0)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.magnesium, rdv.magnesium)}
                  />
                  <Chip 
                    label={`Calcium: ${Math.round(totalNutrition.calcium || 0)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.calcium, rdv.calcium)}
                  />
                  {totalNutrition.phosphorus > 0 && (
                    <Chip 
                      label={`Phosphorus: ${Math.round(totalNutrition.phosphorus || 0)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.phosphorus, rdv.phosphorus)}
                    />
                  )}
                </Stack>
              </Box>

              {/* Immune System Support */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  Immune System & Antioxidants
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  <Chip 
                    label={`Vitamin C: ${(totalNutrition.vitaminC || 0).toFixed(1)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.vitaminC, rdv.vitaminC)}
                  />
                  <Chip 
                    label={`Vitamin D: ${(totalNutrition.vitaminD || 0).toFixed(1)}mcg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.vitaminD, rdv.vitaminD)}
                  />
                  <Chip 
                    label={`Vitamin E: ${(totalNutrition.vitaminE || 0).toFixed(1)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.vitaminE, rdv.vitaminE)}
                  />
                  <Chip 
                    label={`Vitamin A: ${Math.round(totalNutrition.vitaminA || 0)}mcg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.vitaminA, rdv.vitaminA)}
                  />
                  <Chip 
                    label={`Zinc: ${(totalNutrition.zinc || 0).toFixed(1)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.zinc, rdv.zinc)}
                  />
                  <Chip 
                    label={`Selenium: ${(totalNutrition.selenium || 0).toFixed(0)}mcg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.selenium, rdv.selenium)}
                  />
                  <Chip 
                    label={`Iron: ${(totalNutrition.iron || 0).toFixed(1)}mg`} 
                    size="small"
                    color={getNutrientColor(totalNutrition.iron, rdv.iron)}
                  />
                </Stack>
              </Box>

              {/* B-Vitamin Complex */}
              <Box mb={3}>
                <Typography variant="subtitle2" gutterBottom>
                  B-Vitamin Complex (Energy & Metabolism)
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                  {totalNutrition.thiamin > 0 && (
                    <Chip 
                      label={`B1 (Thiamin): ${(totalNutrition.thiamin || 0).toFixed(1)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.thiamin, rdv.thiamin)}
                    />
                  )}
                  {totalNutrition.riboflavin > 0 && (
                    <Chip 
                      label={`B2 (Riboflavin): ${(totalNutrition.riboflavin || 0).toFixed(1)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.riboflavin, rdv.riboflavin)}
                    />
                  )}
                  {totalNutrition.niacin > 0 && (
                    <Chip 
                      label={`B3 (Niacin): ${(totalNutrition.niacin || 0).toFixed(1)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.niacin, rdv.niacin)}
                    />
                  )}
                  {totalNutrition.pantothenicAcid > 0 && (
                    <Chip 
                      label={`B5: ${(totalNutrition.pantothenicAcid || 0).toFixed(1)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.pantothenicAcid, rdv.pantothenicAcid)}
                    />
                  )}
                  {totalNutrition.vitaminB6 > 0 && (
                    <Chip 
                      label={`B6: ${(totalNutrition.vitaminB6 || 0).toFixed(1)}mg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.vitaminB6, rdv.vitaminB6)}
                    />
                  )}
                  {totalNutrition.biotin > 0 && (
                    <Chip 
                      label={`B7 (Biotin): ${(totalNutrition.biotin || 0).toFixed(0)}mcg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.biotin, rdv.biotin)}
                    />
                  )}
                  {totalNutrition.folate > 0 && (
                    <Chip 
                      label={`B9 (Folate): ${Math.round(totalNutrition.folate || 0)}mcg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.folate, rdv.folate)}
                    />
                  )}
                  {totalNutrition.vitaminB12 > 0 && (
                    <Chip 
                      label={`B12: ${(totalNutrition.vitaminB12 || 0).toFixed(1)}mcg`} 
                      size="small"
                      color={getNutrientColor(totalNutrition.vitaminB12, rdv.vitaminB12)}
                    />
                  )}
                </Stack>
              </Box>

              {/* Performance & Special Compounds */}
              {(totalNutrition.creatine > 0 || totalNutrition.vitaminK > 0) && (
                <Box mb={3}>
                  <Typography variant="subtitle2" gutterBottom>
                    Performance & Health Compounds
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {totalNutrition.creatine > 0 && (
                      <Chip 
                        label={`Creatine: ${(totalNutrition.creatine || 0).toFixed(2)}g`} 
                        size="small"
                        color={getNutrientColor(totalNutrition.creatine, rdv.creatine)}
                      />
                    )}
                    {totalNutrition.vitaminK > 0 && (
                      <Chip 
                        label={`Vitamin K: ${(totalNutrition.vitaminK || 0).toFixed(0)}mcg`} 
                        size="small"
                        color={getNutrientColor(totalNutrition.vitaminK, rdv.vitaminK)}
                      />
                    )}
                  </Stack>
                </Box>
              )}

              {/* Color Legend */}
              <Box mt={2} p={2} bgcolor="grey.50" borderRadius={1}>
                <Typography variant="caption" display="block" gutterBottom fontWeight="bold">
                  Color Guide:
                </Typography>
                <Stack direction="row" spacing={2} flexWrap="wrap" gap={1}>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip label="Meeting target" color="success" size="small" />
                    <Typography variant="caption">≥100% RDA</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip label="Partial" color="warning" size="small" />
                    <Typography variant="caption">70-99% RDA</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip label="Low" color="error" size="small" />
                    <Typography variant="caption">&lt;70% RDA</Typography>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Chip label="Neutral" size="small" />
                    <Typography variant="caption">Individual foods</Typography>
                  </Box>
                </Stack>
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

        {/* Add Food Dialog */}
        <Dialog open={addFoodOpen} onClose={() => setAddFoodOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Add Food Item</DialogTitle>
          <form>
            <DialogContent>
              <Stack spacing={3} sx={{ pt: 1 }}>
                <Alert severity="info">
                  <Typography variant="body2" fontWeight="bold" gutterBottom>
                    💡 For best results and cost savings: Add multiple foods to your list, then analyze all at once!
                  </Typography>
                  <Typography variant="body2">
                    Simply type any food (e.g., "grilled chicken breast", "1 medium apple", "homemade pizza slice") 
                    and our AI will analyze its complete nutritional profile including vitamins and minerals.
                  </Typography>
                </Alert>

                <Controller
                  name="foodQuery"
                  control={control}
                  rules={{ required: 'Please enter a food item' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Food Item"
                      placeholder="e.g., grilled salmon fillet, 1 cup cooked rice"
                      error={!!errors.foodQuery}
                      helperText={errors.foodQuery?.message}
                      fullWidth
                    />
                  )}
                />

                <Box display="flex" gap={2}>
                  <Controller
                    name="quantity"
                    control={control}
                    rules={{ required: 'Quantity required', min: 0.1 }}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Quantity"
                        type="number"
                        inputProps={{ step: 0.1, min: 0.1 }}
                        error={!!errors.quantity}
                        helperText={errors.quantity?.message}
                        sx={{ flex: 1 }}
                      />
                    )}
                  />

                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Unit"
                        select
                        sx={{ flex: 1 }}
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
                    )}
                  />
                </Box>

                <Controller
                  name="mealType"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Meal Type"
                      select
                      fullWidth
                    >
                      <MenuItem value="breakfast">🌅 Breakfast</MenuItem>
                      <MenuItem value="lunch">🌞 Lunch</MenuItem>
                      <MenuItem value="dinner">🌙 Dinner</MenuItem>
                      <MenuItem value="snacks">🍎 Snacks</MenuItem>
                    </TextField>
                  )}
                />
              </Stack>
            </DialogContent>
            <DialogActions sx={{ flexDirection: 'column', gap: 1, alignItems: 'stretch', px: 3, pb: 2 }}>
              <Box display="flex" gap={1}>
                <Button onClick={() => setAddFoodOpen(false)} sx={{ flex: 1 }}>
                  Cancel
                </Button>
                
                {/* Single action: Add to list */}
                <Button 
                  onClick={handleSubmit(addToPendingList)}
                  variant="contained"
                  startIcon={<AddIcon />}
                  color="primary"
                  sx={{ flex: 2 }}
                >
                  Add to List ({pendingFoods.length})
                </Button>
              </Box>
            </DialogActions>
          </form>
          
          {/* Pending Foods Section - Always show when there are pending foods */}
          {pendingFoods.length > 0 && (
            <>
              <Divider />
              <DialogContent sx={{ pt: 2, pb: 1 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                  <Typography variant="h6">
                    Your Food List ({pendingFoods.length})
                  </Typography>
                  <Button 
                    onClick={clearPendingFoods}
                    variant="outlined"
                    color="error"
                    size="small"
                  >
                    Clear All
                  </Button>
                </Box>
                
                <List dense sx={{ bgcolor: 'grey.50', borderRadius: 1, mb: 2, maxHeight: 200, overflow: 'auto' }}>
                  {pendingFoods.map((food) => (
                    <ListItem key={food.id}>
                      <ListItemText
                        primary={`${food.quantity} ${food.unit} ${food.foodQuery}`}
                        secondary={`${food.mealType.charAt(0).toUpperCase() + food.mealType.slice(1)}`}
                      />
                      <ListItemSecondaryAction>
                        <IconButton 
                          edge="end" 
                          aria-label="delete"
                          onClick={() => removePendingFood(food.id)}
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
                
                <Box display="flex" justifyContent="center">
                  <Button 
                    onClick={analyzePendingFoods}
                    variant="contained"
                    disabled={bulkAnalyzing || pendingFoods.length === 0}
                    startIcon={bulkAnalyzing ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                    color="primary"
                    size="large"
                    sx={{ minWidth: 200 }}
                  >
                    {bulkAnalyzing ? 'Analyzing All...' : `Analyze All ${pendingFoods.length} Foods`}
                  </Button>
                </Box>
                
                {pendingFoods.length > 1 && (
                  <Alert severity="success" sx={{ mt: 2 }}>
                    <Typography variant="body2">
                      💰 Bulk analysis saves API costs! {pendingFoods.length} foods = 1 API call instead of {pendingFoods.length}.
                    </Typography>
                  </Alert>
                )}
              </DialogContent>
            </>
          )}
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}; 