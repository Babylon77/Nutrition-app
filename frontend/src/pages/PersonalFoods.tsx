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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [currentTab, setCurrentTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedFood, setSelectedFood] = useState<PersonalFood | null>(null);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [importing, setImporting] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'timesUsed'>('recent');

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
  }, [searchQuery, selectedCategory, currentTab, sortBy]);

  const loadPersonalFoods = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      if (searchQuery) params.append('search', searchQuery);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (currentTab === 1) params.append('favorites', 'true');
      if (sortBy === 'recent') params.append('sort', 'lastUsed_desc');
      if (sortBy === 'alphabetical') params.append('sort', 'name_asc');
      if (sortBy === 'timesUsed') params.append('sort', 'timesUsed_desc');

      const response = await fetch(`/api/personal-foods?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load personal foods');
      }

      const result = await response.json();
      setPersonalFoods(result.data.foods || []);
    } catch (error) {
      console.error('Error loading personal foods:', error);
      setError('Failed to load personal foods');
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

      // First, clear existing imported foods for accurate re-import
      const clearResponse = await fetch('/api/personal-foods/clear-imported', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!clearResponse.ok) {
        throw new Error('Failed to clear existing imported foods');
      }

      const clearResult = await clearResponse.json();
      console.log(`Cleared ${clearResult.data.deletedCount} existing imported foods`);

      // Now import with correct usage counts
      const response = await fetch('/api/personal-foods/import-from-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ days }),
      });

      if (!response.ok) {
        throw new Error('Failed to import foods from logs');
      }

      const result = await response.json();
      console.log('Import result:', result);
      
      // Show success message
      setError(''); // Clear any previous errors
      alert(`Successfully imported ${result.data.imported} foods with accurate usage counts! ${result.data.duplicates} were already in your database.`);
      
      // Reload the personal foods list
      loadPersonalFoods();
      setImportDialogOpen(false);
    } catch (error: any) {
      console.error('Import error:', error);
      setError(error.message || 'Failed to import foods from logs');
    } finally {
      setImporting(false);
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
    <Box sx={{ flexGrow: 1, bgcolor: 'background.paper', p: { xs: 1, sm: 2, md: 3 } }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        My Personal Foods
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
        <TextField
          label="Search Foods"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ minWidth: { xs: '100%', sm: 300 } }}
        />
        <Stack direction="row" spacing={1} alignItems="center">
          <TextField
            select
            label="Sort By"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'recent' | 'alphabetical' | 'timesUsed')}
            size="small"
            variant="outlined"
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="recent">Most Recent</MenuItem>
            <MenuItem value="alphabetical">A-Z</MenuItem>
            <MenuItem value="timesUsed">Most Used</MenuItem>
          </TextField>
          <TextField
            select
            label="Filter by Category"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            size="small"
            variant="outlined"
            sx={{ minWidth: 180 }}
          >
            {categories.map((category) => (
              <MenuItem key={category.value} value={category.value}>
                {category.label}
              </MenuItem>
            ))}
          </TextField>
        </Stack>
      </Box>

      <Tabs value={currentTab} onChange={(event, newValue) => setCurrentTab(newValue)} indicatorColor="primary" textColor="primary" variant="fullWidth">
        <Tab label="All Foods" icon={<RestaurantIcon />} iconPosition="start" />
        <Tab label="Favorites" icon={<FavoriteIcon />} iconPosition="start" />
        <Tab label="By Category" icon={<CategoryIcon />} iconPosition="start" />
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
          foods={personalFoods.filter(food => food.isFavorite)}
          loading={loading}
          onEdit={openEditDialog}
          onDelete={handleDeleteFood}
          onToggleFavorite={handleToggleFavorite}
          getCategoryColor={getCategoryColor}
          formatLastUsed={formatLastUsed}
        />
      </TabPanel>
      <TabPanel value={currentTab} index={2}>
        {/* This tab can be used to display foods grouped by category if needed, or removed if filter is sufficient */}
        <Typography>Filter by category using the dropdown above.</Typography>
         <FoodList
          foods={personalFoods} // Already filtered by selectedCategory in API call
          loading={loading}
          onEdit={openEditDialog}
          onDelete={handleDeleteFood}
          onToggleFavorite={handleToggleFavorite}
          getCategoryColor={getCategoryColor}
          formatLastUsed={formatLastUsed}
        />
      </TabPanel>

      {/* Create/Edit Dialogs and Import Dialog as before */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add New Personal Food</DialogTitle>
        <DialogContent>
          <FoodForm formData={formData} setFormData={setFormData} categories={categories} units={units} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateFood} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Create Food'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Personal Food</DialogTitle>
        <DialogContent>
          <FoodForm formData={formData} setFormData={setFormData} categories={categories} units={units} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleEditFood} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={importDialogOpen} onClose={() => setImportDialogOpen(false)}>
        <DialogTitle>Import Foods from Log</DialogTitle>
        <DialogContent>
          <Typography>This will import unique foods from your recent food logs (last 30 days) into your personal food list.</Typography>
          {error && <Alert severity="error" sx={{ mt: 1 }}>{error}</Alert>}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setImportDialogOpen(false)}>Cancel</Button>
          <Button onClick={() => handleImportFromLogs(30)} variant="contained" disabled={importing}>
            {importing ? <CircularProgress size={24} /> : 'Import Now'}
          </Button>
        </DialogActions>
      </Dialog>

      <Tooltip title="Add New Personal Food">
        <Fab
          color="primary"
          aria-label="add"
          onClick={() => setCreateDialogOpen(true)}
          sx={{
            position: 'fixed',
            bottom: { xs: 80, sm: 30 }, // Adjusted for mobile bottom nav
            right: { xs: 20, sm: 30 },
            zIndex: 1000
          }}
        >
          <AddIcon />
        </Fab>
      </Tooltip>
    </Box>
  );
};

// Food List Component
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
          
          {/* Mobile-friendly action buttons */}
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

// Food Form Component
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