import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  IconButton,
  MenuItem,
  Divider,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Queue as QueueIcon,
  Close as CloseIcon,
  PlayArrow as ProcessIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import { useDebounce } from '../hooks/useDebounce';

interface PersonalFood {
  _id: string;
  id: string;
  name: string;
  defaultQuantity: number;
  defaultUnit: string;
  nutrition: any;
  timesUsed: number;
}

interface QueuedFood {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  mealType: string;
  isPersonalFood: boolean;
  personalFoodId?: string;
  status: 'ready' | 'needs_analysis';
}

interface SmartFoodEntryProps {
  open: boolean;
  onClose: () => void;
  onFoodsAdded: (foods: any[]) => void;
  defaultMealType?: string;
}

export const SmartFoodEntry: React.FC<SmartFoodEntryProps> = ({
  open,
  onClose,
  onFoodsAdded,
  defaultMealType = 'breakfast'
}) => {
  const [currentInput, setCurrentInput] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('serving');
  const [mealType, setMealType] = useState(defaultMealType);
  const [personalSuggestions, setPersonalSuggestions] = useState<PersonalFood[]>([]);
  const [queue, setQueue] = useState<QueuedFood[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const debouncedInput = useDebounce(currentInput, 300);

  // Search personal foods as user types
  useEffect(() => {
    if (debouncedInput.trim() && debouncedInput.length >= 2) {
      searchPersonalFoods(debouncedInput);
    } else {
      setPersonalSuggestions([]);
    }
  }, [debouncedInput]);

  // Load initial queue state
  useEffect(() => {
    if (open) {
      loadQueue();
    }
  }, [open]);

  const searchPersonalFoods = async (query: string) => {
    try {
      setIsSearching(true);
      console.log(`🔍 Searching personal foods for: "${query}"`);
      
      const response = await fetch('/api/food/smart-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'search_personal',
          data: { query }
        }),
      });

      console.log(`📡 Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Search failed:', errorText);
        setError(`Search failed: ${response.status} ${response.statusText}`);
        return;
      }

      const result = await response.json();
      console.log(`✅ Search result:`, result);
      
      if (result.success) {
        setPersonalSuggestions(result.data.suggestions || []);
        console.log(`📝 Found ${result.data.suggestions?.length || 0} personal foods`);
      } else {
        console.error('Search unsuccessful:', result);
        setError('Search was unsuccessful');
      }
    } catch (err) {
      console.error('Personal food search failed:', err);
      setError('Failed to search personal foods');
    } finally {
      setIsSearching(false);
    }
  };

  const loadQueue = async () => {
    try {
      const response = await fetch('/api/food/smart-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'get_queue', data: {} }),
      });

      const result = await response.json();
      if (result.success) {
        setQueue(result.data.queue || []);
      }
    } catch (err) {
      console.error('Failed to load queue:', err);
    }
  };

  const addToQueue = async (isPersonalFood = false, personalFoodId?: string, personalFoodData?: PersonalFood) => {
    const foodName = isPersonalFood && personalFoodData ? personalFoodData.name : currentInput;
    
    if (!foodName.trim()) return;

    try {
      const response = await fetch('/api/food/smart-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'add_to_queue',
          data: {
            name: foodName,
            quantity,
            unit,
            mealType,
            isPersonalFood,
            personalFoodId
          }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setQueue(result.data.queue || []);
        setCurrentInput('');
        setPersonalSuggestions([]);
      }
    } catch (err) {
      setError('Failed to add to queue');
    }
  };

  const removeFromQueue = async (itemId: string) => {
    try {
      const response = await fetch('/api/food/smart-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          action: 'remove_from_queue',
          data: { itemId }
        }),
      });

      const result = await response.json();
      if (result.success) {
        setQueue(result.data.queue || []);
      }
    } catch (err) {
      setError('Failed to remove from queue');
    }
  };

  const clearQueue = async () => {
    try {
      const response = await fetch('/api/food/smart-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'clear_queue', data: {} }),
      });

      const result = await response.json();
      if (result.success) {
        setQueue([]);
      }
    } catch (err) {
      setError('Failed to clear queue');
    }
  };

  const processQueue = async () => {
    if (queue.length === 0) return;

    try {
      setIsProcessing(true);
      setError('');

      const response = await fetch('/api/food/smart-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'process_queue', data: {} }),
      });

      const result = await response.json();
      if (result.success) {
        const processedFoods = result.data.processedItems || [];
        onFoodsAdded(processedFoods);
        setQueue([]);
        onClose();
      }
    } catch (err) {
      setError('Failed to process queue');
    } finally {
      setIsProcessing(false);
    }
  };

  const readyCount = queue.filter(item => item.status === 'ready').length;
  const needsAnalysisCount = queue.filter(item => item.status === 'needs_analysis').length;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6">Smart Food Entry</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 1 }}>
          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <Alert severity="info">
            Start typing to find your personal foods (ready instantly!) or add new foods to queue for AI analysis. Build your complete meal, then process everything at once.
          </Alert>

          {/* Input Section */}
          <Box>
            <TextField
              label="Food Item"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              placeholder="e.g., grilled salmon, 1 cup rice, homemade pasta"
              fullWidth
              sx={{ mb: 2 }}
            />

            <Box display="flex" gap={2} mb={2}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                inputProps={{ step: 0.1, min: 0.1 }}
                sx={{ flex: 1 }}
              />

              <TextField
                label="Unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
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

              <TextField
                label="Meal"
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                select
                sx={{ flex: 1 }}
              >
                <MenuItem value="breakfast">🌅 Breakfast</MenuItem>
                <MenuItem value="lunch">🌞 Lunch</MenuItem>
                <MenuItem value="dinner">🌙 Dinner</MenuItem>
                <MenuItem value="snacks">🍎 Snacks</MenuItem>
              </TextField>
            </Box>

            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<QueueIcon />}
                onClick={() => addToQueue()}
                disabled={!currentInput.trim()}
              >
                Add to Queue
              </Button>
            </Box>
          </Box>

          {/* Personal Food Suggestions */}
          {personalSuggestions.length > 0 && (
            <Box>
              <Typography variant="subtitle2" gutterBottom color="primary">
                🚀 Your Foods (Ready to Add):
              </Typography>
              <Stack spacing={1}>
                {personalSuggestions.map((food) => (
                  <Card key={food._id} variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.200' }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body1" fontWeight="bold">
                            {food.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {food.defaultQuantity} {food.defaultUnit} • {food.nutrition?.calories || 0} cal
                            {food.timesUsed > 1 && ` • Used ${food.timesUsed} times`}
                            <Chip label="No AI needed" size="small" color="success" sx={{ ml: 1 }} />
                          </Typography>
                        </Box>
                        <Box display="flex" gap={1}>
                          <Button
                            size="small"
                            variant="contained"
                            startIcon={<QueueIcon />}
                            onClick={() => addToQueue(true, food._id, food)}
                          >
                            Add to Queue
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
              <Divider sx={{ my: 2 }} />
            </Box>
          )}

          {isSearching && (
            <Box display="flex" alignItems="center" gap={1}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                Searching your foods...
              </Typography>
            </Box>
          )}

          {/* Queue Display */}
          {queue.length > 0 && (
            <Box>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Queue ({queue.length} items)
                </Typography>
                {readyCount > 0 && (
                  <Chip label={`${readyCount} ready`} color="success" size="small" />
                )}
                {needsAnalysisCount > 0 && (
                  <Chip label={`${needsAnalysisCount} need analysis`} color="warning" size="small" />
                )}
              </Box>

              <Stack spacing={1} sx={{ mb: 2 }}>
                {queue.map((item) => (
                  <Card key={item.id} variant="outlined">
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                      <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box>
                          <Typography variant="body1">
                            {item.quantity} {item.unit} {item.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.mealType} • {item.isPersonalFood ? 'Personal Food' : 'Needs AI Analysis'}
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Chip
                            label={item.status === 'ready' ? 'Ready' : 'Analysis Needed'}
                            color={item.status === 'ready' ? 'success' : 'warning'}
                            size="small"
                          />
                          <IconButton
                            size="small"
                            onClick={() => removeFromQueue(item.id)}
                          >
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              <Box display="flex" gap={1}>
                <Button
                  variant="contained"
                  startIcon={isProcessing ? <CircularProgress size={20} /> : <ProcessIcon />}
                  onClick={processQueue}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Processing...' : 'Process All Items'}
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<ClearIcon />}
                  onClick={clearQueue}
                  disabled={isProcessing}
                >
                  Clear Queue
                </Button>
              </Box>
            </Box>
          )}
        </Stack>
      </DialogContent>
    </Dialog>
  );
}; 