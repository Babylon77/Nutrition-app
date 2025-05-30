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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Checkbox,
  FormControlLabel,
  Grid,
  Badge,
  Collapse,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  LocalPharmacy as SupplementIcon,
  WbSunny as MorningIcon,
  Brightness6 as AfternoonIcon,
  Brightness3 as EveningIcon,
  NightsStay as NightIcon,
  Restaurant as MealIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller } from 'react-hook-form';

interface SupplementRegimen {
  _id: string;
  name: string;
  brand?: string;
  dosage: number;
  unit: string;
  form: string;
  frequency: string;
  timeOfDay: string[];
  startDate: string;
  endDate?: string;
  isActive: boolean;
  instructions?: string;
  notes?: string;
  prescribedBy?: string;
  isPreScription?: boolean;
}

interface TodayScheduleItem {
  regimenId: string;
  name: string;
  brand?: string;
  dosage: number;
  unit: string;
  form: string;
  timeOfDay: string;
  instructions?: string;
  taken: boolean;
  isPreScription?: boolean;
}

interface RegimenFormData {
  name: string;
  brand: string;
  dosage: number;
  unit: string;
  form: string;
  frequency: string;
  timeOfDay: string[];
  startDate: Date;
  endDate?: Date;
  instructions: string;
  notes: string;
  prescribedBy: string;
  isPreScription: boolean;
}

