import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  IconButton,
  Chip,
  Alert,
  CircularProgress,
  MenuItem,
  Stack,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  LocalPharmacy as SupplementIcon,
  WbSunny as MorningIcon,
  Brightness6 as AfternoonIcon,
  Brightness3 as EveningIcon,
  NightsStay as NightIcon,
  Restaurant as MealIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';
import { SupplementItem, SupplementLog } from '../types';
import { supplements } from '../services/api';

interface SupplementFormData {
  supplementName: string;
  brand: string;
  dosage: number;
  unit: string;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night' | 'with_meal' | 'other';
  form: 'capsule' | 'tablet' | 'liquid' | 'powder' | 'gummy' | 'injection' | 'patch' | 'other';
  instructions: string;
  notes: string;
}

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning', icon: <MorningIcon /> },
  { value: 'afternoon', label: 'Afternoon', icon: <AfternoonIcon /> },
  { value: 'evening', label: 'Evening', icon: <EveningIcon /> },
  { value: 'night', label: 'Night', icon: <NightIcon /> },
  { value: 'with_meal', label: 'With Meal', icon: <MealIcon /> },
  { value: 'other', label: 'Other', icon: <SupplementIcon /> },
];

const formOptions = [
  'capsule', 'tablet', 'liquid', 'powder', 'gummy', 'injection', 'patch', 'other'
];

const commonUnits = [
  'mg', 'mcg', 'IU', 'g', 'ml', 'capsules', 'tablets', 'drops', 'pumps', 'scoops'
];

