import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
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
  const [allBloodworkEntries, setAllBloodworkEntries] = useState<BloodworkEntry[]>([]);
  const [recentAnalyses, setRecentAnalyses] = useState<Analysis[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError('');

        // Get today's food log directly (more reliable than summary endpoint)
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log('📅 Dashboard - Fetching food log for date:', today);
        
        try {
          const todaysFoodLog = await apiService.getFoodLogByDate(today);
          console.log('🍎 Dashboard - Today\'s food log:', todaysFoodLog);
          
          if (todaysFoodLog && todaysFoodLog.totalNutrition) {
            // Convert food log data to nutrition summary format
            const nutritionData = {
              daysLogged: 1,
              totalCalories: todaysFoodLog.totalNutrition.calories || 0,
              totalProtein: todaysFoodLog.totalNutrition.protein || 0,
              totalCarbs: todaysFoodLog.totalNutrition.carbs || 0,
              totalFat: todaysFoodLog.totalNutrition.fat || 0,
              totalFiber: todaysFoodLog.totalNutrition.fiber || 0,
              averageCalories: todaysFoodLog.totalNutrition.calories || 0,
              goalCalories: 2000
            };
            console.log('✅ Dashboard - Nutrition data:', nutritionData);
            setNutritionSummary(nutritionData);
          } else {
            console.log('📝 Dashboard - No food logged for today');
            // Set empty nutrition summary
            setNutritionSummary({
              daysLogged: 0,
              totalCalories: 0,
              totalProtein: 0,
              totalCarbs: 0,
              totalFat: 0,
              totalFiber: 0,
              averageCalories: 0,
              goalCalories: 2000
            });
          }
        } catch (err) {
          console.log('⚠️ Dashboard - Error fetching today\'s food log:', err);
          // Fallback to nutrition summary endpoint
          const nutrition = await apiService.getNutritionSummary(1);
          console.log('🔄 Dashboard - Fallback nutrition summary:', nutrition);
          setNutritionSummary(nutrition);
        }

        // Fetch recent bloodwork (for detailed display if needed)
        try {
          const bloodworkResponse = await apiService.getBloodworkEntries(1, 1);
          if (bloodworkResponse.data.length > 0) {
            setRecentBloodwork(bloodworkResponse.data[0]);
          }
        } catch (err) {
          // No bloodwork found, that's okay
        }

        // Fetch all bloodwork entries for summary
        try {
          const allBloodworkResponse = await apiService.getBloodworkEntries(1, 100); // Fetch up to 100 entries
          setAllBloodworkEntries(allBloodworkResponse.data);
        } catch (err) {
          console.error("Failed to fetch all bloodwork entries for summary:", err);
          // Handle error if necessary, e.g., set an error state or display a message
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
                  {/* Calorie Gauge and Goal */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ width: '100%', maxWidth: { xs: '240px', sm: '300px', md: '380px' }, mb: 0.5, mx: 'auto' }}> {/* Increased maxWidth for larger gauge */}
                        <CalorieGauge
                          current={nutritionSummary.totalCalories}
                          goal={getSuggestedCalories() || nutritionSummary.goalCalories || 2000}
                          size="lg"
                          showLabels={false} // Hide internal labels
                        />
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 2 }}> {/* Added margin bottom */}
                        Goal: {Math.round(getSuggestedCalories() || nutritionSummary.goalCalories || 2000)} cal
                    </Typography>
                  </Box>

                  {/* Progress and Remaining Stats - Replaced cards with a single Box */}
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-around', // Distribute space
                      gap: 2, 
                      mb: 3, 
                      textAlign: 'center'
                    }}
                  >
                    <Box>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {((nutritionSummary.totalCalories / (getSuggestedCalories() || nutritionSummary.goalCalories || 1)) * 100).toFixed(0)}%
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Progress
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
                        {Math.max(0, Math.round((getSuggestedCalories() || nutritionSummary.goalCalories || 0) - nutritionSummary.totalCalories))}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Remaining Cal
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
          </Card>

          {/* Bloodwork Status Card */}
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" mb={2}>
                <BiotechIcon color="error" sx={{ mr: 1 }} />
                <Typography variant="h6">Health & Bloodwork</Typography>
              </Box>
              {allBloodworkEntries.length > 0 ? (
                <Box>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Total Tests Logged: {allBloodworkEntries.length}
                  </Typography>
                  {recentBloodwork && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Most Recent Test: {new Date(recentBloodwork.date).toLocaleDateString()}
                      </Typography>
                      <List dense sx={{ maxHeight: 150, overflow: 'auto' }}>
                        {recentBloodwork.labValues.slice(0, 3).map((value, index) => (
                          <ListItem key={index} sx={{ py: 0.2}}>
                            <ListItemText 
                              primary={value.name} 
                              secondary={`${value.value} ${value.unit}`}
                              primaryTypographyProps={{ variant: 'body2' }}
                              secondaryTypographyProps={{ variant: 'caption' }}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                  {allBloodworkEntries.length > 1 && (
                    <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                      Other test dates: {allBloodworkEntries.slice(1, 4).map(bw => new Date(bw.date).toLocaleDateString()).join(', ')}{allBloodworkEntries.length > 4 ? '...' : ''}
                    </Typography>
                  )}
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
              {recentAnalyses.length > 0 ? 'View All Insights' : 'Generate Insights'}
            </Button>
          </CardActions>
        </Card>
      </Box>
    </Box>
  );
}; 