const frequencyOptions = [
  { value: 'daily', label: 'Daily' },
  { value: 'twice_daily', label: 'Twice Daily' },
  { value: 'three_times_daily', label: 'Three Times Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'as_needed', label: 'As Needed' },
];

const timeOfDayOptions = [
  { value: 'morning', label: 'Morning', icon: <MorningIcon /> },
  { value: 'afternoon', label: 'Afternoon', icon: <AfternoonIcon /> },
  { value: 'evening', label: 'Evening', icon: <EveningIcon /> },
  { value: 'night', label: 'Night', icon: <NightIcon /> },
  { value: 'with_meal', label: 'With Meal', icon: <MealIcon /> },
];

const formOptions = [
  'capsule', 'tablet', 'liquid', 'powder', 'gummy', 'injection', 'patch', 'other'
];

const commonUnits = [
  'mg', 'mcg', 'IU', 'g', 'ml', 'capsules', 'tablets', 'drops', 'pumps', 'scoops'
];

export const SupplementsNew: React.FC = () => {
  const [regimens, setRegimens] = useState<SupplementRegimen[]>([]);
  const [todaySchedule, setTodaySchedule] = useState<TodayScheduleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [error, setError] = useState<string>('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRegimen, setEditingRegimen] = useState<SupplementRegimen | null>(null);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const { register, handleSubmit, reset, control, setValue, watch, formState: { errors } } = useForm<RegimenFormData>({
    defaultValues: {
      name: '',
      brand: '',
      dosage: 1,
      unit: 'mg',
      form: 'capsule',
      frequency: 'daily',
      timeOfDay: ['morning'],
      startDate: new Date(),
      instructions: '',
      notes: '',
      prescribedBy: '',
      isPreScription: false,
    }
  });

  // Watch frequency to auto-set timeOfDay
  const watchedFrequency = watch('frequency');

  useEffect(() => {
    // Auto-set timeOfDay based on frequency
    if (watchedFrequency === 'twice_daily') {
      setValue('timeOfDay', ['morning', 'evening']);
    } else if (watchedFrequency === 'three_times_daily') {
      setValue('timeOfDay', ['morning', 'afternoon', 'evening']);
    } else if (watchedFrequency === 'daily') {
      setValue('timeOfDay', ['morning']);
    }
  }, [watchedFrequency, setValue]);

  useEffect(() => {
    loadRegimens();
    loadTodaySchedule();
  }, []);

  const loadRegimens = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/supplements-new/regimens', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setRegimens(data.data);
      }
    } catch (err) {
      setError('Failed to load supplement regimens');
    } finally {
      setLoading(false);
    }
  };

  const loadTodaySchedule = async () => {
    try {
      const response = await fetch('/api/supplements-new/today', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      if (data.success) {
        setTodaySchedule(data.data.schedule);
      }
    } catch (err) {
      console.error('Failed to load today\'s schedule:', err);
    }
  };

  const analyzeSupplementWithAI = async (query: string) => {
    if (!query.trim()) return;

    setAiAnalyzing(true);
    try {
      const response = await fetch('/api/supplements-new/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ query })
      });
      const data = await response.json();
      if (data.success && data.data) {
        const analyzed = data.data;
        setValue('name', analyzed.name || query);
        setValue('brand', analyzed.brand || '');
        setValue('dosage', analyzed.dosage || 1);
        setValue('unit', analyzed.unit || 'mg');
        setValue('form', analyzed.form || 'capsule');
        setValue('instructions', analyzed.instructions || '');
        setValue('notes', analyzed.notes || '');
      }
    } catch (err) {
      console.error('AI analysis failed:', err);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const onSubmit = async (data: RegimenFormData) => {
    setLoading(true);
    setError('');

    try {
      const url = editingRegimen 
        ? `/api/supplements-new/regimens/${editingRegimen._id}`
        : '/api/supplements-new/regimens';
      
      const method = editingRegimen ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...data,
          startDate: data.startDate.toISOString(),
          endDate: data.endDate?.toISOString()
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadRegimens();
        await loadTodaySchedule();
        setDialogOpen(false);
        setEditingRegimen(null);
        reset();
      } else {
        setError(result.message || 'Failed to save supplement regimen');
      }
    } catch (err) {
      setError('Failed to save supplement regimen');
    } finally {
      setLoading(false);
    }
  };

  const markAsTaken = async (scheduleItem: TodayScheduleItem) => {
    try {
      const response = await fetch('/api/supplements-new/intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          regimenId: scheduleItem.regimenId,
          timeOfDay: scheduleItem.timeOfDay,
          dateTaken: new Date().toISOString()
        })
      });

      const result = await response.json();
      if (result.success) {
        await loadTodaySchedule();
      } else {
        setError('Failed to mark supplement as taken');
      }
    } catch (err) {
      setError('Failed to mark supplement as taken');
    }
  };

  const deleteRegimen = async (regimenId: string) => {
    if (!window.confirm('Are you sure you want to delete this supplement regimen?')) {
      return;
    }

    try {
      const response = await fetch(`/api/supplements-new/regimens/${regimenId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const result = await response.json();
      if (result.success) {
        await loadRegimens();
        await loadTodaySchedule();
      } else {
        setError('Failed to delete supplement regimen');
      }
    } catch (err) {
      setError('Failed to delete supplement regimen');
    }
  };

  const openEditDialog = (regimen: SupplementRegimen) => {
    setEditingRegimen(regimen);
    setValue('name', regimen.name);
    setValue('brand', regimen.brand || '');
    setValue('dosage', regimen.dosage);
    setValue('unit', regimen.unit);
    setValue('form', regimen.form as any);
    setValue('frequency', regimen.frequency as any);
    setValue('timeOfDay', regimen.timeOfDay as any);
    setValue('startDate', new Date(regimen.startDate));
    setValue('endDate', regimen.endDate ? new Date(regimen.endDate) : undefined);
    setValue('instructions', regimen.instructions || '');
    setValue('notes', regimen.notes || '');
    setValue('prescribedBy', regimen.prescribedBy || '');
    setValue('isPreScription', regimen.isPreScription || false);
    setDialogOpen(true);
  };

  const getTimeOfDayIcon = (timeOfDay: string) => {
    const option = timeOfDayOptions.find(opt => opt.value === timeOfDay);
    return option?.icon || <SupplementIcon />;
  };

  const getTimeOfDayLabel = (timeOfDay: string) => {
    const option = timeOfDayOptions.find(opt => opt.value === timeOfDay);
    return option?.label || timeOfDay;
  };

  const toggleCardExpansion = (regimenId: string) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(regimenId)) {
        newSet.delete(regimenId);
      } else {
        newSet.add(regimenId);
      }
      return newSet;
    });
  };

  const isCardExpanded = (regimenId: string) => {
    return expandedCards.has(regimenId);
  };

  const groupedSchedule = todaySchedule.reduce((groups, item) => {
    if (!groups[item.timeOfDay]) {
      groups[item.timeOfDay] = [];
    }
    groups[item.timeOfDay].push(item);
    return groups;
  }, {} as Record<string, TodayScheduleItem[]>);

  const pendingCount = todaySchedule.filter(item => !item.taken).length;

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
          Supplement Schedule
        </Typography>

        {/* Today's Schedule */}
        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <ScheduleIcon sx={{ mr: 1 }} />
              <Typography variant="h6">
                Today's Schedule
              </Typography>
              {pendingCount > 0 && (
                <Badge badgeContent={pendingCount} color="primary" sx={{ ml: 2 }}>
                  <Chip label="Pending" size="small" color="warning" />
                </Badge>
              )}
            </Box>

            {Object.keys(groupedSchedule).length === 0 ? (
              <Typography variant="body2" color="textSecondary">
                No supplements scheduled for today
              </Typography>
            ) : (
              <Stack spacing={2}>
                {Object.entries(groupedSchedule).map(([timeOfDay, items]) => (
                  <Box key={timeOfDay}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      {getTimeOfDayIcon(timeOfDay)}
                      <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                        {getTimeOfDayLabel(timeOfDay)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' },
                      gap: 1
                    }}>
                      {items.map((item, index) => (
                        <Box key={`${item.regimenId}-${index}`}>
                          <Card 
                            variant="outlined" 
                            sx={{ 
                              backgroundColor: item.taken ? 'success.50' : 'background.paper',
                              border: item.taken ? '1px solid' : undefined,
                              borderColor: item.taken ? 'success.main' : undefined
                            }}
                          >
                            <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                    {item.name}
                                    {item.isPreScription && (
                                      <Chip 
                                        label="Rx" 
                                        size="small" 
                                        color="error" 
                                        sx={{ ml: 1, height: 16, fontSize: '0.625rem' }} 
                                      />
                                    )}
                                  </Typography>
                                  <Typography variant="caption" color="textSecondary">
                                    {item.dosage} {item.unit} • {item.form}
                                    {item.brand && ` • ${item.brand}`}
                                  </Typography>
                                  {item.instructions && (
                                    <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block' }}>
                                      {item.instructions}
                                    </Typography>
                                  )}
                                </Box>
                                
                                <IconButton
                                  size="small"
                                  onClick={() => markAsTaken(item)}
                                  disabled={item.taken}
                                  color={item.taken ? "success" : "primary"}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Box>
                            </CardContent>
                          </Card>
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            )}
          </CardContent>
        </Card>

        {/* Active Regimens */}
        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 1, sm: 3 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Active Supplements</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditingRegimen(null);
                  reset();
                  setDialogOpen(true);
                }}
                size="small"
              >
                Add Supplement
              </Button>
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" sx={{ my: 4 }}>
                <CircularProgress />
              </Box>
            ) : regimens.filter(r => r.isActive).length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
                No active supplement regimens. Add your first supplement to get started.
              </Typography>
            ) : (
              <Box sx={{ 
                display: 'grid', 
                gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
                gap: 2
              }}>
                {regimens.filter(r => r.isActive).map((regimen) => (
                  <Box key={regimen._id}>
                    <Card variant="outlined">
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                          <Typography variant="h6" sx={{ fontSize: '1rem', fontWeight: 600 }}>
                            {regimen.name}
                            {regimen.isPreScription && (
                              <Chip 
                                label="Prescription" 
                                size="small" 
                                color="error" 
                                sx={{ ml: 1, height: 20, fontSize: '0.625rem' }} 
                              />
                            )}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {(regimen.notes || regimen.instructions || regimen.prescribedBy) && (
                              <IconButton 
                                size="small" 
                                onClick={() => toggleCardExpansion(regimen._id)}
                                sx={{ mr: 0.5 }}
                              >
                                {isCardExpanded(regimen._id) ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                              </IconButton>
                            )}
                            <IconButton size="small" onClick={() => openEditDialog(regimen)}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                            <IconButton size="small" onClick={() => deleteRegimen(regimen._id)} color="error">
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                        
                        {regimen.brand && (
                          <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                            {regimen.brand}
                          </Typography>
                        )}
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          {regimen.dosage} {regimen.unit} • {regimen.form}
                        </Typography>
                        
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" color="textSecondary">
                            {regimen.frequency.replace('_', ' ')} • 
                          </Typography>
                          <Box sx={{ ml: 1, display: 'flex', gap: 0.5 }}>
                            {regimen.timeOfDay.map((time, index) => (
                              <Chip 
                                key={index}
                                label={getTimeOfDayLabel(time)}
                                size="small"
                                variant="outlined"
                                sx={{ height: 20, fontSize: '0.625rem' }}
                              />
                            ))}
                          </Box>
                        </Box>
                        
                        {/* Basic instructions shown by default */}
                        {regimen.instructions && !isCardExpanded(regimen._id) && (
                          <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block', mt: 1 }}>
                            {regimen.instructions}
                          </Typography>
                        )}

                        {/* Expandable section */}
                        <Collapse in={isCardExpanded(regimen._id)}>
                          <Divider sx={{ my: 1 }} />
                          <Stack spacing={1}>
                            {regimen.instructions && (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                  Instructions:
                                </Typography>
                                <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                                  {regimen.instructions}
                                </Typography>
                              </Box>
                            )}
                            
                            {regimen.notes && (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                  Notes:
                                </Typography>
                                <Typography variant="body2">
                                  {regimen.notes}
                                </Typography>
                              </Box>
                            )}
                            
                            {regimen.prescribedBy && (
                              <Box>
                                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                  Prescribed by:
                                </Typography>
                                <Typography variant="body2">
                                  {regimen.prescribedBy}
                                </Typography>
                              </Box>
                            )}
                            
                            <Box>
                              <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                                Started:
                              </Typography>
                              <Typography variant="body2">
                                {new Date(regimen.startDate).toLocaleDateString()}
                                {regimen.endDate && ` - ${new Date(regimen.endDate).toLocaleDateString()}`}
                              </Typography>
                            </Box>
                          </Stack>
                        </Collapse>
                      </CardContent>
                    </Card>
                  </Box>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Add/Edit Dialog */}
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingRegimen ? 'Edit Supplement' : 'Add New Supplement'}
          </DialogTitle>
          <DialogContent>
            <Box component="form" sx={{ pt: 1 }}>
              <Stack spacing={2}>
                {/* Name and Brand */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Supplement Name"
                    {...register('name', { required: 'Supplement name is required' })}
                    error={!!errors.name}
                    helperText={
                      errors.name?.message || 
                      (aiAnalyzing ? 'Analyzing supplement...' : 
                       watch('name') ? 'Tab away to analyze with AI' : '')
                    }
                    onBlur={(e) => analyzeSupplementWithAI(e.target.value)}
                    InputProps={{
                      endAdornment: aiAnalyzing ? <CircularProgress size={20} /> : null
                    }}
                  />
                  <TextField
                    fullWidth
                    label="Brand (Optional)"
                    {...register('brand')}
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>

                {/* Dosage and Unit */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <TextField
                    fullWidth
                    label="Dosage"
                    type="number"
                    {...register('dosage', { 
                      required: 'Dosage is required',
                      min: { value: 0.1, message: 'Dosage must be positive' }
                    })}
                    error={!!errors.dosage}
                    helperText={errors.dosage?.message}
                  />
                  <FormControl fullWidth>
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

                {/* Form and Frequency */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <FormControl fullWidth>
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
                  
                  <FormControl fullWidth>
                    <InputLabel>Frequency</InputLabel>
                    <Controller
                      name="frequency"
                      control={control}
                      render={({ field }) => (
                        <Select {...field} label="Frequency">
                          {frequencyOptions.map((freq) => (
                            <MenuItem key={freq.value} value={freq.value}>
                              {freq.label}
                            </MenuItem>
                          ))}
                        </Select>
                      )}
                    />
                    {watchedFrequency && (
                      <Typography variant="caption" color="textSecondary" sx={{ mt: 0.5, ml: 1.5 }}>
                        {watchedFrequency === 'twice_daily' && 'Times automatically set to morning & evening'}
                        {watchedFrequency === 'three_times_daily' && 'Times automatically set to morning, afternoon & evening'}
                        {watchedFrequency === 'daily' && 'Time automatically set to morning'}
                      </Typography>
                    )}
                  </FormControl>
                </Box>

                {/* Time of Day */}
                <FormControl fullWidth>
                  <InputLabel>Time of Day</InputLabel>
                  <Controller
                    name="timeOfDay"
                    control={control}
                    render={({ field }) => (
                      <Select {...field} multiple label="Time of Day">
                        {timeOfDayOptions.map((option) => (
                          <MenuItem key={option.value} value={option.value}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {option.icon}
                              {option.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    )}
                  />
                </FormControl>

                {/* Start and End Date */}
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Controller
                    name="startDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="Start Date"
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    )}
                  />
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <DatePicker
                        label="End Date (Optional)"
                        value={field.value}
                        onChange={(date) => field.onChange(date)}
                        slotProps={{ textField: { fullWidth: true } }}
                      />
                    )}
                  />
                </Box>

                {/* Instructions */}
                <TextField
                  fullWidth
                  label="Instructions (Optional)"
                  placeholder="e.g., Take with food, Empty stomach"
                  {...register('instructions')}
                  InputLabelProps={{ shrink: true }}
                />

                {/* Notes */}
                <TextField
                  fullWidth
                  label="Notes (Optional)"
                  multiline
                  rows={2}
                  {...register('notes')}
                  InputLabelProps={{ shrink: true }}
                />

                {/* Prescriber and Prescription checkbox */}
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    label="Prescribed By (Optional)"
                    {...register('prescribedBy')}
                    InputLabelProps={{ shrink: true }}
                  />
                  <FormControlLabel
                    control={
                      <Controller
                        name="isPreScription"
                        control={control}
                        render={({ field }) => (
                          <Checkbox {...field} checked={field.value} />
                        )}
                      />
                    }
                    label="Prescription"
                  />
                </Box>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleSubmit(onSubmit)} 
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={20} /> : (editingRegimen ? 'Update' : 'Add')}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}; 