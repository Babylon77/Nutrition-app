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
import { FoodItem } from '../types';

interface PersonalFood {
  _id: string;
  id: string;
  name: string;
  defaultQuantity: number;
  defaultUnit: string;
  nutrition: any;
  timesUsed: number;
}

// For storing specific subset of personal food data within a queued item
interface QueuedPersonalFoodData {
  _id: string;
  name: string;
  nutrition: any;
  defaultQuantity: number;
  defaultUnit: string;
}

interface QueuedFood {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  mealType: string;
  isPersonalFood: boolean;
  personalFoodId?: string;
  personalFoodData?: QueuedPersonalFoodData;
  status: 'ready' | 'needs_analysis';
}

interface SmartFoodEntryProps {
  open: boolean;
  onClose: () => void;
  onFoodsAdded: (foodItems: any[]) => void;
  defaultMealType?: string;
  selectedDate?: Date;
}

export const SmartFoodEntry: React.FC<SmartFoodEntryProps> = ({
  open,
  onClose,
  onFoodsAdded,
  defaultMealType = 'breakfast',
  selectedDate
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

  const debouncedInput = useDebounce(currentInput, 750);
  const searchCache = React.useRef<{ [key: string]: PersonalFood[] }>({});

  // Prepare suggestion list content with logging
  let suggestionListContent = null;
  if (personalSuggestions && personalSuggestions.length > 0) {
    const ids = personalSuggestions.map(f => f && f.id !== undefined && f.id !== null ? f.id : 'MISSING_FOOD_ID');
    console.log('[SmartFoodEntry] Rendering personalSuggestions with keys (using food.id):', ids);
    
    const uniqueIds = new Set(ids);
    if (uniqueIds.size !== ids.length) {
      console.error('[SmartFoodEntry] DUPLICATE food.id values found in personalSuggestions. All IDs:', ids);
    }
    if (ids.includes('MISSING_FOOD_ID')) {
      console.warn('[SmartFoodEntry] UNDEFINED or NULL food.id values present in personalSuggestions. All IDs:', ids);
    }

    suggestionListContent = personalSuggestions.map((food) => {
      if (!food || typeof food.id === 'undefined' || food.id === null) {
        return null; // Skip rendering this item
      }
      return (
        <Box key={food.id}>
          <Card variant="outlined" sx={{ bgcolor: 'success.50', borderColor: 'success.200' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  <Typography variant="body1" fontWeight="bold">
                    {food.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" component="div">
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
                    onClick={() => addToQueue(true, food.id, food)}
                    data-tour="add-to-queue"
                  >
                    Add to Queue
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      );
    });
  }

  // Search personal foods as user types
  useEffect(() => {
    if (debouncedInput.trim() && debouncedInput.length >= 2) {
      searchPersonalFoods(debouncedInput);
    } else {
      setPersonalSuggestions([]);
    }
  }, [debouncedInput]);

  // Remove this useEffect as loadQueue is removed.
  useEffect(() => {
    if (!open) {
      // Clear search cache when dialog closes
      searchCache.current = {}; 
    }
  }, [open]);

  const searchPersonalFoods = async (query: string) => {
    if (searchCache.current[query]) {
      console.log(`CACHE HIT for: "${query}"`);
      setPersonalSuggestions(searchCache.current[query]);
      setIsSearching(false); // Ensure searching state is reset
      return;
    }
    console.log(`CACHE MISS for: "${query}"`);

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
        const suggestions = result.data.suggestions || [];
        setPersonalSuggestions(suggestions);
        searchCache.current[query] = suggestions; // Store in cache
        console.log(`📝 Found ${suggestions.length} personal foods`);
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

  const addToQueue = (isPersonalFood = false, personalFoodId?: string, personalFoodData?: PersonalFood) => {
    const foodName = isPersonalFood && personalFoodData ? personalFoodData.name : currentInput;
    
    if (!foodName.trim()) return;

    // Generate a unique client-side ID for the queue item
    const clientSideId = Date.now().toString() + '-' + Math.random().toString(36).substring(2, 9);

    const newQueuedItem: QueuedFood = {
      id: clientSideId, // Use client-generated ID
      name: foodName,
      quantity,
      unit,
      mealType,
      isPersonalFood,
      personalFoodId: isPersonalFood ? (personalFoodId) : undefined,
      personalFoodData: isPersonalFood && personalFoodData ? {
        _id: personalFoodData.id,
        name: personalFoodData.name,
        nutrition: personalFoodData.nutrition,
        defaultQuantity: personalFoodData.defaultQuantity,
        defaultUnit: personalFoodData.defaultUnit
      } : undefined,
      status: isPersonalFood ? 'ready' : 'needs_analysis'
    };

    // Add this console.log for debugging personal food additions
    if (isPersonalFood) {
      console.log('CLIENT addToQueue - Adding PERSONAL food:', newQueuedItem);
    } else {
      console.log('CLIENT addToQueue - Adding NEW food:', newQueuedItem);
    }

    setQueue(prevQueue => [...prevQueue, newQueuedItem]);
    setCurrentInput('');
    setPersonalSuggestions([]);
    // No API call here, backend will get the full queue on processQueue
  };

  const removeFromQueue = (itemId: string) => {
    setQueue(prevQueue => prevQueue.filter(item => item.id !== itemId));
    // No API call here
  };

  const clearQueue = () => {
    setQueue([]);
    // No API call here
  };

  const processQueue = async () => {
    if (queue.length === 0) return;

    try {
      setIsProcessing(true);
      setError('');

      console.log('🎯 PROCESS QUEUE - Starting queue processing...');
      console.log('📋 PROCESS QUEUE - Current queue:', queue);
      
      // Log personal foods vs AI foods
      const personalFoods = queue.filter(item => item.isPersonalFood);
      const aiFoods = queue.filter(item => !item.isPersonalFood);
      console.log(`🥗 PROCESS QUEUE - Personal foods: ${personalFoods.length}`, personalFoods);
      console.log(`🤖 PROCESS QUEUE - AI foods: ${aiFoods.length}`, aiFoods);

      const response = await fetch('/api/food/smart-entry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ action: 'process_queue', data: { itemsToProcess: queue } }),
      });

      console.log(`📡 PROCESS QUEUE - Response status: ${response.status}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ PROCESS QUEUE - Response not OK:', errorText);
        throw new Error(`Process queue failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('📥 PROCESS QUEUE - Response result:', result);
      
      if (result.success) {
        const processedFoods = result.data.processedItems || [];
        console.log('✅ PROCESS QUEUE - Processed foods:', processedFoods);
        console.log(`📊 PROCESS QUEUE - Total processed: ${processedFoods.length} items`);
        
        onFoodsAdded(processedFoods);
        setQueue([]);
        onClose();
        console.log('🎉 PROCESS QUEUE - Successfully completed processing!');
      } else {
        console.error('❌ PROCESS QUEUE - Result not successful:', result);
        throw new Error(result.message || 'Process queue was not successful');
      }
    } catch (err: any) {
      console.error('❌ PROCESS QUEUE - Error during processing:', err);
      setError(err.message || 'Failed to process queue');
    } finally {
      setIsProcessing(false);
    }
  };

  const readyCount = queue.filter(item => item.status === 'ready').length;
  const needsAnalysisCount = queue.filter(item => item.status === 'needs_analysis').length;

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="md" 
      fullWidth
      scroll="paper"
      sx={{
        '& .MuiDialog-paper': {
          margin: { xs: 1, sm: 2 },
          maxHeight: { xs: 'calc(100vh - 16px)', sm: 'calc(100vh - 64px)' },
          width: { xs: 'calc(100vw - 16px)', sm: 'auto' }
        }
      }}
    >
      <DialogTitle>Smart Food Entry</DialogTitle>
      <DialogContent sx={{ overflowY: 'auto' }}>
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
              fullWidth
              label="Search for food or start typing..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              sx={{ mb: 2 }}
              data-tour="search-input"
              autoFocus
              size="small"
            />

            <Stack 
              spacing={2}
              sx={{ mb: 2 }}
            >
              <Stack 
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
              >
                <TextField
                  label="Quantity"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  inputProps={{ step: 0.1, min: 0.1 }}
                  fullWidth
                  size="small"
                />

                <TextField
                  label="Unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  select
                  fullWidth
                  size="small"
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
                  fullWidth
                  size="small"
                >
                  <MenuItem value="breakfast">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🌅</span>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Breakfast</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Brkfst</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="lunch">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🌞</span>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Lunch</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Lunch</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="dinner">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🌙</span>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Dinner</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Dinner</Box>
                    </Box>
                  </MenuItem>
                  <MenuItem value="snacks">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <span>🍎</span>
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Snacks</Box>
                      <Box sx={{ display: { xs: 'block', sm: 'none' } }}>Snacks</Box>
                    </Box>
                  </MenuItem>
                </TextField>
              </Stack>
            </Stack>

            <Box display="flex" gap={1}>
              <Button
                variant="outlined"
                startIcon={<QueueIcon />}
                onClick={() => addToQueue()}
                disabled={!currentInput.trim()}
                size="small"
              >
                Add to Queue
              </Button>
            </Box>
          </Box>

          {/* Personal Food Suggestions */}
          {personalSuggestions.length > 0 && (
            <Box data-tour="personal-foods">
              <Typography variant="subtitle2" gutterBottom color="primary">
                🚀 Your Foods (Ready to Add):
              </Typography>
              <Stack spacing={1}>
                {suggestionListContent}
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
            <Box data-tour="food-queue">
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
                          <Typography variant="body2" color="text.secondary" component="div">
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