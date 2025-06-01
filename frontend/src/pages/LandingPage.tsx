import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Container, Card, CardContent } from '@mui/material';
import { 
  Restaurant as FoodIcon,
  Analytics as AnalyticsIcon,
  Biotech as BloodworkIcon,
  LocalPharmacy as SupplementsIcon
} from '@mui/icons-material';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <FoodIcon sx={{ fontSize: 48, color: '#003d82' }} />,
      title: 'Smart Food Tracking',
      description: 'AI-powered nutrition analysis that understands your meals and tracks 30+ nutrients automatically.',
      color: '#003d82'
    },
    {
      icon: <SupplementsIcon sx={{ fontSize: 48, color: '#00c853' }} />,
      title: 'Supplement Management',
      description: 'Track your daily vitamins, supplements, and medications with intelligent dosage monitoring.',
      color: '#00c853'
    },
    {
      icon: <BloodworkIcon sx={{ fontSize: 48, color: '#6b7280' }} />,
      title: 'Bloodwork Analysis',
      description: 'Upload lab results and get AI-powered insights connecting your nutrition to your biomarkers.',
      color: '#6b7280'
    },
    {
      icon: <AnalyticsIcon sx={{ fontSize: 48, color: '#1a1a1a' }} />,
      title: 'Health Analytics',
      description: 'Comprehensive analysis correlating your diet, supplements, and health metrics for personalized recommendations.',
      color: '#1a1a1a'
    }
  ];

  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #003d82 0%, #00c853 100%)'
    }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          minHeight: '100vh',
          textAlign: 'center',
          py: 4
        }}>
          {/* Header */}
          <Box sx={{ mb: 6 }}>
            <Typography 
              variant="h2" 
              component="h1" 
              gutterBottom 
              align="center"
              sx={{ 
                fontWeight: 700,
                color: '#ffffff',
                mb: 2,
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Fuel IQ
            </Typography>
            
            <Typography 
              variant="h5" 
              align="center" 
              color="#f8f9fa"
              sx={{ 
                mb: 4,
                fontWeight: 500,
                fontFamily: 'Inter, sans-serif'
              }}
            >
              Eat Smarter. Live Sharper.
            </Typography>

            {/* Featured Avatar Landing Image */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'center', 
              mb: 4 
            }}>
              <Box
                component="img"
                src="/AvatarLanding.png"
                alt="Fuel IQ AI Assistant"
                sx={{
                  width: { xs: 200, sm: 250, md: 300 },
                  height: { xs: 200, sm: 250, md: 300 },
                  borderRadius: '50%',
                  border: '4px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  transition: 'all 300ms ease-in-out',
                  objectFit: 'cover',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 25px 80px rgba(0, 0, 0, 0.4)',
                    border: '4px solid rgba(255, 255, 255, 0.5)',
                  }
                }}
              />
            </Box>
            
            <Typography 
              variant="h6" 
              align="center" 
              color="#f8f9fa"
              sx={{ 
                mb: 4,
                maxWidth: '600px',
                mx: 'auto',
                lineHeight: 1.6
              }}
            >
              Fuel IQ is an AI-powered nutrition and biomarker tracking app that helps users understand how food and lab results impact energy, metabolism, and health. It uses LLMs to analyze bloodwork PDFs, track daily intake, and provide smart, personalized insights.
            </Typography>
            
            {/* CTA Buttons */}
            <Box sx={{ 
              display: 'flex', 
              gap: 3, 
              justifyContent: 'center',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: 'center'
            }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/signup')}
                sx={{
                  backgroundColor: '#00ff6b',
                  color: '#1a1a1a',
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  boxShadow: '0 12px 20px -5px rgba(0, 255, 107, 0.4)',
                  '&:hover': {
                    backgroundColor: '#00e85f',
                    transform: 'translateY(-2px)',
                    boxShadow: '0 20px 35px -5px rgba(0, 255, 107, 0.5)'
                  }
                }}
              >
                Get Started Free
              </Button>
              <Button
                variant="outlined"
                size="large"
                onClick={() => navigate('/login')}
                sx={{
                  borderColor: '#ffffff',
                  color: '#ffffff',
                  fontWeight: 500,
                  fontSize: '1.1rem',
                  px: 4,
                  py: 1.5,
                  borderRadius: '12px',
                  textTransform: 'none',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    borderColor: '#ffffff'
                  }
                }}
              >
                Sign In
              </Button>
            </Box>
          </Box>

          {/* Features Grid */}
          <Box sx={{ width: '100%', mt: 8 }}>
            <Typography 
              variant="h4" 
              sx={{ 
                color: '#ffffff',
                mb: 4,
                fontWeight: 600,
                textAlign: 'center'
              }}
            >
              Everything You Need for Complete Health Tracking
            </Typography>
            
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: { 
                xs: '1fr', 
                sm: 'repeat(2, 1fr)', 
                md: 'repeat(4, 1fr)' 
              },
              gap: 4,
              width: '100%'
            }}>
              {features.map((feature, index) => (
                <Card key={index} sx={{
                  height: '100%',
                  background: 'rgba(255, 255, 255, 0.98)',
                  backdropFilter: 'blur(15px)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  transition: 'all 250ms ease-in-out',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                  '&:hover': {
                    transform: 'translateY(-8px)',
                    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
                    background: 'rgba(255, 255, 255, 1)'
                  }
                }}>
                  <CardContent sx={{ 
                    textAlign: 'center',
                    p: 3,
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column'
                  }}>
                    <Box sx={{ mb: 2 }}>
                      {feature.icon}
                    </Box>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 600,
                        color: '#1a1a1a',
                        mb: 2
                      }}
                    >
                      {feature.title}
                    </Typography>
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#6b7280',
                        flexGrow: 1,
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Box>
          </Box>

          {/* Footer CTA */}
          <Box sx={{ mt: 8, textAlign: 'center' }}>
            <Typography 
              variant="body1" 
              sx={{ 
                color: '#ffffff',
                mb: 3,
                opacity: 0.9
              }}
            >
              Join the future of intelligent nutrition tracking
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={() => navigate('/signup')}
              sx={{
                backgroundColor: '#ffffff',
                color: '#003d82',
                fontWeight: 600,
                fontSize: '1rem',
                px: 3,
                py: 1,
                borderRadius: '8px',
                textTransform: 'none',
                '&:hover': {
                  backgroundColor: '#f8f9fa'
                }
              }}
            >
              Start Your Health Journey
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage; 