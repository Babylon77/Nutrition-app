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
  MenuItem,
  Stack,
  Grid,
  Tabs,
  Tab,
  InputAdornment,
  Fab,
  Tooltip,
  Paper,
  DialogContentText,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Restaurant as RestaurantIcon,
  Star as StarIcon,
  Category as CategoryIcon,
  AccessTime as AccessTimeIcon,
  FilterList as FilterListIcon,
  SortByAlpha as SortByAlphaIcon,
  CloudUpload as ImportIcon,
} from '@mui/icons-material';

interface PersonalFood {
  id: string;
  name: string;
  defaultQuantity: number;
  defaultUnit: string;
  category: string;
  isFavorite: boolean;
  timesUsed: number;
  lastUsed?: string;
  sourceType: 'ai_analyzed' | 'user_created' | 'imported';
  notes?: string;
  nutrition: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    [key: string]: any;
  };
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`personal-foods-tabpanel-${index}`}
      aria-labelledby={`personal-foods-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: { xs: 1, sm: 3 } }}>{children}</Box>}
    </div>
  );
}

const PersonalFoods: React.FC = () => {
  const [personalFoods, setPersonalFoods] = useState<PersonalFood[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTab, setCurrentTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<PersonalFood | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importDays, setImportDays] = useState(30);

  // Form state for create/edit
  const [formData, setFormData] = useState({
    name: '',
    defaultQuantity: 1,
    defaultUnit: 'serving',
    category: 'other',
    notes: '',
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
    }
  });

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snack', label: 'Snacks' },
    { value: 'protein', label: 'Protein' },
    { value: 'carbs', label: 'Carbs' },
    { value: 'vegetables', label: 'Vegetables' },
    { value: 'fruits', label: 'Fruits' },
    { value: 'dairy', label: 'Dairy' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'other', label: 'Other' },
  ];

  const units = [
    'serving', 'cup', 'oz', 'g', 'kg', 'lb', 'piece', 'slice', 'tbsp', 'tsp', 'ml', 'l'
  ];

  useEffect(() => {
    loadPersonalFoods();
  }, [searchQuery, currentTab]);

  const loadPersonalFoods = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);

      // Determine sort/filter based on currentTab
      switch (currentTab) {
        case 0: // Popular
          params.append('sort', 'timesUsed_desc');
          break;
        case 1: // Recent
          params.append('sort', 'lastUsed_desc');
          break;
        case 2: // Favorites
          params.append('favorites', 'true');
          // Backend should handle default sort for favorites (e.g., by name or lastUsed)
          break;
      }

      const response = await fetch(`/api/personal-foods?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.message || 'Failed to load personal foods');
      }

      const result = await response.json();
      setPersonalFoods(result.data.foods || []);
    } catch (error: any) {
      console.error('Error loading personal foods:', error);
      setError(error.message || 'Failed to load personal foods');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFood = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await fetch('/api/personal-foods', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create food');
      }

      setCreateDialogOpen(false);
      resetForm();
      loadPersonalFoods();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditFood = async () => {
    if (!selectedFood) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/personal-foods/${selectedFood.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update food');
      }

      setEditDialogOpen(false);
      setSelectedFood(null);
      resetForm();
      loadPersonalFoods();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFood = async (foodId: string) => {
    if (!window.confirm('Are you sure you want to delete this food?')) return;

    try {
      setLoading(true);
      setError('');

      const response = await fetch(`/api/personal-foods/${foodId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete food');
      }

      loadPersonalFoods();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (food: PersonalFood) => {
    try {
      const response = await fetch(`/api/personal-foods/${food.id}/favorite`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to toggle favorite');
      }

      loadPersonalFoods();
    } catch (error: any) {
      setError(error.message);
    }
  };

  const handleImportFromLogs = async (days: number = 30) => {
    try {
      setImporting(true);
      setError('');
      const response = await fetch(`/api/personal-foods/import-from-logs?days=${days}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import foods from logs');
      }
      const result = await response.json();
      alert(result.message || `${result.data?.importedCount || 0} new foods imported, ${result.data?.duplicates || 0} duplicates found/updated.`);
      loadPersonalFoods();
    } catch (err: any) {
      setError(err.message || 'Import failed. Please try again.');
    } finally {
      setImporting(false);
      setImportDialogOpen(false);
    }
  };

  const openEditDialog = (food: PersonalFood) => {
    setSelectedFood(food);
    setFormData({
      name: food.name,
      defaultQuantity: food.defaultQuantity,
      defaultUnit: food.defaultUnit,
      category: food.category,
      notes: food.notes || '',
      nutrition: {
        calories: food.nutrition.calories || 0,
        protein: food.nutrition.protein || 0,
        carbs: food.nutrition.carbs || 0,
        fat: food.nutrition.fat || 0,
      },
    });
    setEditDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      defaultQuantity: 1,
      defaultUnit: 'serving',
      category: 'other',
      notes: '',
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: { [key: string]: string } = {
      breakfast: 'warning',
      lunch: 'info',
      dinner: 'success',
      snack: 'secondary',
      protein: 'error',
      carbs: 'primary',
      vegetables: 'success',
      fruits: 'warning',
      dairy: 'info',
      beverages: 'primary',
      other: 'default',
    };
    return colors[category] || 'default';
  };

  const formatLastUsed = (lastUsed?: string) => {
    if (!lastUsed) return 'Never used';
    const date = new Date(lastUsed);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  };

  return (
    <Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
          My Personal Foods
      </Typography>
        <Box sx={{display: 'flex', gap: 1}}>
          <Button
            variant="outlined"
                startIcon={<ImportIcon />} 
            onClick={() => setImportDialogOpen(true)}
          >
              Import from Logs
          </Button>
            <Tooltip title="Add New Personal Food">
                <Fab 
                  color="primary" 
                  aria-label="add food"
                  onClick={() => { resetForm(); setCreateDialogOpen(true); }}
                  sx={{ position: 'fixed', bottom: { xs: 70, sm: 30 }, right: { xs: 16, sm: 30 }, zIndex: 1050 }}
                >
                    <AddIcon />
                </Fab>
            </Tooltip>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      <Paper elevation={1} sx={{ p: 1.5, mb: 2, borderRadius: 'var(--border-radius-lg)' }}>
        <Box sx={{ width: '100%' }}>
            <TextField
              fullWidth
            variant="outlined"
            placeholder="Search my foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              sx: { borderRadius: 'var(--border-radius-md)' }
            }}
          />
        </Box>
      </Paper>

        <Tabs
          value={currentTab}
        onChange={(e, newValue) => setCurrentTab(newValue)} 
        centered 
        variant="fullWidth" 
        sx={{mb:2}}
        >
          <Tab 
          label="Popular" 
          icon={<StarIcon />} 
          iconPosition="start" 
          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, minWidth: {xs: 'auto'} }}
          />
          <Tab 
            label="Recent" 
          icon={<AccessTimeIcon />} 
          iconPosition="start" 
          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, minWidth: {xs: 'auto'} }}
          />
          <Tab 
          label="Favorites" 
          icon={<FavoriteIcon />} 
          iconPosition="start" 
          sx={{ fontSize: { xs: '0.65rem', sm: '0.75rem' }, minWidth: {xs: 'auto'} }}
          />
        </Tabs>

        <TabPanel value={currentTab} index={0}>
          <FoodList 
            foods={personalFoods} 
            loading={loading}
            onEdit={openEditDialog}
            onDelete={handleDeleteFood}
            onToggleFavorite={handleToggleFavorite}
            getCategoryColor={getCategoryColor}
            formatLastUsed={formatLastUsed}
          />
        </TabPanel>
        <TabPanel value={currentTab} index={1}>
          <FoodList 
            foods={personalFoods} 
            loading={loading}
            onEdit={openEditDialog}
            onDelete={handleDeleteFood}
            onToggleFavorite={handleToggleFavorite}
            getCategoryColor={getCategoryColor}
            formatLastUsed={formatLastUsed}
          />
        </TabPanel>
        <TabPanel value={currentTab} index={2}>
          <FoodList 
            foods={personalFoods} 
            loading={loading}
            onEdit={openEditDialog}
            onDelete={handleDeleteFood}
            onToggleFavorite={handleToggleFavorite}
            getCategoryColor={getCategoryColor}
            formatLastUsed={formatLastUsed}
          />
        </TabPanel>

      <Dialog open={createDialogOpen || editDialogOpen} onClose={() => { setCreateDialogOpen(false); setEditDialogOpen(false); setSelectedFood(null); resetForm(); }} maxWidth="sm" fullWidth>
        <DialogTitle>{selectedFood ? 'Edit' : 'Create'} Personal Food</DialogTitle>
        <DialogContent>
             <FoodForm formData={formData} setFormData={setFormData} categories={categories} units={units} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setCreateDialogOpen(false); setEditDialogOpen(false); setSelectedFood(null); resetForm(); }}>Cancel</Button>
          <Button onClick={selectedFood ? handleEditFood : handleCreateFood} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24}/> : (selectedFood ? 'Save Changes' : 'Create Food')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Import Foods from Your Logs</DialogTitle>
        <DialogContent>
            <DialogContentText sx={{mb: 2}}>
                Quickly add foods to your personal list that you've logged recently.
                Select how far back you'd like to search.
            </DialogContentText>
          <TextField
            select
            fullWidth
            label="Import foods logged in the last..."
            value={importDays}
            onChange={(e) => setImportDays(Number(e.target.value))}
            variant="outlined"
            sx={{mt:1}}
          >
            <MenuItem value={7}>7 days</MenuItem>
            <MenuItem value={30}>30 days</MenuItem>
            <MenuItem value={90}>90 days</MenuItem>
            <MenuItem value={365}>1 Year</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleImportFromLogs(importDays)} variant="contained" disabled={importing}>
            {importing ? <CircularProgress size={24} /> : 'Start Import'}
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};

