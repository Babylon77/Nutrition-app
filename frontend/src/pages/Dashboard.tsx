import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  LinearProgress,
  Chip,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Biotech as BiotechIcon,
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { NutritionSummary, BloodworkEntry, Analysis } from '../types';
import CalorieGauge from '../components/visualizations/CalorieGauge';
import MacroProgressBar from '../components/visualizations/MacroProgressBar';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [nutritionSummary, setNutritionSummary] = useState<NutritionSummary | null>(null);
  const [recentBloodwork, setRecentBloodwork] = useState<BloodworkEntry | null>(null);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Fetch nutrition summary for last 7 days
        const nutrition = await apiService.getNutritionSummary(1);
        setNutritionSummary(nutrition);

        // Fetch recent bloodwork
        try {
          const bloodworkResponse = await apiService.getBloodworkEntries(1, 1);
          if (bloodworkResponse.data.length > 0) {
            setRecentBloodwork(bloodworkResponse.data[0]);
          }
        } catch (err) {
          // No bloodwork found, that's okay
        }

        // Fetch recent analyses
        try {
          const analysesResponse = await apiService.getAnalyses(1, 3);
          setRecentAnalyses(analysesResponse.data);
        } catch (err) {
          // No analyses found, that's okay
        }

      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const calculateCalorieProgress = () => {
    if (!nutritionSummary) return 0;
    
    // Use suggested calories if available, otherwise fall back to goalCalories
    const targetCalories = getSuggestedCalories() || nutritionSummary.goalCalories;
    if (!targetCalories) return 0;
    
    return Math.min((nutritionSummary.totalCalories / targetCalories) * 100, 100);
  };

  const getSuggestedCalories = () => {
    if (!user?.weight || !user?.weightGoal || !user?.weightGoalTimeframe || !user?.height || !user?.gender || !user?.activityLevel || !user?.dateOfBirth) {
      return null;
    }

    // Calculate age
    const age = Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000));

    // Calculate BMR using Mifflin-St Jeor Equation (weight in kg, height in cm)
    let bmr: number;
    if (user.gender === 'male') {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * age + 5;
    } else {
      bmr = 10 * user.weight + 6.25 * user.height - 5 * age - 161;
    }

    // More conservative activity level multipliers (slightly lower than standard)
    const activityMultipliers = {
      sedentary: 1.15, // Reduced from 1.2
      lightly_active: 1.3, // Reduced from 1.375
      moderately_active: 1.45, // Reduced from 1.55
      very_active: 1.6, // Reduced from 1.725
      extra_active: 1.75 // Reduced from 1.9
    };

    const maintenanceCalories = bmr * activityMultipliers[user.activityLevel];
    
    // Convert weight to lbs for goal calculation
    const currentWeightLbs = user.weight * 2.20462;
    const weightChange = currentWeightLbs - user.weightGoal;
    const weeklyWeightChange = weightChange / user.weightGoalTimeframe;
    
    // Cap weekly weight loss at 2 lbs/week for safety (recommended maximum)
    const safeWeeklyWeightChange = Math.min(Math.abs(weeklyWeightChange), 2) * Math.sign(weeklyWeightChange);
    
    // 1 pound = ~3500 calories, so daily calorie adjustment
    const dailyCalorieAdjustment = (safeWeeklyWeightChange * 3500) / 7;
    
    const suggestedCalories = Math.round(maintenanceCalories - dailyCalorieAdjustment);
    
    // Don't allow extremely low calorie targets (minimum 1200 for women, 1500 for men)
    const minimumCalories = user.gender === 'male' ? 1500 : 1200;
    
    return Math.max(suggestedCalories, minimumCalories);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'error';
    if (percentage < 80) return 'warning';
    return 'success';
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome back, {user?.firstName}!
      </Typography>
      
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Here's your nutrition and health overview
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* Top Row - Nutrition and Bloodwork Cards */}
        <Box sx={{ 
          display: 'flex', 
          gap: 3, 
          flexDirection: { xs: 'column', md: 'row' },
          '& > *': { flex: 1 }
        }}>
          {/* Nutrition Summary Card */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <RestaurantIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Today's Nutrition Summary</Typography>
              </Box>
              
              {nutritionSummary ? (
                <Box>
                  {/* Calorie Gauge */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 3 }}>
                    <CalorieGauge
                      current={nutritionSummary.averageCalories}
                      goal={getSuggestedCalories() || nutritionSummary.goalCalories || 2000}
                      size="md"
                    />
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        Today's Calories
                      </Typography>
                      <Typography variant="h4">
                        {Math.round(nutritionSummary.averageCalories)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {getSuggestedCalories() ? (
                          <>Goal: {getSuggestedCalories()} calories (weight goal)</>
                        ) : (
                          <>Goal: {nutritionSummary.goalCalories} calories</>
                        )}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Macro Progress Bar */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Today's Macronutrient Breakdown
                    </Typography>
                    <MacroProgressBar
                      data={{
                        protein: { 
                          current: Math.round(nutritionSummary.totalProtein), 
                          goal: Math.round((nutritionSummary.totalCalories * 0.25) / 4) // 25% of calories from protein
                        },
                        carbs: { 
                          current: Math.round(nutritionSummary.totalCarbs), 
                          goal: Math.round((nutritionSummary.totalCalories * 0.45) / 4) // 45% of calories from carbs
                        },
                        fat: { 
                          current: Math.round(nutritionSummary.totalFat), 
                          goal: Math.round((nutritionSummary.totalCalories * 0.30) / 9) // 30% of calories from fat
                        }
                      }}
                      height="md"
                      animated={true}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip 
                      label={"Today"} 
                      color="primary" 
                      size="small"
                    />
                    <Chip 
                      label={`${Math.round(nutritionSummary.totalProtein)}g protein`} 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      label={`${Math.round(nutritionSummary.totalCarbs)}g carbs`} 
                      variant="outlined" 
                      size="small"
                    />
                    <Chip 
                      label={`${Math.round(nutritionSummary.totalFat)}g fat`} 
                      variant="outlined" 
                      size="small"
                    />
                  </Box>
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="text.secondary">
                    No nutrition data available
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Start logging your meals to see your nutrition summary
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" href="/food-log">
                Log Food
              </Button>
              <Button size="small" href="/analysis">
                View Analysis
              </Button>
            </CardActions>
          </Card>

          {/* Bloodwork Status Card */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BiotechIcon color="primary" sx={{ mr: 1 }} />
                <Typography variant="h6">Health Metrics</Typography>
              </Box>
              
              {recentBloodwork ? (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Latest Test: {new Date(recentBloodwork.date).toLocaleDateString()}
                  </Typography>
                  
                  <Box mt={2}>
                    <Typography variant="body2" gutterBottom>Lab Values:</Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {recentBloodwork.labValues.slice(0, 4).map((lab, index) => (
                        <Chip
                          key={index}
                          label={`${lab.name}: ${lab.value} ${lab.unit}`}
                          size="small"
                          color={lab.status && lab.status !== 'normal' ? 'warning' : 'default'}
                          icon={lab.status && lab.status !== 'normal' ? <WarningIcon /> : <CheckCircleIcon />}
                        />
                      ))}
                      {recentBloodwork.labValues.length > 4 && (
                        <Chip
                          label={`+${recentBloodwork.labValues.length - 4} more`}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              ) : (
                <Box textAlign="center" py={3}>
                  <Typography variant="body2" color="text.secondary">
                    No health metrics data available
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Upload your lab results to track your health markers
                  </Typography>
                </Box>
              )}
            </CardContent>
            <CardActions>
              <Button size="small" href="/bloodwork">
                {recentBloodwork ? 'View Health Metrics' : 'Upload Results'}
              </Button>
              {recentBloodwork && (
                <Button size="small" href="/analysis">
                  Analyze
                </Button>
              )}
            </CardActions>
          </Card>
        </Box>

        {/* Recent Insights Card */}
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <AnalyticsIcon color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Recent AI Insights</Typography>
            </Box>
            
            {recentAnalyses.length > 0 ? (
              <List>
                {recentAnalyses.map((analysis, index) => (
                  <React.Fragment key={analysis._id}>
                    <ListItem alignItems="flex-start">
                      <ListItemIcon>
                        <TrendingUpIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography variant="subtitle2">
                              {analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)} Analysis
                            </Typography>
                            <Chip
                              label={new Date(analysis.date).toLocaleDateString()}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Box mt={1}>
                            {analysis.insights.slice(0, 2).map((insight, idx) => (
                              <Typography
                                key={idx}
                                variant="body2"
                                color="text.secondary"
                                sx={{ mb: 0.5 }}
                              >
                                • {insight}
                              </Typography>
                            ))}
                            {analysis.recommendations.length > 0 && (
                              <Typography variant="caption" color="primary">
                                {analysis.recommendations.length} recommendations available
                              </Typography>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentAnalyses.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box textAlign="center" py={3}>
                <Typography variant="body2" color="text.secondary">
                  No AI insights available yet
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Log your food and upload health metrics to get personalized insights
                </Typography>
              </Box>
            )}
          </CardContent>
          <CardActions>
            <Button size="small" href="/analysis">
              View All Analyses
            </Button>
            {nutritionSummary && nutritionSummary.daysLogged > 0 && (
              <Button size="small" variant="contained">
                Generate New Analysis
              </Button>
            )}
          </CardActions>
        </Card>

        {/* Quick Actions */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <Box display="flex" gap={2} flexWrap="wrap">
              <Button
                variant="contained"
                startIcon={<RestaurantIcon />}
                href="/food-log"
              >
                Log Today's Meals
              </Button>
              <Button
                variant="outlined"
                startIcon={<BiotechIcon />}
                href="/bloodwork"
              >
                Upload Lab Results
              </Button>
              <Button
                variant="outlined"
                startIcon={<AnalyticsIcon />}
                href="/analysis"
                disabled={!nutritionSummary || nutritionSummary.daysLogged === 0}
              >
                Generate Analysis
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}; 
