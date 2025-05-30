import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from '@mui/material';
import {
  Analytics as AnalyticsIcon,
  TrendingUp as TrendingUpIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Star as StarIcon,
  Science as ScienceIcon,
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { apiService } from '../services/api';
import { Analysis } from '../types';

interface GenerateAnalysisFormData {
  analysisType: 'nutrition' | 'bloodwork' | 'correlation';
  llmModel: string;
}

export const AnalysisPage: React.FC = () => {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [generateDialogOpen, setGenerateDialogOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [availableModels, setAvailableModels] = useState<{ value: string; label: string; description: string }[]>([]);
  const [currentModel, setCurrentModel] = useState('gpt-4o-mini');

  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<GenerateAnalysisFormData>({
    defaultValues: {
      analysisType: 'nutrition',
      llmModel: 'gpt-4o-mini',
    },
  });

  useEffect(() => {
    loadAnalyses();
    loadAvailableModels();
  }, []);

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.getAnalyses();
      setAnalyses(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load analyses');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableModels = async () => {
    try {
      const response = await apiService.getAnalysisModels();
      setAvailableModels(response.models);
      setCurrentModel(response.currentModel);
      setValue('llmModel', response.currentModel);
    } catch (err: any) {
      console.error('Failed to load available models:', err);
      const fallbackModels = [
        { value: 'gpt-4o-mini', label: 'GPT-4o Mini', description: 'Fast & cost-effective (recommended)' },
        { value: 'gpt-4o', label: 'GPT-4o', description: 'More capable, higher cost' },
        { value: 'gpt-4-turbo', label: 'GPT-4 Turbo', description: 'Advanced capabilities' },
        { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo', description: 'Fast & economical' }
      ];
      setAvailableModels(fallbackModels);
      setCurrentModel('gpt-4o-mini');
      setValue('llmModel', 'gpt-4o-mini');
    }
  };

  const generateAnalysis = async (data: GenerateAnalysisFormData) => {
    try {
      setGenerating(true);
      let analysis: Analysis;

      switch (data.analysisType) {
        case 'nutrition':
          analysis = await apiService.analyzeNutrition(7);
          break;
        case 'bloodwork':
          analysis = await apiService.analyzeBloodwork();
          break;
        case 'correlation':
          analysis = await apiService.analyzeCorrelation(30);
          break;
        default:
          throw new Error('Invalid analysis type');
      }

      await loadAnalyses();
      setGenerateDialogOpen(false);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to generate analysis');
    } finally {
      setGenerating(false);
    }
  };

  const deleteAnalysis = async (id: string) => {
    try {
      await apiService.deleteAnalysis(id);
      await loadAnalyses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete analysis');
    }
  };

  const getAnalysisTypeIcon = (type: string) => {
    switch (type) {
      case 'nutrition':
        return <TrendingUpIcon color="primary" />;
      case 'bloodwork':
        return <ScienceIcon color="secondary" />;
      case 'correlation':
        return <AnalyticsIcon color="success" />;
      default:
        return <AnalyticsIcon />;
    }
  };

  const getAnalysisTypeColor = (type: string) => {
    switch (type) {
      case 'nutrition':
        return 'primary';
      case 'bloodwork':
        return 'secondary';
      case 'correlation':
        return 'success';
      default:
        return 'default';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <WarningIcon />;
      case 'medium':
        return <StarIcon />;
      case 'low':
        return <CheckCircleIcon />;
      default:
        return <CheckCircleIcon />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
        AI Analysis
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Generate Analysis Button */}
      <Box sx={{ mb: 3 }}>
        <Button
          variant="contained"
          startIcon={<AnalyticsIcon />}
          onClick={() => setGenerateDialogOpen(true)}
          size="small"
          sx={{ 
            fontSize: { xs: '0.75rem', sm: '0.875rem' },
            px: { xs: 1, sm: 2 }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Generate New Analysis
          </Box>
          <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
            New Analysis
          </Box>
        </Button>
      </Box>

      {/* Analyses List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      ) : analyses.length > 0 ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, sm: 3 } }}>
          {analyses.map((analysis) => (
            <Card key={analysis._id}>
              <CardContent sx={{ p: { xs: 1, sm: 2 } }}>
                <Box 
                  display="flex" 
                  flexDirection={{ xs: 'column', md: 'row' }}
                  justifyContent="space-between" 
                  alignItems={{ xs: 'stretch', md: 'center' }}
                  gap={{ xs: 1, sm: 2 }}
                  mb={{ xs: 1, sm: 2 }}
                >
                  <Box display="flex" alignItems="center" gap={{ xs: 1, sm: 2 }}>
                    {getAnalysisTypeIcon(analysis.type)}
                    <Box>
                      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                        {analysis.type.charAt(0).toUpperCase() + analysis.type.slice(1)} Analysis
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.625rem', sm: '0.75rem' } }}>
                        {new Date(analysis.date).toLocaleDateString()} • 
                        {analysis.insights.length} insights • 
                        {analysis.recommendations.length} recommendations
                        {analysis.llmModel && ` • ${analysis.llmModel}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box 
                    display="flex" 
                    gap={{ xs: 0.5, sm: 1 }}
                    flexDirection={{ xs: 'row', md: 'row' }}
                    justifyContent={{ xs: 'space-between', md: 'flex-end' }}
                    alignItems="center"
                    sx={{ minWidth: { xs: '100%', md: 'auto' } }}
                  >
                    <Chip
                      label={analysis.type}
                      color={getAnalysisTypeColor(analysis.type) as any}
                      size="small"
                      sx={{ 
                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                        height: { xs: '20px', sm: '24px' }
                      }}
                    />
                    <Button
                      size="small"
                      onClick={() => setSelectedAnalysis(analysis)}
                      variant="outlined"
                      sx={{ 
                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                        minWidth: { xs: '40px', sm: '60px' },
                        px: { xs: 0.5, sm: 1 }
                      }}
                    >
                      View
                    </Button>
                    <Button
                      size="small"
                      color="error"
                      onClick={() => deleteAnalysis(analysis._id)}
                      variant="outlined"
                      sx={{ 
                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                        minWidth: { xs: '30px', sm: '60px' },
                        px: { xs: 0.5, sm: 1 }
                      }}
                    >
                      <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
                        Delete
                      </Box>
                      <Box component="span" sx={{ display: { xs: 'inline', sm: 'none' } }}>
                        Del
                      </Box>
                    </Button>
                  </Box>
                </Box>

                {/* Summary */}
                {analysis.summary && (
                  <Box mb={{ xs: 1, sm: 2 }}>
                    <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                      Summary:
                    </Typography>
                    <Typography 
                      variant="body2" 
                      color="text.secondary" 
                      sx={{ 
                        fontStyle: 'italic',
                        fontSize: { xs: '0.625rem', sm: '0.75rem' },
                        lineHeight: 1.4
                      }}
                    >
                      {analysis.summary}
                    </Typography>
                  </Box>
                )}

                {/* Key Insights Preview */}
                <Box mb={{ xs: 1, sm: 2 }}>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Key Insights:
                  </Typography>
                  <List dense sx={{ py: 0 }}>
                    {analysis.insights.map((insight, index) => (
                      <ListItem key={index} sx={{ pl: 0, py: { xs: 0.25, sm: 0.5 } }}>
                        <ListItemIcon sx={{ minWidth: { xs: 24, sm: 32 } }}>
                          <LightbulbIcon color="primary" fontSize="small" />
                        </ListItemIcon>
                        <ListItemText
                          primary={insight}
                          primaryTypographyProps={{ 
                            variant: 'body2',
                            sx: { fontSize: { xs: '0.625rem', sm: '0.75rem' } }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                {/* Top Recommendations Preview */}
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Recommendations:
                  </Typography>
                  <Box display="flex" flexDirection="column" gap={{ xs: 0.5, sm: 1 }}>
                    {analysis.recommendations.map((rec, index) => (
                      <Chip
                        key={index}
                        label={rec}
                        size="small"
                        variant="outlined"
                        icon={getPriorityIcon('medium')}
                        sx={{ 
                          alignSelf: 'flex-start', 
                          maxWidth: '100%',
                          height: { xs: '20px', sm: '24px' },
                          fontSize: { xs: '0.625rem', sm: '0.75rem' },
                          '& .MuiChip-label': {
                            px: { xs: 0.5, sm: 1 }
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Card>
          <CardContent>
            <Box textAlign="center" py={6}>
              <AnalyticsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                No Analyses Yet
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Generate your first AI analysis to get personalized insights about your nutrition and health data
              </Typography>
              <Button
                variant="contained"
                startIcon={<AnalyticsIcon />}
                onClick={() => setGenerateDialogOpen(true)}
              >
                Generate Analysis
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Generate Analysis Dialog */}
      <Dialog open={generateDialogOpen} onClose={() => setGenerateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Generate New Analysis</DialogTitle>
        <form onSubmit={handleSubmit(generateAnalysis)}>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Alert severity="info">
                AI analysis will provide personalized insights based on your data. Make sure you have logged food entries or uploaded health metrics for meaningful results.
              </Alert>

              <Controller
                name="analysisType"
                control={control}
                rules={{ required: 'Analysis type is required' }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Analysis Type</InputLabel>
                    <Select {...field} label="Analysis Type">
                      <MenuItem value="nutrition">Nutrition Analysis</MenuItem>
                      <MenuItem value="bloodwork">Health Metrics Analysis</MenuItem>
                      <MenuItem value="correlation">Nutrition-Health Metrics Correlation</MenuItem>
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="llmModel"
                control={control}
                rules={{ required: 'AI model is required' }}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>AI Model</InputLabel>
                    <Select {...field} label="AI Model">
                      {availableModels.map((model) => (
                        <MenuItem key={model.value} value={model.value}>
                          <Box>
                            <Typography variant="body2" fontWeight="medium">
                              {model.label}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {model.description}
                            </Typography>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGenerateDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={generating}>
              {generating ? <CircularProgress size={24} /> : 'Generate Analysis'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Analysis Details Dialog */}
      <Dialog
        open={!!selectedAnalysis}
        onClose={() => setSelectedAnalysis(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedAnalysis && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" gap={2}>
                {getAnalysisTypeIcon(selectedAnalysis.type)}
                <Box>
                  <Typography variant="h6">
                    {selectedAnalysis.type.charAt(0).toUpperCase() + selectedAnalysis.type.slice(1)} Analysis
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Generated on {new Date(selectedAnalysis.date).toLocaleDateString()}
                    {selectedAnalysis.llmModel && ` using ${selectedAnalysis.llmModel}`}
                  </Typography>
                </Box>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Summary */}
                {selectedAnalysis.summary && (
                  <Box>
                    <Typography variant="h6" gutterBottom>
                      Executive Summary
                    </Typography>
                    <Typography variant="body1" sx={{ fontStyle: 'italic', mb: 2 }}>
                      {selectedAnalysis.summary}
                    </Typography>
                  </Box>
                )}

                {/* Detailed Analysis */}
                {selectedAnalysis.detailedAnalysis && (
                  <>
                    <Box>
                      <Typography variant="h6" gutterBottom>
                        Detailed Analysis
                      </Typography>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-line', lineHeight: 1.6 }}>
                        {selectedAnalysis.detailedAnalysis}
                      </Typography>
                    </Box>
                    <Divider />
                  </>
                )}

                {/* All Insights */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    AI Insights
                  </Typography>
                  <List>
                    {selectedAnalysis.insights.map((insight, index) => (
                      <ListItem key={index} alignItems="flex-start">
                        <ListItemIcon>
                          <LightbulbIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText primary={insight} />
                      </ListItem>
                    ))}
                  </List>
                </Box>

                <Divider />

                {/* All Recommendations */}
                <Box>
                  <Typography variant="h6" gutterBottom>
                    Recommendations
                  </Typography>
                  <List>
                    {selectedAnalysis.recommendations.map((rec, index) => (
                      <ListItem key={index} alignItems="flex-start">
                        <ListItemIcon>
                          {getPriorityIcon('medium')}
                        </ListItemIcon>
                        <ListItemText primary={rec} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedAnalysis(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default AnalysisPage;
