import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Person as PersonIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface ProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth?: Date;
  gender?: 'male' | 'female' | 'other';
  heightFeet?: number;
  heightInches?: number;
  weight?: number; // pounds instead of kg
  weightGoal?: number; // target weight in pounds
  weightGoalTimeframe?: number; // timeframe in weeks
  activityLevel?: 'sedentary' | 'lightly_active' | 'moderately_active' | 'very_active' | 'extra_active';
  healthGoals?: string[];
  allergies?: string[];
  dietaryRestrictions?: string[];
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const activityLevels = [
  { value: 'sedentary', label: 'Sedentary (little or no exercise)' },
  { value: 'lightly_active', label: 'Lightly Active (light exercise 1-3 days/week)' },
  { value: 'moderately_active', label: 'Moderately Active (moderate exercise 3-5 days/week)' },
  { value: 'very_active', label: 'Very Active (hard exercise 6-7 days/week)' },
  { value: 'extra_active', label: 'Extremely Active (very hard exercise, physical job)' },
];

const healthGoalOptions = [
  'Weight Loss',
  'Weight Gain',
  'Muscle Building',
  'Improved Energy',
  'Better Sleep',
  'Reduced Inflammation',
  'Heart Health',
  'Blood Sugar Control',
  'Digestive Health',
  'General Wellness',
];

const allergyOptions = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Soy',
  'Wheat',
  'Sesame',
];

const dietaryRestrictionOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Dairy-Free',
  'Keto',
  'Paleo',
  'Low-Carb',
  'Low-Fat',
  'Mediterranean',
  'Intermittent Fasting',
];

