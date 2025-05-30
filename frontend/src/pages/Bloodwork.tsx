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
  Tabs,
  Tab,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Biotech as BiotechIcon,
  GetApp as DownloadIcon,
  Visibility as ViewIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { apiService } from '../services/api';
import { BloodworkEntry, LabValue } from '../types';

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
      id={`bloodwork-tabpanel-${index}`}
      aria-labelledby={`bloodwork-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

interface ManualEntryFormData {
  date: Date;
  labValues: LabValue[];
}

export const Bloodwork: React.FC = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [bloodworkEntries, setBloodworkEntries] = useState<BloodworkEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ManualEntryFormData>({
    defaultValues: {
      date: new Date(),
      labValues: [
        {
          name: '',
          value: 0,
          unit: '',
          referenceRange: '',
          category: 'other',
        },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'labValues',
  });

  useEffect(() => {
    loadBloodworkEntries();
  }, []);

  const loadBloodworkEntries = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getBloodworkEntries();
      setBloodworkEntries(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bloodwork entries');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    try {
      setUploadLoading(true);
      await apiService.uploadBloodworkPDF(selectedFile);
      await loadBloodworkEntries();
      setUploadDialogOpen(false);
      setSelectedFile(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to upload bloodwork');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleManualEntry = async (data: ManualEntryFormData) => {
    try {
      const dateStr = data.date.toISOString().split('T')[0];
      await apiService.createBloodworkEntry(dateStr, data.labValues);
      await loadBloodworkEntries();
      setManualEntryOpen(false);
      reset();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create bloodwork entry');
    }
  };

  const deleteBloodworkEntry = async (id: string) => {
    try {
      await apiService.deleteBloodworkEntry(id);
      await loadBloodworkEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete bloodwork entry');
    }
  };

  const viewPDF = (entry: BloodworkEntry) => {
    if (entry.source === 'pdf' && entry.filename) {
      const pdfUrl = apiService.getBloodworkPDFUrl(entry._id);
      window.open(pdfUrl, '_blank');
    }
  };

  const getStatusColor = (status?: string): 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' => {
    switch (status) {
      case 'normal':
        return 'success';
      case 'high':
      case 'low':
        return 'warning';
      case 'critical':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'normal':
        return <CheckCircleIcon />;
      case 'high':
      case 'low':
      case 'critical':
        return <WarningIcon />;
      default:
        return null;
    }
  };

  const categorizeLabValues = (labValues: LabValue[]) => {
    const categories = {
      lipids: [] as LabValue[],
      glucose: [] as LabValue[],
      liver: [] as LabValue[],
      kidney: [] as LabValue[],
      thyroid: [] as LabValue[],
      vitamins: [] as LabValue[],
      minerals: [] as LabValue[],
      other: [] as LabValue[],
    };

    labValues.forEach((lab) => {
      const category = lab.category || 'other';
      categories[category].push(lab);
    });

    return categories;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
          Health Metrics & Bloodwork
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2, 
          mb: 3 
        }}>
          <Button
            variant="contained"
            startIcon={<UploadIcon />}
            onClick={() => setUploadDialogOpen(true)}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Upload PDF
          </Button>
          <Button
            variant="outlined"
            startIcon={<AddIcon />}
            onClick={() => setManualEntryOpen(true)}
            size="small"
            sx={{ width: { xs: '100%', sm: 'auto' } }}
          >
            Manual Entry
          </Button>
        </Box>

        {/* Health Metrics Entries */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={3}>
            <CircularProgress />
          </Box>
        ) : bloodworkEntries.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {bloodworkEntries.map((entry) => (
              <Card key={entry._id}>
                <CardContent>
                  <Box 
                    display="flex" 
                    flexDirection={{ xs: 'column', md: 'row' }}
                    justifyContent="space-between" 
                    alignItems={{ xs: 'stretch', md: 'center' }}
                    gap={2}
                    mb={2}
                  >
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {new Date(entry.date).toLocaleDateString()}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                        {entry.source === 'pdf' ? 'PDF Upload' : 'Manual Entry'} • {entry.labValues.length} values
                      </Typography>
                    </Box>
                    <Box display="flex" gap={1}>
                      <IconButton 
                        onClick={() => viewPDF(entry)}
                        size="small"
                      >
                        <ViewIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => deleteBloodworkEntry(entry._id)}
                        size="small"
                        color="error"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </Box>

                  {/* Lab Values Summary */}
                  <Box>
                    <Typography variant="subtitle2" gutterBottom>
                      Lab Values:
                    </Typography>
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {entry.labValues.slice(0, 6).map((lab, index) => (
                        <Chip
                          key={index}
                          label={`${lab.name}: ${lab.value} ${lab.unit}`}
                          size="small"
                          color={getStatusColor(lab.status || 'normal')}
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      ))}
                      {entry.labValues.length > 6 && (
                        <Chip
                          label={`+${entry.labValues.length - 6} more`}
                          size="small"
                          variant="outlined"
                          sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' }, height: { xs: '20px', sm: '24px' } }}
                        />
                      )}
                    </Box>
                  </Box>

                  {/* Categorized Lab Values */}
                  <Box mt={2}>
                    <Tabs 
                      value={0} 
                      variant="scrollable" 
                      scrollButtons="auto"
                      sx={{
                        '& .MuiTab-root': {
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          minWidth: { xs: '60px', sm: '80px' },
                          px: { xs: 0.5, sm: 1 }
                        }
                      }}
                    >
                      <Tab 
                        label={
                          <>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                              All Values
                            </Box>
                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                              All
                            </Box>
                          </>
                        } 
                      />
                      <Tab label="Lipids" />
                      <Tab 
                        label={
                          <>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                              Glucose
                            </Box>
                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                              Gluc
                            </Box>
                          </>
                        } 
                      />
                      <Tab label="Liver" />
                      <Tab 
                        label={
                          <>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                              Kidney
                            </Box>
                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                              Kid
                            </Box>
                          </>
                        } 
                      />
                      <Tab 
                        label={
                          <>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                              Thyroid
                            </Box>
                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                              Thy
                            </Box>
                          </>
                        } 
                      />
                      <Tab 
                        label={
                          <>
                            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                              Vitamins
                            </Box>
                            <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                              Vit
                            </Box>
                          </>
                        } 
                      />
                    </Tabs>
                    
                    {/* Mobile-friendly table with horizontal scroll */}
                    <TableContainer 
                      component={Paper} 
                      sx={{ 
                        mt: 2,
                        maxWidth: '100%',
                        overflowX: 'auto'
                      }}
                    >
                      <Table size="small" sx={{ minWidth: { xs: 280, md: 'auto' } }}>
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Test Name</TableCell>
                            <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Value</TableCell>
                            <TableCell align="right" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Unit</TableCell>
                            <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' }, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              Reference Range
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {entry.labValues.map((lab, index) => (
                            <TableRow key={index}>
                              <TableCell component="th" scope="row">
                                <Box>
                                  <Typography variant="body2" fontWeight="medium">
                                    {lab.name}
                                  </Typography>
                                  {/* Show reference range on mobile under the name */}
                                  <Typography 
                                    variant="caption" 
                                    color="text.secondary"
                                    sx={{ display: { xs: 'block', sm: 'none' } }}
                                  >
                                    Range: {lab.referenceRange || 'N/A'}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight="medium">
                                  {lab.value}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2">
                                  {lab.unit}
                                </Typography>
                              </TableCell>
                              <TableCell align="right" sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                {lab.referenceRange || '-'}
                              </TableCell>
                              <TableCell align="center">
                                <Chip
                                  label={lab.status || 'Unknown'}
                                  size="small"
                                  color={getStatusColor(lab.status || 'normal')}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          <Card>
            <CardContent>
              <Box textAlign="center" py={6}>
                <BiotechIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No Health Metrics Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Upload your lab results or enter values manually to start tracking your health markers
                </Typography>
                <Box display="flex" gap={2} justifyContent="center">
                  <Button
                    variant="contained"
                    startIcon={<UploadIcon />}
                    onClick={() => setUploadDialogOpen(true)}
                  >
                    Upload PDF
                  </Button>
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setManualEntryOpen(true)}
                  >
                    Manual Entry
                  </Button>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Upload PDF Dialog */}
        <Dialog open={uploadDialogOpen} onClose={() => setUploadDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Upload Health Metrics PDF</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="info">
                Upload your lab results in PDF format. Our AI will automatically extract lab values.
              </Alert>
              
              <Box
                sx={{
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 1,
                  p: 3,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.hover',
                  },
                }}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <input
                  id="file-input"
                  type="file"
                  accept=".pdf"
                  style={{ display: 'none' }}
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <UploadIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
                <Typography variant="body1" gutterBottom>
                  {selectedFile ? selectedFile.name : 'Click to select PDF file'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Maximum file size: 10MB
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setUploadDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleFileUpload}
              variant="contained"
              disabled={!selectedFile || uploadLoading}
            >
              {uploadLoading ? <CircularProgress size={24} /> : 'Upload'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Manual Entry Dialog */}
        <Dialog open={manualEntryOpen} onClose={() => setManualEntryOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Manual Health Metrics Entry</DialogTitle>
          <form onSubmit={handleSubmit(handleManualEntry)}>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
                <Controller
                  name="date"
                  control={control}
                  rules={{ required: 'Date is required' }}
                  render={({ field }) => (
                    <DatePicker
                      label="Test Date"
                      value={field.value}
                      onChange={(newValue) => field.onChange(newValue)}
                      slotProps={{
                        textField: {
                          error: !!errors.date,
                          helperText: errors.date?.message,
                        },
                      }}
                    />
                  )}
                />

                <Typography variant="h6" sx={{ mt: 2 }}>
                  Lab Values
                </Typography>

                {fields.map((field, index) => (
                  <Card key={field.id} variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                        <Controller
                          name={`labValues.${index}.name`}
                          control={control}
                          rules={{ required: 'Test name is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Test Name"
                              error={!!errors.labValues?.[index]?.name}
                              helperText={errors.labValues?.[index]?.name?.message}
                              sx={{ flex: 2 }}
                            />
                          )}
                        />

                        <Controller
                          name={`labValues.${index}.value`}
                          control={control}
                          rules={{ required: 'Value is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Value"
                              type="number"
                              inputProps={{ step: 0.01 }}
                              error={!!errors.labValues?.[index]?.value}
                              helperText={errors.labValues?.[index]?.value?.message}
                              sx={{ flex: 1 }}
                            />
                          )}
                        />

                        <Controller
                          name={`labValues.${index}.unit`}
                          control={control}
                          rules={{ required: 'Unit is required' }}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Unit"
                              error={!!errors.labValues?.[index]?.unit}
                              helperText={errors.labValues?.[index]?.unit?.message}
                              sx={{ flex: 1 }}
                            />
                          )}
                        />

                        <Controller
                          name={`labValues.${index}.referenceRange`}
                          control={control}
                          render={({ field }) => (
                            <TextField
                              {...field}
                              label="Reference Range"
                              placeholder="e.g., 70-100"
                              sx={{ flex: 1 }}
                            />
                          )}
                        />

                        <Controller
                          name={`labValues.${index}.category`}
                          control={control}
                          render={({ field }) => (
                            <FormControl sx={{ flex: 1 }}>
                              <InputLabel>Category</InputLabel>
                              <Select {...field} label="Category">
                                <MenuItem value="lipids">Lipids</MenuItem>
                                <MenuItem value="glucose">Glucose</MenuItem>
                                <MenuItem value="liver">Liver</MenuItem>
                                <MenuItem value="kidney">Kidney</MenuItem>
                                <MenuItem value="thyroid">Thyroid</MenuItem>
                                <MenuItem value="vitamins">Vitamins</MenuItem>
                                <MenuItem value="minerals">Minerals</MenuItem>
                                <MenuItem value="other">Other</MenuItem>
                              </Select>
                            </FormControl>
                          )}
                        />

                        <IconButton
                          onClick={() => remove(index)}
                          disabled={fields.length === 1}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </CardContent>
                  </Card>
                ))}

                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() =>
                    append({
                      name: '',
                      value: 0,
                      unit: '',
                      referenceRange: '',
                      category: 'other',
                    })
                  }
                >
                  Add Lab Value
                </Button>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setManualEntryOpen(false)}>Cancel</Button>
              <Button type="submit" variant="contained">
                Save Entry
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Box>
    </LocalizationProvider>
  );
}; 