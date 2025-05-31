import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FoodLog } from './pages/FoodLog';
import PersonalFoods from './pages/PersonalFoods';
import { SupplementsNew } from './pages/SupplementsNew';
import { Bloodwork } from './pages/Bloodwork';
import AnalysisPage from './pages/Analysis';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TutorialProvider, TutorialHelpButton } from './components/TutorialSystem';
import { Box, Typography, AppBar, Button } from '@mui/material';
import LandingPage from './pages/LandingPage';

// Import new design system
import './styles/design-system.css';

// Updated theme to match Fuel IQ design system
const theme = createTheme({
  typography: {
    fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    h4: {
      fontWeight: 600,
      color: '#1a1a1a',
    },
    h5: {
      fontWeight: 500,
      color: '#1a1a1a',
    },
    h6: {
      fontWeight: 500,
      color: '#1a1a1a',
    },
    body1: {
      color: '#1a1a1a',
    },
    body2: {
      color: '#4a5568',
    },
  },
  palette: {
    primary: {
      main: '#003d82', // Deep navy blue - darker, more sophisticated
      light: '#1a5fa0',
      dark: '#002a5c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#00c853', // Vibrant green - darker and more vibrant
      light: '#5dfc82',
      dark: '#009624',
      contrastText: '#1a1a1a', // Darker text for better contrast
    },
    info: {
      main: '#6b7280', // Neutral medium gray
      light: '#9ca3af',
      dark: '#4b5563',
    },
    background: {
      default: '#f8f9fa', // Off-white background
      paper: '#ffffff',
    },
    text: {
      primary: '#1a1a1a', // Darker text for better readability
      secondary: '#4a5568',
    },
  },
  shape: {
    borderRadius: 12, // Increased border radius for modern look
  },
  components: {
    // Override Material-UI components to match Fuel IQ design system
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
          '&:hover': {
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', // Remove uppercase
          fontWeight: 500,
          borderRadius: '8px',
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#1a1a1a',
          boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        },
      },
    },
  },
});

function AppContent() {
  const { user } = useAuth();
  
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={!user ? <LandingPage /> : <Navigate to="/dashboard" replace />} />
        <Route path="/landing" element={<LandingPage />} />
        <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" replace />} />
        <Route path="/signup" element={!user ? <Register /> : <Navigate to="/dashboard" replace />} />
        
        {/* Protected routes */}
        <Route path="/*" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="dashboard" element={
            <>
              <Dashboard />
              <TutorialHelpButton tutorialType="firstTime" />
            </>
          } />
          <Route path="food-log" element={
            <>
              <FoodLog />
              <TutorialHelpButton tutorialType="smartEntry" />
            </>
          } />
          <Route path="personal-foods" element={<PersonalFoods />} />
          <Route path="supplements" element={<SupplementsNew />} />
          <Route path="bloodwork" element={
            <>
              <Bloodwork />
              <TutorialHelpButton tutorialType="bloodwork" />
            </>
          } />
          <Route path="analysis" element={
            <>
              <AnalysisPage />
              <TutorialHelpButton tutorialType="analytics" />
            </>
          } />
          <Route path="profile" element={<Profile />} />
          <Route path="demo" element={
            <Box sx={{ p: 3 }}>
              <Typography variant="h4" sx={{ mb: 3 }}>
                Sprint 2.5: Modern UI Components Demo
              </Typography>
              <Typography variant="body1" sx={{ mb: 2 }}>
                The modern design system components (CalorieGauge, MacroProgressBar, BottomNavigation) 
                have been implemented and are being used throughout the app.
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visit /dashboard to see the new design system in action with the bottom navigation on mobile.
              </Typography>
            </Box>
          } />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <TutorialProvider>
          <AppContent />
        </TutorialProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