interface FoodListProps {
  foods: PersonalFood[];
  loading: boolean;
  onEdit: (food: PersonalFood) => void;
  onDelete: (foodId: string) => void;
  onToggleFavorite: (food: PersonalFood) => void;
  getCategoryColor: (category: string) => string;
  formatLastUsed: (lastUsed?: string) => string;
}

const FoodList: React.FC<FoodListProps> = ({
  foods,
  loading,
  onEdit,
  onDelete,
  onToggleFavorite,
  getCategoryColor,
  formatLastUsed,
}) => {
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (foods.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', p: 4 }}>
        <Typography variant="h6" color="text.secondary">
          No foods found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Try adjusting your search or add some foods to your database
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {foods.map((food) => (
        <ListItem key={food.id} divider sx={{ 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' },
          py: 2
        }}>
          <ListItemText
            sx={{ mb: { xs: 1, sm: 0 } }}
            primary={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                <Typography variant="h6">{food.name}</Typography>
                <Chip
                  label={food.category}
                  size="small"
                  color={getCategoryColor(food.category) as any}
                />
                {food.isFavorite && <StarIcon color="warning" fontSize="small" />}
              </Box>
            }
            secondary={
              <Stack spacing={1}>
                <Typography variant="body2">
                  {food.defaultQuantity} {food.defaultUnit} • {food.nutrition.calories || 0} cal
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Used {food.timesUsed} times • {formatLastUsed(food.lastUsed)}
                </Typography>
                {food.notes && (
                  <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                    {food.notes}
                  </Typography>
                )}
              </Stack>
            }
          />
          
          <Box sx={{ 
            display: 'flex',
            flexDirection: { xs: 'row', sm: 'row' },
            gap: { xs: 0.5, sm: 1 },
            justifyContent: { xs: 'center', sm: 'flex-end' },
            mt: { xs: 1, sm: 0 }
          }}>
            <Tooltip title={food.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
              <IconButton 
                onClick={() => onToggleFavorite(food)}
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
              >
                {food.isFavorite ? <FavoriteIcon color="warning" /> : <FavoriteBorderIcon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit food">
              <IconButton 
                onClick={() => onEdit(food)}
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
              >
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete food">
              <IconButton 
                onClick={() => onDelete(food.id)} 
                color="error"
                size="small"
                sx={{ fontSize: { xs: '0.75rem', sm: '1rem' } }}
              >
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </ListItem>
      ))}
    </List>
  );
};

interface FoodFormProps {
  formData: any;
  setFormData: (data: any) => void;
  categories: { value: string; label: string }[];
  units: string[];
}

const FoodForm: React.FC<FoodFormProps> = ({ formData, setFormData, categories, units }) => {
  const handleChange = (field: string, value: any) => {
    if (field.startsWith('nutrition.')) {
      const nutritionField = field.split('.')[1];
      setFormData({
        ...formData,
        nutrition: {
          ...formData.nutrition,
          [nutritionField]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [field]: value,
      });
    }
  };

  return (
    <Stack spacing={3} sx={{ pt: 2 }}>
      <TextField
        fullWidth
        label="Food Name"
        value={formData.name}
        onChange={(e) => handleChange('name', e.target.value)}
        required
      />
      
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="Default Quantity"
          type="number"
          value={formData.defaultQuantity}
          onChange={(e) => handleChange('defaultQuantity', parseFloat(e.target.value))}
          required
          inputProps={{ min: 0.1, step: 0.1 }}
        />
        <TextField
          fullWidth
          select
          label="Unit"
          value={formData.defaultUnit}
          onChange={(e) => handleChange('defaultUnit', e.target.value)}
          required
        >
          {units.map((unit) => (
            <MenuItem key={unit} value={unit}>
              {unit}
            </MenuItem>
          ))}
        </TextField>
      </Stack>

      <TextField
        fullWidth
        select
        label="Category"
        value={formData.category}
        onChange={(e) => handleChange('category', e.target.value)}
        required
      >
        {categories.map((category) => (
          <MenuItem key={category.value} value={category.value}>
            {category.label}
          </MenuItem>
        ))}
      </TextField>

      <Typography variant="h6">Nutrition Information (per serving)</Typography>
      
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="Calories"
          type="number"
          value={formData.nutrition.calories}
          onChange={(e) => handleChange('nutrition.calories', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0 }}
        />
        <TextField
          fullWidth
          label="Protein (g)"
          type="number"
          value={formData.nutrition.protein}
          onChange={(e) => handleChange('nutrition.protein', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, step: 0.1 }}
        />
      </Stack>
      
      <Stack direction="row" spacing={2}>
        <TextField
          fullWidth
          label="Carbs (g)"
          type="number"
          value={formData.nutrition.carbs}
          onChange={(e) => handleChange('nutrition.carbs', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, step: 0.1 }}
        />
        <TextField
          fullWidth
          label="Fat (g)"
          type="number"
          value={formData.nutrition.fat}
          onChange={(e) => handleChange('nutrition.fat', parseFloat(e.target.value) || 0)}
          inputProps={{ min: 0, step: 0.1 }}
        />
      </Stack>

      <TextField
        fullWidth
        label="Notes (optional)"
        multiline
        rows={3}
        value={formData.notes}
        onChange={(e) => handleChange('notes', e.target.value)}
        placeholder="Any additional notes about this food..."
      />
    </Stack>
  );
};

export default PersonalFoods; 