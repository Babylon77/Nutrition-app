import React, { useState } from 'react';
import { Box, Typography, Grid, Tooltip, LinearProgress, Paper, Button, Divider } from '@mui/material';
import {
  LocalFireDepartment as CaloriesIcon,
  FitnessCenter as ProteinIcon,
  Grain as CarbsIcon,
  Opacity as FatIcon,
  Spa as SpaIcon,
  WaterDrop as WaterDropIcon,
  Icecream as IcecreamIcon,
  // Add more icons for key micronutrients if needed
} from '@mui/icons-material';

interface NutritionValue {
  current: number;
  goal: number;
  unit: string;
  label: string;
  IconComponent?: React.ElementType;
  isUpperLimit?: boolean;
  category?: string;
  forcedColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'default' | undefined;
}

interface CompactNutritionSummaryProps {
  totalNutrition: any; // Calculated totals from FoodLog
  recommendedValues: any; // RDVs from FoodLog
  calorieDisplayColor?: 'success' | 'warning' | 'error' | 'default' | undefined; // New prop for specific calorie color
}

const NutrientDisplay: React.FC<NutritionValue & { compact?: boolean }> = ({
  current,
  goal,
  unit,
  label,
  IconComponent,
  isUpperLimit = false,
  compact = false,
  forcedColor,
}) => {
  const visualPercentage = goal > 0 ? (current / goal) * 100 : 0;
  const overPercentage = goal > 0 && current > goal ? ((current - goal) / goal) * 100 : 0;

  let progressColor: 'primary' | 'secondary' | 'error' | 'warning' | 'success' = 'primary';
  let displayText = `${Math.round(current)} / ${Math.round(goal)}${unit}`;

  if (forcedColor && forcedColor !== 'default') {
    progressColor = forcedColor as 'primary' | 'secondary' | 'error' | 'warning' | 'success';
  } else if (isUpperLimit) {
    if (current > goal) {
      progressColor = 'error';
      displayText = `${Math.round(current)}${unit} (Max: ${Math.round(goal)}${unit})`;
    } else if (current > goal * 0.8 && goal > 0) {
      progressColor = 'warning';
    } else {
      progressColor = 'success';
    }
  } else {
    if (goal === 0) {
      progressColor = current > 0 ? 'warning' : 'primary';
    } else if (current >= goal) {
      progressColor = 'success';
    } else if (current >= goal * 0.7) {
      progressColor = 'warning';
    } else {
      progressColor = 'error';
    }
  }
  
  if (compact) {
    return (
      <Tooltip title={`${label}: ${Math.round(current)} / ${Math.round(goal)}${unit}${isUpperLimit && current > goal ? ' - Over Limit!' : ''}${visualPercentage > 100 && !isUpperLimit ? ` - Over Goal by ${(visualPercentage - 100).toFixed(0)}%` : ''}`} placement="top">
        <Box sx={{ textAlign: 'center', width: 80, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {IconComponent && <IconComponent sx={{ fontSize: 24, color: progressColor === 'error' || progressColor === 'warning' ? `var(--color-${progressColor})` : 'var(--color-text-secondary)', mb: 0.5 }} />}
          <Typography variant="caption" display="block" sx={{ fontSize: '0.65rem', fontWeight: 'medium', lineHeight: 1.2, mb: 0.25 }}>
            {label}
          </Typography>
          <Typography variant="caption" display="block" sx={{ fontSize: '0.6rem', color: progressColor === 'error' ? 'var(--color-error)' : 'var(--color-text-secondary)' }}>
            {Math.round(current)}/{Math.round(goal)}{unit.startsWith('%') ? '' : unit}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={Math.min(visualPercentage, 100)}
            color={progressColor} 
            sx={{ height: 3, borderRadius: 2, mt: 0.5, width: '100%' }} 
          />
        </Box>
      </Tooltip>
    );
  }

  return (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
        {IconComponent && <IconComponent sx={{ mr: 1, fontSize: 18, color: 'var(--color-text-secondary)' }} />}
        <Typography variant="body2" sx={{ flexGrow: 1 }}>{label}</Typography>
        <Typography variant="body2" sx={{ fontWeight: 'medium', color: progressColor === 'error' ? 'var(--color-error)' : 'var(--color-text-primary)' }}>
          {displayText}
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={Math.min(visualPercentage, 100)}
        color={progressColor} 
        sx={{ height: 6, borderRadius: 3 }} 
      />
      {overPercentage > 0 && !isUpperLimit && (
         <Typography variant="caption" color={progressColor === 'success' ? 'text.secondary' : progressColor} sx={{textAlign: 'right', display: 'block'}}> 
            (+{overPercentage.toFixed(0)}% over goal)
          </Typography>
      )}
      {overPercentage > 0 && isUpperLimit && (
         <Typography variant="caption" color="error" sx={{textAlign: 'right', display: 'block'}}>
            (+{overPercentage.toFixed(0)}% over limit)
          </Typography>
      )}
    </Box>
  );
};

// Helper function to generate display labels from nutrient keys
const formatNutrientLabel = (key: string): string => {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
};

const nutrientCategories: Record<string, string> = {
  // Macronutrients (already handled by mainMacros)
  fiber: 'Macronutrients',
  sugar: 'Macronutrients',
  // Fat Breakdown
  saturatedFat: 'Fats',
  monounsaturatedFat: 'Fats',
  polyunsaturatedFat: 'Fats',
  transFat: 'Fats',
  omega3: 'Fats',
  omega6: 'Fats',
  cholesterol: 'Fats',
  // Minerals
  sodium: 'Minerals',
  potassium: 'Minerals',
  calcium: 'Minerals',
  magnesium: 'Minerals',
  phosphorus: 'Minerals',
  iron: 'Minerals',
  zinc: 'Minerals',
  selenium: 'Minerals',
  // Vitamins
  vitaminA: 'Vitamins',
  vitaminC: 'Vitamins',
  vitaminD: 'Vitamins',
  vitaminE: 'Vitamins',
  vitaminK: 'Vitamins',
  thiamin: 'Vitamins', // B1
  riboflavin: 'Vitamins', // B2
  niacin: 'Vitamins', // B3
  vitaminB6: 'Vitamins',
  folate: 'Vitamins', // B9
  vitaminB12: 'Vitamins',
  biotin: 'Vitamins',
  pantothenicAcid: 'Vitamins', // B5
  // Additional compounds
  creatine: 'Other Compounds',
};

const CompactNutritionSummary: React.FC<CompactNutritionSummaryProps> = ({
  totalNutrition,
  recommendedValues,
  calorieDisplayColor,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!totalNutrition || !recommendedValues) {
    return <Typography>No nutrition data for summary.</Typography>;
  }

  const mainMacros: NutritionValue[] = [
    {
      label: 'Calories',
      current: totalNutrition.calories || 0,
      goal: recommendedValues.calories || 2000,
      unit: 'kcal',
      IconComponent: CaloriesIcon,
      isUpperLimit: false,
      forcedColor: calorieDisplayColor
    },
    {
      label: 'Protein',
      current: totalNutrition.protein || 0,
      goal: recommendedValues.protein || 50,
      unit: 'g',
      IconComponent: ProteinIcon,
      isUpperLimit: false,
    },
    {
      label: 'Carbs',
      current: totalNutrition.carbs || 0,
      goal: recommendedValues.carbs || 300,
      unit: 'g',
      IconComponent: CarbsIcon,
      isUpperLimit: false,
    },
    {
      label: 'Fat',
      current: totalNutrition.fat || 0,
      goal: recommendedValues.fat || 67,
      unit: 'g',
      IconComponent: FatIcon,
      isUpperLimit: false,
    },
  ];

  const allNutrientsList: NutritionValue[] = Object.keys(totalNutrition)
    .filter(key => key !== 'calories' && key !== 'protein' && key !== 'carbs' && key !== 'fat') // Exclude already displayed main macros
    .map(key => ({
      label: formatNutrientLabel(key),
      current: totalNutrition[key] || 0,
      goal: recommendedValues[key] || 0, // Handle cases where RDV might be missing for a specific nutrient
      unit: recommendedValues[key + '_unit'] || (key.includes('vitamin') || key === 'selenium' || key === 'folate' || key === 'biotin' ? 'mcg' : 'mg'), // Infer unit, default to mg or mcg for vitamins
      IconComponent: undefined, // No icons for all nutrients by default for now
      isUpperLimit: recommendedValues[key + '_isUpperLimit'] || key === 'sodium' || key === 'sugar' || key === 'saturatedFat' || key === 'transFat' || key === 'cholesterol',
      category: nutrientCategories[key] || 'Other Nutrients',
    }))
    .sort((a, b) => {
      if (a.category !== b.category) {
        return (a.category || '').localeCompare(b.category || '');
      }
      return a.label.localeCompare(b.label);
    });
    
  const groupedNutrients: { [category: string]: NutritionValue[] } = {};
  allNutrientsList.forEach(nutrient => {
    const category = nutrient.category || 'Other Nutrients';
    if (!groupedNutrients[category]) {
      groupedNutrients[category] = [];
    }
    groupedNutrients[category].push(nutrient);
  });

  // Example for a few key micronutrients - can be expanded
  const keyMicros: NutritionValue[] = [
     {
      label: 'Fiber',
      current: totalNutrition.fiber || 0,
      goal: recommendedValues.fiber || 25,
      unit: 'g',
      IconComponent: SpaIcon,
    },
    {
      label: 'Sodium',
      current: totalNutrition.sodium || 0,
      goal: recommendedValues.sodium || 2300,
      unit: 'mg',
      IconComponent: WaterDropIcon,
      isUpperLimit: true,
    },
     {
      label: 'Sugar',
      current: totalNutrition.sugar || 0,
      goal: recommendedValues.sugar || 50,
      unit: 'g',
      IconComponent: IcecreamIcon,
      isUpperLimit: true,
    },
  ];

  return (
    <Paper elevation={2} sx={{ p: {xs: 1, sm: 2}, mb: 2, borderRadius: 'var(--border-radius-lg)' }}>
      <Typography variant="h6" gutterBottom sx={{fontSize: {xs: '1rem', sm: '1.25rem'}, fontWeight: 'bold'}}>
        Daily Summary
      </Typography>
      
      <Box 
        sx={{
          display: 'flex',
          flexWrap: 'wrap',
          mx: { xs: -0.5, sm: -1 },
        }}
      >
        {mainMacros.map((nutrient) => (
          <Box 
            key={nutrient.label} 
            sx={{
              p: { xs: 0.5, sm: 1 },
              width: { xs: '100%', sm: '50%', md: '25%' },
              boxSizing: 'border-box',
            }}
          >
            <NutrientDisplay {...nutrient} />
          </Box>
        ))}
      </Box>
      
      <Box sx={{ mt: {xs: 1, sm: 2}, display: 'flex', justifyContent: 'space-around', alignItems: 'flex-start', gap: 1, flexWrap: 'wrap' }}>
         {keyMicros.map((nutrient) => (
          <NutrientDisplay {...nutrient} key={nutrient.label} compact={true} />
        ))}
      </Box>

      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Button onClick={() => setIsExpanded(!isExpanded)} size="small">
          {isExpanded ? 'Show Less Details' : 'Show More Details'}
        </Button>
      </Box>

      {isExpanded && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom sx={{fontSize: {xs: '1rem', sm: '1.125rem'}, fontWeight: 'medium'}}>
            Full Nutrient Breakdown
          </Typography>
          {Object.entries(groupedNutrients).map(([category, nutrientsInCategory]) => (
            <Box key={category} sx={{ mb: 2 }}>
              <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 1, fontWeight: 'bold' }}>
                {category}
              </Typography>
              <Box 
                sx={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  mx: { xs: -0.5, sm: -1 },
                }}
              >
                {nutrientsInCategory.map((nutrient) => (
                  (nutrient.goal > 0 || nutrient.current > 0) && (
                    <Box 
                      key={nutrient.label} 
                      sx={{
                        p: { xs: 0.5, sm: 1 },
                        width: { xs: '100%', sm: '50%', md: '33.33%' },
                        boxSizing: 'border-box',
                      }}
                    >
                       <NutrientDisplay {...nutrient} />
                    </Box>
                  )
                ))}
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default CompactNutritionSummary; 