export const Profile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  // Helper functions to convert between metric and US units
  const convertCmToFeetInches = (cm?: number) => {
    if (!cm) return { feet: undefined, inches: undefined };
    const totalInches = cm / 2.54;
    const feet = Math.floor(totalInches / 12);
    const inches = Math.round(totalInches % 12);
    return { feet, inches };
  };

  const convertKgToLbs = (kg?: number) => {
    if (!kg) return undefined;
    return Math.round(kg * 2.20462);
  };

  const convertLbsToKg = (lbs?: number | string) => {
    if (!lbs) return undefined;
    const lbsNum = Number(lbs);
    return lbsNum / 2.20462;
  };

  const convertFeetInchesToCm = (feet?: number | string, inches?: number | string) => {
    const feetNum = feet ? Number(feet) : 0;
    const inchesNum = inches ? Number(inches) : 0;
    
    if (!feetNum && !inchesNum) return undefined;
    const totalInches = feetNum * 12 + inchesNum;
    return totalInches * 2.54;
  };

  const existingHeight = convertCmToFeetInches(user?.height);
  const existingWeight = convertKgToLbs(user?.weight);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      dateOfBirth: user?.dateOfBirth ? new Date(user.dateOfBirth) : undefined,
      gender: user?.gender || undefined,
      heightFeet: existingHeight.feet,
      heightInches: existingHeight.inches,
      weight: existingWeight,
      weightGoal: user?.weightGoal,
      weightGoalTimeframe: user?.weightGoalTimeframe,
      activityLevel: user?.activityLevel || undefined,
      healthGoals: user?.healthGoals || [],
      allergies: user?.allergies || [],
      dietaryRestrictions: user?.dietaryRestrictions || [],
    },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Convert firstName and lastName to name for backend
      const name = `${data.firstName} ${data.lastName}`;
      
      // Convert US units back to metric for backend storage
      const heightInCm = convertFeetInchesToCm(data.heightFeet, data.heightInches);
      const weightInKg = convertLbsToKg(data.weight);
      
      // Validate converted values
      if (heightInCm && (heightInCm < 50 || heightInCm > 300)) {
        throw new Error(`Invalid height: ${heightInCm.toFixed(1)} cm. Must be between 50-300 cm.`);
      }
      if (weightInKg && (weightInKg < 20 || weightInKg > 500)) {
        throw new Error(`Invalid weight: ${weightInKg.toFixed(1)} kg. Must be between 20-500 kg.`);
      }
      
      const profileData: any = {
        name, // Backend expects 'name', not firstName/lastName
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        height: heightInCm, // Store in metric in backend
        weight: weightInKg, // Store in metric in backend
        weightGoal: data.weightGoal,
        weightGoalTimeframe: data.weightGoalTimeframe,
        activityLevel: data.activityLevel,
        healthGoals: data.healthGoals,
        allergies: data.allergies,
        dietaryRestrictions: data.dietaryRestrictions,
      };

      const updatedUser = await apiService.updateProfile(profileData);
      
      // Update the user with firstName and lastName for frontend
      updateUser({
        ...updatedUser,
        firstName: data.firstName,
        lastName: data.lastName,
      });
      
      setSuccess('Profile updated successfully!');
      setEditing(false);
    } catch (err: any) {
      console.error('Profile update error:', err);
      if (err.message && err.message.includes('Invalid')) {
        setError(err.message);
      } else {
        setError(err.response?.data?.message || 'Failed to update profile');
      }
    } finally {
      setLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormData) => {
    if (data.newPassword !== data.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    try {
      setPasswordLoading(true);
      setError('');
      setSuccess('');

      await apiService.changePassword(data.currentPassword, data.newPassword);
      setSuccess('Password changed successfully!');
      setPasswordDialogOpen(false);
      resetPassword();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleCancel = () => {
    reset();
    setEditing(false);
    setError('');
    setSuccess('');
  };

  const calculateBMI = () => {
    // Get current form values (in US units)
    const currentHeight = convertCmToFeetInches(user?.height);
    const currentWeight = convertKgToLbs(user?.weight);
    
    if ((currentHeight.feet || currentHeight.inches) && currentWeight) {
      const totalInches = (currentHeight.feet || 0) * 12 + (currentHeight.inches || 0);
      const heightInMeters = (totalInches * 2.54) / 100;
      const weightInKg = currentWeight / 2.20462;
      const bmi = weightInKg / (heightInMeters * heightInMeters);
      return bmi.toFixed(1);
    }
    return null;
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5) return { category: 'Underweight', color: 'info' };
    if (bmi < 25) return { category: 'Normal', color: 'success' };
    if (bmi < 30) return { category: 'Overweight', color: 'warning' };
    return { category: 'Obese', color: 'error' };
  };

  const bmi = calculateBMI();
  const bmiInfo = bmi ? getBMICategory(parseFloat(bmi)) : null;

  const calculateSuggestedCalories = () => {
    const currentWeight = convertKgToLbs(user?.weight);
    const currentHeight = convertCmToFeetInches(user?.height);
    const weightGoal = user?.weightGoal;
    const timeframe = user?.weightGoalTimeframe;
    const age = user?.dateOfBirth 
      ? Math.floor((Date.now() - new Date(user.dateOfBirth).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : null;

    if (!currentWeight || !currentHeight || !weightGoal || !timeframe || !age || !user?.gender || !user?.activityLevel) {
      return null;
    }

    // Calculate BMR using Mifflin-St Jeor Equation (weight in kg, height in cm)
    const heightInCm = convertFeetInchesToCm(currentHeight.feet, currentHeight.inches);
    const weightInKg = currentWeight / 2.20462;
    
    // Ensure heightInCm is valid before using in calculation
    if (!heightInCm || heightInCm <= 0) {
      return null;
    }
    
    let bmr: number;
    if (user.gender === 'male') {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age + 5;
    } else {
      bmr = 10 * weightInKg + 6.25 * heightInCm - 5 * age - 161;
    }

    // Activity level multipliers
    const activityMultipliers = {
      sedentary: 1.15, // Reduced from 1.2 to be more conservative
      lightly_active: 1.3, // Reduced from 1.375
      moderately_active: 1.45, // Reduced from 1.55
      very_active: 1.6, // Reduced from 1.725
      extra_active: 1.75 // Reduced from 1.9
    };

    const maintenanceCalories = bmr * activityMultipliers[user.activityLevel];
    
    // Calculate weekly weight change needed
    const weightChange = currentWeight - weightGoal; // positive for weight loss
    const weeklyWeightChange = weightChange / timeframe;
    
    // Cap weekly weight loss at 2 lbs/week for safety (recommended maximum)
    const safeWeeklyWeightChange = Math.min(Math.abs(weeklyWeightChange), 2) * Math.sign(weeklyWeightChange);
    
    // 1 pound = ~3500 calories, so daily calorie adjustment
    const dailyCalorieAdjustment = (safeWeeklyWeightChange * 3500) / 7;
    
    const suggestedCalories = Math.round(maintenanceCalories - dailyCalorieAdjustment);
    
    // Don't allow extremely low calorie targets (minimum 1200 for women, 1500 for men)
    const minimumCalories = user.gender === 'male' ? 1500 : 1200;
    
    return {
      maintenanceCalories: Math.round(maintenanceCalories),
      suggestedCalories: Math.max(suggestedCalories, minimumCalories),
      weeklyWeightChange: safeWeeklyWeightChange,
      totalWeightChange: weightChange
    };
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Profile
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {/* Profile Information */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6">Personal Information</Typography>
            <Box>
              {editing ? (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleCancel}
                    sx={{ mr: 1 }}
                    disabled={loading}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
                    onClick={handleSubmit(onSubmit)}
                    disabled={loading}
                  >
                    Save
                  </Button>
                </>
              ) : (
                <Button
                  variant="outlined"
                  startIcon={<EditIcon />}
                  onClick={() => setEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Box>

          <form onSubmit={handleSubmit(onSubmit)}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Basic Information */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Controller
                  name="firstName"
                  control={control}
                  rules={{ required: 'First name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="First Name"
                      disabled={!editing}
                      error={!!errors.firstName}
                      helperText={errors.firstName?.message}
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                  )}
                />

                <Controller
                  name="lastName"
                  control={control}
                  rules={{ required: 'Last name is required' }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Last Name"
                      disabled={!editing}
                      error={!!errors.lastName}
                      helperText={errors.lastName?.message}
                      sx={{ flex: 1, minWidth: 200 }}
                    />
                  )}
                />

                <TextField
                  label="Email"
                  value={user?.email || ''}
                  disabled
                  sx={{ flex: 1, minWidth: 200 }}
                />
              </Box>

              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <FormControl sx={{ flex: 1, minWidth: 120 }} disabled={!editing}>
                      <InputLabel>Gender</InputLabel>
                      <Select {...field} label="Gender" error={!!errors.gender}>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />

                <Controller
                  name="heightFeet"
                  control={control}
                  rules={{ 
                    min: { value: 1, message: 'Height must be at least 1 foot' },
                    max: { value: 8, message: 'Height cannot exceed 8 feet' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Height (feet)"
                      type="number"
                      disabled={!editing}
                      error={!!errors.heightFeet}
                      helperText={errors.heightFeet?.message}
                      inputProps={{ min: 1, max: 8, step: 1 }}
                      sx={{ flex: 1, minWidth: 120 }}
                    />
                  )}
                />

                <Controller
                  name="heightInches"
                  control={control}
                  rules={{ 
                    min: { value: 0, message: 'Inches must be 0 or more' },
                    max: { value: 11, message: 'Inches must be less than 12' }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Height (inches)"
                      type="number"
                      disabled={!editing}
                      error={!!errors.heightInches}
                      helperText={errors.heightInches?.message}
                      inputProps={{ min: 0, max: 11, step: 1 }}
                      sx={{ flex: 1, minWidth: 120 }}
                    />
                  )}
                />
              </Box>

              <Controller
                name="weight"
                control={control}
                rules={{ 
                  min: { value: 50, message: 'Weight must be at least 50 pounds' },
                  max: { value: 1000, message: 'Weight cannot exceed 1000 pounds' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Weight (pounds)"
                    type="number"
                    disabled={!editing}
                    error={!!errors.weight}
                    helperText={errors.weight?.message}
                    inputProps={{ min: 50, max: 1000, step: 0.1 }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                )}
              />

              <Controller
                name="weightGoal"
                control={control}
                rules={{ 
                  min: { value: 50, message: 'Weight goal must be at least 50 pounds' },
                  max: { value: 1000, message: 'Weight goal cannot exceed 1000 pounds' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Weight Goal (pounds)"
                    type="number"
                    disabled={!editing}
                    error={!!errors.weightGoal}
                    helperText={errors.weightGoal?.message}
                    inputProps={{ min: 50, max: 1000, step: 0.1 }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                )}
              />

              <Controller
                name="weightGoalTimeframe"
                control={control}
                rules={{ 
                  min: { value: 1, message: 'Timeframe must be at least 1 week' },
                  max: { value: 52, message: 'Timeframe cannot exceed 52 weeks' }
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Weight Goal Timeframe (weeks)"
                    type="number"
                    disabled={!editing}
                    error={!!errors.weightGoalTimeframe}
                    helperText={errors.weightGoalTimeframe?.message}
                    inputProps={{ min: 1, max: 52, step: 1 }}
                    sx={{ flex: 1, minWidth: 200 }}
                  />
                )}
              />

              <Controller
                name="activityLevel"
                control={control}
                rules={{ required: 'Activity level is required' }}
                render={({ field }) => (
                  <FormControl fullWidth disabled={!editing}>
                    <InputLabel>Activity Level</InputLabel>
                    <Select {...field} label="Activity Level" error={!!errors.activityLevel}>
                      {activityLevels.map((level) => (
                        <MenuItem key={level.value} value={level.value}>
                          {level.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Divider />

              {/* Health Information */}
              <Typography variant="h6">Health Information</Typography>

              <Controller
                name="healthGoals"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    options={healthGoalOptions}
                    disabled={!editing}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Health Goals" placeholder="Select goals" />
                    )}
                    onChange={(_, value) => field.onChange(value)}
                  />
                )}
              />

              <Controller
                name="allergies"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    options={allergyOptions}
                    freeSolo
                    disabled={!editing}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} color="error" {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Allergies" placeholder="Select or type allergies" />
                    )}
                    onChange={(_, value) => field.onChange(value)}
                  />
                )}
              />

              <Controller
                name="dietaryRestrictions"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    {...field}
                    multiple
                    options={dietaryRestrictionOptions}
                    freeSolo
                    disabled={!editing}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip variant="outlined" label={option} color="primary" {...getTagProps({ index })} />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField {...params} label="Dietary Restrictions" placeholder="Select or type restrictions" />
                    )}
                    onChange={(_, value) => field.onChange(value)}
                  />
                )}
              />
            </Box>
          </form>
        </CardContent>
      </Card>

      {/* Health Metrics */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Health Metrics
          </Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {bmi && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  BMI
                </Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="h6">{bmi}</Typography>
                  {bmiInfo && (
                    <Chip
                      label={bmiInfo.category}
                      size="small"
                      color={bmiInfo.color as any}
                    />
                  )}
                </Box>
              </Box>
            )}
            
            {user?.weight && user?.weightGoal && user?.weightGoalTimeframe && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Weight Goal
                </Typography>
                <Typography variant="h6">
                  {convertKgToLbs(user.weight)}lbs → {user.weightGoal}lbs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {Math.abs(convertKgToLbs(user.weight)! - user.weightGoal)} lbs in {user.weightGoalTimeframe} weeks
                </Typography>
              </Box>
            )}
            
            {(() => {
              const calorieInfo = calculateSuggestedCalories();
              return calorieInfo && (
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Suggested Daily Calories
                  </Typography>
                  <Typography variant="h6" color="primary">
                    {calorieInfo.suggestedCalories}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {calorieInfo.weeklyWeightChange > 0 ? 'lose' : 'gain'} {Math.abs(calorieInfo.weeklyWeightChange).toFixed(1)} lbs/week
                  </Typography>
                </Box>
              );
            })()}
          </Box>
        </CardContent>
      </Card>

      {/* Account Settings */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Account Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<LockIcon />}
              onClick={() => setPasswordDialogOpen(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Change Password
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Controller
                name="currentPassword"
                control={passwordControl}
                rules={{ required: 'Current password is required' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Current Password"
                    type="password"
                    error={!!passwordErrors.currentPassword}
                    helperText={passwordErrors.currentPassword?.message}
                  />
                )}
              />

              <Controller
                name="newPassword"
                control={passwordControl}
                rules={{
                  required: 'New password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
                }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="New Password"
                    type="password"
                    error={!!passwordErrors.newPassword}
                    helperText={passwordErrors.newPassword?.message}
                  />
                )}
              />

              <Controller
                name="confirmPassword"
                control={passwordControl}
                rules={{ required: 'Please confirm your new password' }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Confirm New Password"
                    type="password"
                    error={!!passwordErrors.confirmPassword}
                    helperText={passwordErrors.confirmPassword?.message}
                  />
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setPasswordDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={passwordLoading}>
              {passwordLoading ? <CircularProgress size={24} /> : 'Change Password'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
}; 