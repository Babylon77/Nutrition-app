import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { FoodLog } from './pages/FoodLog';
import PersonalFoods from './pages/PersonalFoods';
import { Bloodwork } from './pages/Bloodwork';
import AnalysisPage from './pages/Analysis';
import { Profile } from './pages/Profile';
import { ProtectedRoute } from './components/ProtectedRoute';
import { TutorialProvider, TutorialHelpButton } from './components/TutorialSystem';

const theme = createTheme({
  palette: {
    primary: {
      main: '#2e7d32',
      light: '#60ad5e',
      dark: '#005005',
    },
    secondary: {
      main: '#ff6f00',
      light: '#ff9f40',
      dark: '#c43e00',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 500,
    },
  },
  shape: {
    borderRadius: 8,
  },
});

function AppContent() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
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