export const Supplements: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [supplementLogs, setSupplementLogs] = useState<SupplementLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [addingMode, setAddingMode] = useState(false);
  const [analyzingSupplementMode, setAnalyzingSupplementMode] = useState(false);

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<SupplementFormData>({
    defaultValues: {
      supplementName: '',
      brand: '',
      dosage: 1,
      unit: 'mg',
      timeOfDay: 'morning',
      form: 'capsule',
      instructions: '',
      notes: '',
    }
  });

  // Load supplements for selected date
  useEffect(() => {
    loadSupplements();
  }, [selectedDate]);

  const loadSupplements = async () => {
    setLoading(true);
    setError('');
    
    try {
      const dateStr = selectedDate.toISOString().split('T')[0];
      const data = await supplements.getSupplementsForDate(dateStr);
      setSupplementLogs(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load supplements');
    } finally {
      setLoading(false);
    }
  };

  const analyzeSupplementWithAI = async (query: string): Promise<SupplementItem | null> => {
    try {
      const data = await supplements.analyzeSupplementWithAI(query);
      return data;
    } catch (err) {
      console.error('AI analysis failed:', err);
      return null;
    }
  };

  const handleAnalyzeSupplementQuery = async () => {
    const query = watch('supplementName');
    if (!query.trim()) return;

    setAnalyzingSupplementMode(true);
    
    try {
      const analyzed = await analyzeSupplementWithAI(query);
      if (analyzed) {
        setValue('supplementName', analyzed.name);
        setValue('brand', analyzed.brand || '');
        setValue('dosage', analyzed.dosage);
        setValue('unit', analyzed.unit);
        setValue('form', analyzed.form as any);
        setValue('instructions', analyzed.instructions || '');
      }
    } catch (err) {
      setError('Failed to analyze supplement. Please enter details manually.');
    } finally {
      setAnalyzingSupplementMode(false);
    }
  };

  const onSubmit = async (data: SupplementFormData) => {
    setAddingMode(true);
    setError('');

    try {
      const supplementItem: SupplementItem = {
        name: data.supplementName,
        brand: data.brand || undefined,
        dosage: data.dosage,
        unit: data.unit,
        form: data.form,
        instructions: data.instructions || undefined,
        notes: data.notes || undefined,
        confidence: 0.8, // Manual entry confidence
      };

      await supplements.logSupplement({
        date: selectedDate.toISOString(),
        timeOfDay: data.timeOfDay,
        supplements: [supplementItem],
        notes: data.notes || undefined,
      });

      // Reload supplements and reset form
      await loadSupplements();
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add supplement');
    } finally {
      setAddingMode(false);
    }
  };

  const deleteSupplementLog = async (logId: string) => {
    try {
      await supplements.deleteSupplementLog(logId);
      await loadSupplements();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete supplement');
    }
  };

  const getTimeOfDayIcon = (timeOfDay: string) => {
    const option = timeOfDayOptions.find(opt => opt.value === timeOfDay);
    return option?.icon || <SupplementIcon />;
  };

  const getTimeOfDayLabel = (timeOfDay: string) => {
    const option = timeOfDayOptions.find(opt => opt.value === timeOfDay);
    return option?.label || timeOfDay;
  };

  const groupedLogs = supplementLogs.reduce((groups, log) => {
    if (!groups[log.timeOfDay]) {
      groups[log.timeOfDay] = [];
    }
    groups[log.timeOfDay].push(log);
    return groups;
  }, {} as Record<string, SupplementLog[]>);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ p: { xs: 1, sm: 3 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
            mb: { xs: 2, sm: 3 } 
          }}
        >
          <SupplementIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
          Supplements & Medications
        </Typography>

        {/* Date Picker */}
        <Card sx={{ mb: { xs: 2, sm: 3 }, p: { xs: 1, sm: 2 } }}>
          <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
            <DatePicker
              label="Select Date"
              value={selectedDate}
              onChange={(newValue) => newValue && setSelectedDate(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  size: 'small',
                  sx: { mb: 0 }
                },
                popper: {
                  placement: 'bottom-start',
                  sx: {
                    zIndex: 1300,
                    '& .MuiPaper-root': {
                      marginTop: 1
                    }
                  }
                }
              }}
            />
          </CardContent>
        </Card>

        {/* Add Supplement Form */}
        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
            <Typography 
              variant="h6" 
              gutterBottom
              sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
            >
              Add Supplement
            </Typography>
            
            <Box component="form" onSubmit={handleSubmit(onSubmit)}>
              <Stack spacing={{ xs: 1, sm: 2 }}>
                {/* Name and Brand Row */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 }
                }}>
                  <TextField
                    fullWidth
                    label="Supplement Name"
                    size="small"
                    {...register('supplementName', { required: 'Supplement name is required' })}
                    error={!!errors.supplementName}
                    helperText={errors.supplementName?.message}
                    onBlur={handleAnalyzeSupplementQuery}
                    InputProps={{
                      endAdornment: analyzingSupplementMode && <CircularProgress size={20} />
                    }}
                  />
                  
                  <TextField
                    fullWidth
                    label="Brand (Optional)"
                    size="small"
                    {...register('brand')}
                  />
                </Box>

                {/* Dosage and Unit Row */}
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: { xs: 'column', sm: 'row' },
                  gap: { xs: 1, sm: 2 }
                }}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    type="number"
                    size="small"
                    {...register('dosage', { 
                      required: 'Dosage is required',
                      min: { value: 0.1, message: 'Dosage must be positive' }
                    })}
                    error={!!errors.dosage}
                    helperText={errors.dosage?.message}
                  />

                  <FormControl fullWidth size="small">
                    <InputLabel>Unit</InputLabel>
                    <Controller
                      name="unit"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Unit">
                          {commonUnits.map((unit) => (
                            <MenuItem key={unit} value={unit}>{unit}</MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                  </FormControl>
                </Box>

                {/* Time of Day */}
                <FormControl fullWidth size="small">
                  <InputLabel>Time of Day</InputLabel>
                  <Controller
                    name="timeOfDay"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Time of Day">
                        {timeOfDayOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {option.icon}
                              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                                {option.label}
                              </Box>
                              <Box sx={{ display: { xs: 'block', sm: 'none' } }}>
                                {option.label.split(' ')[0]}
                              </Box>
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>

                {/* Form */}
                <FormControl fullWidth size="small">
                  <InputLabel>Form</InputLabel>
                  <Controller
                    name="form"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} label="Form">
                        {formOptions.map((form) => (
                          <MenuItem key={form} value={form}>
                            {form.charAt(0).toUpperCase() + form.slice(1)}
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>

                {/* Instructions */}
                <TextField
                  fullWidth
                  label="Instructions (Optional)"
                  placeholder="e.g., Take with food, Empty stomach"
                  size="small"
                  {...register('instructions')}
                />

                {/* Notes */}
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  multiline
                  rows={2}
                  size="small"
                  {...register('notes')}
                />

                {/* Submit Button */}
                <Button
                  type="submit"
                  variant="contained"
                  size="small"
                  startIcon={addingMode ? <CircularProgress size={16} /> : <AddIcon />}
                  disabled={addingMode}
                  fullWidth
                  sx={{ 
                    height: { xs: '36px', sm: '40px' },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}
                >
                  {addingMode ? 'Adding...' : 'Add Supplement'}
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: { xs: 2, sm: 3 } }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Supplements Display */}
        {!loading && (
          <Box>
            {Object.keys(groupedLogs).length === 0 ? (
              <Card>
                <CardContent sx={{ textAlign: 'center', py: 4 }}>
                  <SupplementIcon sx={{ fontSize: 48, color: 'grey.400', mb: 2 }} />
                  <Typography variant="h6" color="textSecondary">
                    No supplements logged for {selectedDate.toDateString()}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Add your first supplement above to get started
                  </Typography>
                </CardContent>
              </Card>
            ) : (
              <Stack spacing={{ xs: 2, sm: 3 }}>
                {Object.entries(groupedLogs).map(([timeOfDay, logs]) => (
                  <Card key={timeOfDay}>
                    <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1, 
                        mb: { xs: 1, sm: 2 }
                      }}>
                        {getTimeOfDayIcon(timeOfDay)}
                        <Typography 
                          variant="h6"
                          sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                        >
                          {getTimeOfDayLabel(timeOfDay)}
                        </Typography>
                      </Box>
                      
                      <Stack spacing={{ xs: 1, sm: 2 }}>
                        {logs.map((log) => (
                          <Box key={log._id}>
                            {log.supplements.map((supplement, suppIndex) => (
                              <Card 
                                key={`${log._id}-${suppIndex}`} 
                                variant="outlined"
                                sx={{ mb: 1 }}
                              >
                                <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'flex-start',
                                    flexDirection: { xs: 'column', sm: 'row' },
                                    gap: { xs: 1, sm: 0 }
                                  }}>
                                    <Box sx={{ flex: 1 }}>
                                      <Typography 
                                        variant="subtitle1" 
                                        fontWeight={600}
                                        sx={{ fontSize: { xs: '0.875rem', sm: '1rem' } }}
                                      >
                                        {supplement.name}
                                        {supplement.brand && (
                                          <Chip 
                                            label={supplement.brand} 
                                            size="small" 
                                            variant="outlined"
                                            sx={{ 
                                              ml: 1,
                                              height: { xs: '20px', sm: '24px' },
                                              fontSize: { xs: '0.625rem', sm: '0.75rem' }
                                            }}
                                          />
                                        )}
                                      </Typography>
                                      
                                      <Typography 
                                        variant="body2" 
                                        color="textSecondary"
                                        sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
                                      >
                                        {supplement.dosage} {supplement.unit}
                                        {supplement.form && ` • ${supplement.form}`}
                                      </Typography>
                                      
                                      {supplement.instructions && (
                                        <Typography 
                                          variant="body2" 
                                          sx={{ 
                                            fontStyle: 'italic',
                                            fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                          }}
                                        >
                                          {supplement.instructions}
                                        </Typography>
                                      )}
                                    </Box>
                                    
                                    <IconButton
                                      size="small"
                                      onClick={() => deleteSupplementLog(log._id)}
                                      color="error"
                                    >
                                      <DeleteIcon fontSize="small" />
                                    </IconButton>
                                  </Box>
                                  
                                  {supplement.notes && (
                                    <Typography 
                                      variant="body2" 
                                      sx={{ 
                                        mt: 1,
                                        p: 1,
                                        backgroundColor: 'grey.50',
                                        borderRadius: 1,
                                        fontSize: { xs: '0.75rem', sm: '0.875rem' }
                                      }}
                                    >
                                      <strong>Note:</strong> {supplement.notes}
                                    </Typography>
                                  )}
                                </CardContent>
                              </Card>
                            ))}
                          </Box>
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            )}
          </Box>
        )}
      </Box>
    </LocalizationProvider>
  );
}; 