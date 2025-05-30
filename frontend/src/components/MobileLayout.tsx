import React from 'react';
import { Container, Box } from '@mui/material';

interface MobileLayoutProps {
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  children, 
  maxWidth = 'lg' 
}) => {
  return (
    <Container 
      maxWidth={maxWidth}
      sx={{
        px: { xs: 1, sm: 2, md: 3 },
        py: { xs: 1, sm: 2 },
        width: '100%',
        maxWidth: '100% !important',
        overflow: 'hidden',
        '& *': {
          boxSizing: 'border-box'
        }
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: '100%',
          overflow: 'hidden',
          wordWrap: 'break-word',
          '& .MuiCard-root': {
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden'
          },
          '& .MuiCardContent-root': {
            padding: { xs: 1, sm: 2 },
            '&:last-child': {
              paddingBottom: { xs: 1, sm: 2 }
            }
          },
          '& .MuiTypography-root': {
            wordWrap: 'break-word',
            overflowWrap: 'break-word'
          },
          '& .MuiChip-root': {
            maxWidth: '100%',
            wordBreak: 'break-word',
            '& .MuiChip-label': {
              whiteSpace: 'normal'
            }
          }
        }}
      >
        {children}
      </Box>
    </Container>
  );
}; 