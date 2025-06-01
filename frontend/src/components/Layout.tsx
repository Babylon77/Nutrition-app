import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  MenuBook as MenuBookIcon,
  LocalPharmacy as SupplementIcon,
  Biotech as BiotechIcon,
  Analytics as AnalyticsIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  Home as HomeIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import BottomNavigation from './BottomNavigation';
import AIAssistant from './AIAssistant';

const drawerWidth = 240;

interface NavigationItem {
  text: string;
  icon: React.ReactElement;
  path: string;
}

const navigationItems: NavigationItem[] = [
  { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
  { text: 'Food Log', icon: <RestaurantIcon />, path: '/food-log' },
  { text: 'Personal Foods', icon: <MenuBookIcon />, path: '/personal-foods' },
  { text: 'Supplements', icon: <SupplementIcon />, path: '/supplements' },
  { text: 'Health Metrics', icon: <BiotechIcon />, path: '/bloodwork' },
  { text: 'Analysis', icon: <AnalyticsIcon />, path: '/analysis' },
  { text: 'Profile', icon: <PersonIcon />, path: '/profile' },
];

export const Layout: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setMobileOpen(false);
  };

  const handleQuickAdd = () => {
    navigate('/food-log');
  };

  const handleGoHome = () => {
    navigate('/landing');
    handleProfileMenuClose();
  };

  const drawer = (
    <div>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" 
          sx={{ 
            color: 'var(--color-primary-blue)',
            fontWeight: 'var(--font-weight-bold)',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          Fuel IQ
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={location.pathname === item.path}
              onClick={() => handleNavigate(item.path)}
              data-tour={item.path === '/analysis' ? 'analytics-tab' : 
                        item.path === '/bloodwork' ? 'bloodwork-tab' : 
                        undefined}
              sx={{
                '&.Mui-selected': {
                  backgroundColor: 'var(--color-bg-accent-subtle)',
                  color: 'var(--color-primary-blue)',
                  '&:hover': {
                    backgroundColor: 'var(--color-bg-accent-subtle)',
                  },
                },
                '&:hover': {
                  backgroundColor: 'var(--color-bg-hover)',
                },
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: location.pathname === item.path ? 'var(--color-primary-blue)' : 'inherit' 
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top App Bar - Hidden on mobile, visible on desktop */}
      {!isMobile && (
        <AppBar
          position="fixed"
          sx={{
            width: `calc(100% - ${drawerWidth}px)`,
            ml: `${drawerWidth}px`,
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            boxShadow: 'var(--shadow-sm)',
            borderBottom: '1px solid var(--color-border-light)',
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
              Fuel IQ
            </Typography>
            <IconButton
              onClick={handleGoHome}
              sx={{ 
                color: 'var(--color-text-primary)',
                mr: 1
              }}
              title="Back to Home"
            >
              <HomeIcon />
            </IconButton>
            <AIAssistant size="medium" />
            <Box sx={{ ml: 1 }}>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                sx={{ color: 'var(--color-text-primary)' }}
              >
                <Avatar sx={{ 
                  width: 32, 
                  height: 32,
                  backgroundColor: 'var(--color-primary-blue)',
                  color: 'var(--color-text-white)'
                }}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Mobile Top Bar - Only visible on mobile */}
      {isMobile && (
        <AppBar
          position="fixed"
          sx={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            boxShadow: 'var(--shadow-sm)',
            borderBottom: '1px solid var(--color-border-light)',
          }}
        >
          <Toolbar>
            <Typography variant="h6" noWrap component="div" 
              sx={{ 
                flexGrow: 1,
                color: 'var(--color-primary-blue)',
                fontWeight: 'var(--font-weight-bold)',
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Fuel IQ
            </Typography>
            <IconButton
              onClick={handleGoHome}
              sx={{ 
                color: 'var(--color-text-primary)',
                mr: 1
              }}
              title="Back to Home"
            >
              <HomeIcon />
            </IconButton>
            <AIAssistant size="medium" />
            <Box sx={{ ml: 1 }}>
              <IconButton
                size="large"
                edge="end"
                aria-label="account of current user"
                aria-controls="profile-menu"
                aria-haspopup="true"
                onClick={handleProfileMenuOpen}
                sx={{ color: 'var(--color-text-primary)' }}
              >
                <Avatar sx={{ 
                  width: 32, 
                  height: 32,
                  backgroundColor: 'var(--color-primary-blue)',
                  color: 'var(--color-text-white)'
                }}>
                  {user?.firstName?.charAt(0) || 'U'}
                </Avatar>
              </IconButton>
            </Box>
          </Toolbar>
        </AppBar>
      )}

      {/* Profile Menu */}
      <Menu
        id="profile-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          '& .MuiPaper-root': {
            borderRadius: 'var(--border-radius-lg)',
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      >
        <MenuItem onClick={() => { handleNavigate('/profile'); handleProfileMenuClose(); }}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleGoHome}>
          <ListItemIcon>
            <HomeIcon fontSize="small" />
          </ListItemIcon>
          Back to Home
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && (
        <Box
          component="nav"
          sx={{ width: drawerWidth, flexShrink: 0 }}
          aria-label="navigation"
        >
          <Drawer
            variant="permanent"
            sx={{
              '& .MuiDrawer-paper': { 
                boxSizing: 'border-box', 
                width: drawerWidth,
                backgroundColor: 'var(--color-bg-card)',
                borderRight: '1px solid var(--color-border-light)',
              },
            }}
            open
          >
            {drawer}
          </Drawer>
        </Box>
      )}

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          marginTop: isMobile ? '56px' : '64px',
          backgroundColor: 'var(--color-bg-main)',
          minHeight: 'calc(100vh - (isMobile ? 56px : 64px))',
          pb: isMobile ? '80px' : 3,
        }}
      >
        <Outlet />
      </Box>

      {/* Bottom Navigation - Only visible on mobile */}
      {isMobile && (
        <BottomNavigation onQuickAdd={handleQuickAdd} />
      )}
    </Box>
  );
}; 