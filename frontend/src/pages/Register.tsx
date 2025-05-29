import React, { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import {
  Box,
  Button,
  Container,
  Paper,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Autocomplete,
} from '@mui/material';
import { Restaurant as RestaurantIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { RegisterData } from '../types';

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
  'Heart Health',
  'Blood Sugar Control',
  'Digestive Health',
  'Athletic Performance',
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
  'Halal',
  'Kosher',
];

export const Register: React.FC = () => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const { register: registerUser, user } = useAuth();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<RegisterData>();

  const password = watch('password');

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = async (data: RegisterData) => {
    try {
      setError('');
      setLoading(true);
      
      await registerUser(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="md">
      <Box
        sx={{
          marginTop: 4,
          marginBottom: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: 2,
            }}
          >
            <RestaurantIcon sx={{ fontSize: 40, color: 'primary.main', mr: 1 }} />
            <Typography component="h1" variant="h4" color="primary">
              NutriTrack
            </Typography>
          </Box>
          
          <Typography component="h2" variant="h5" sx={{ mb: 3 }}>
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ width: '100%' }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  required
                  fullWidth
                  id="firstName"
                  label="First Name"
                  autoFocus
                  error={!!errors.firstName}
                  helperText={errors.firstName?.message}
                  {...register('firstName', {
                    required: 'First name is required',
                  })}
                />
                <TextField
                  required
                  fullWidth
                  id="lastName"
                  label="Last Name"
                  error={!!errors.lastName}
                  helperText={errors.lastName?.message}
                  {...register('lastName', {
                    required: 'Last name is required',
                  })}
                />
              </Box>
              
              <TextField
                required
                fullWidth
                id="email"
                label="Email Address"
                autoComplete="email"
                error={!!errors.email}
                helperText={errors.email?.message}
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
              />
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  required
                  fullWidth
                  label="Password"
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  error={!!errors.password}
                  helperText={errors.password?.message}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters',
                    },
                  })}
                />
                <TextField
                  required
                  fullWidth
                  label="Confirm Password"
                  type="password"
                  id="confirmPassword"
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword?.message}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (value) =>
                      value === password || 'Passwords do not match',
                  })}
                />
              </Box>
              
              <Divider sx={{ my: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Optional Profile Information
                </Typography>
              </Divider>

              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  id="dateOfBirth"
                  label="Date of Birth"
                  type="date"
                  InputLabelProps={{
                    shrink: true,
                  }}
                  {...register('dateOfBirth')}
                />
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Gender</InputLabel>
                      <Select {...field} label="Gender" value={field.value || ''}>
                        <MenuItem value="">Select Gender</MenuItem>
                        <MenuItem value="male">Male</MenuItem>
                        <MenuItem value="female">Female</MenuItem>
                        <MenuItem value="other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
                <Controller
                  name="activityLevel"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel>Activity Level</InputLabel>
                      <Select {...field} label="Activity Level" value={field.value || ''}>
                        <MenuItem value="">Select Activity Level</MenuItem>
                        {activityLevels.map((level) => (
                          <MenuItem key={level.value} value={level.value}>
                            {level.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                />
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <TextField
                  fullWidth
                  id="height"
                  label="Height (cm)"
                  type="number"
                  {...register('height', {
                    valueAsNumber: true,
                    min: { value: 100, message: 'Height must be at least 100cm' },
                    max: { value: 250, message: 'Height must be less than 250cm' },
                  })}
                  error={!!errors.height}
                  helperText={errors.height?.message}
                />
                <TextField
                  fullWidth
                  id="weight"
                  label="Weight (kg)"
                  type="number"
                  {...register('weight', {
                    valueAsNumber: true,
                    min: { value: 30, message: 'Weight must be at least 30kg' },
                    max: { value: 300, message: 'Weight must be less than 300kg' },
                  })}
                  error={!!errors.weight}
                  helperText={errors.weight?.message}
                />
              </Box>
              
              <Controller
                name="healthGoals"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    multiple
                    options={healthGoalOptions}
                    value={field.value || []}
                    onChange={(_, newValue) => field.onChange(newValue)}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => (
                        <Chip
                          variant="outlined"
                          label={option}
                          {...getTagProps({ index })}
                          key={option}
                        />
                      ))
                    }
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Health Goals"
                        placeholder="Select your health goals"
                      />
                    )}
                  />
                )}
              />
              
              <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
                <Controller
                  name="allergies"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={allergyOptions}
                      value={field.value || []}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Allergies"
                          placeholder="Select allergies"
                        />
                      )}
                      sx={{ width: '100%' }}
                    />
                  )}
                />
                <Controller
                  name="dietaryRestrictions"
                  control={control}
                  render={({ field }) => (
                    <Autocomplete
                      multiple
                      options={dietaryRestrictionOptions}
                      value={field.value || []}
                      onChange={(_, newValue) => field.onChange(newValue)}
                      renderTags={(value, getTagProps) =>
                        value.map((option, index) => (
                          <Chip
                            variant="outlined"
                            label={option}
                            {...getTagProps({ index })}
                            key={option}
                          />
                        ))
                      }
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Dietary Restrictions"
                          placeholder="Select dietary restrictions"
                        />
                      )}
                      sx={{ width: '100%' }}
                    />
                  )}
                />
              </Box>
            </Box>
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
            
            <Divider sx={{ my: 2 }} />
            
            <Box textAlign="center">
              <Typography variant="body2">
                Already have an account?{' '}
                <Link to="/login" style={{ textDecoration: 'none', color: 'inherit' }}>
                  <Button variant="text" color="primary">
                    Sign In
                  </Button>
                </Link>
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}; 