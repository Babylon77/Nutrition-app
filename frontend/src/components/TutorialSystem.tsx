import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import {
  Box,
  Typography,
  Button,
  Paper,
  IconButton,
  Fab,
  Tooltip,
  Backdrop,
  useTheme,
  useMediaQuery,
  Fade,
  LinearProgress,
} from '@mui/material';
import {
  Close as CloseIcon,
  NavigateNext as NextIcon,
  NavigateBefore as BackIcon,
  HelpOutline as HelpOutlineIcon,
} from '@mui/icons-material';

interface TutorialStep {
  target: string;
  content: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  title?: string;
}

interface TutorialContextType {
  activeTutorial: string | null;
  startTutorial: (type: string) => void;
  completeTutorial: () => void;
  isFirstTimeUser: () => boolean;
}

const TutorialContext = createContext<TutorialContextType | null>(null);

export const useTutorial = () => {
  const context = useContext(TutorialContext);
  if (!context) {
    throw new Error('useTutorial must be used within a TutorialProvider');
  }
  return context;
};

// Tutorial steps definition
const tutorialSteps: Record<string, TutorialStep[]> = {
  firstTime: [
    {
      target: 'body',
      placement: 'center',
      title: 'Welcome to your nutrition journey! 🎉',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            Let's take 60 seconds to show you how to get the most from this app.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Tip:</strong> You can replay this tutorial anytime by clicking the help icon.
          </Typography>
        </Box>
      ),
    },
    {
      target: '[data-tour="smart-food-entry"]',
      placement: 'bottom',
      title: 'Smart Food Entry',
      content: (
        <Box>
          <Typography variant="body1" paragraph>
            This is your main tool for logging meals. It searches your personal foods first, then uses AI for new items.
          </Typography>
          <Typography variant="body2" color="primary">
            <strong>Pro tip:</strong> Add multiple foods before analyzing to save costs!
          </Typography>
        </Box>
      ),
    },
    {
      target: '[data-tour="analytics-tab"]',
      placement: 'bottom',
      title: 'Nutrition Analytics',
      content: (
        <Typography variant="body1">
          See detailed breakdowns of 30+ nutrients, AI-powered health insights, and track your progress over time.
        </Typography>
      ),
    },
    {
      target: '[data-tour="bloodwork-tab"]',
      placement: 'bottom',
      title: 'Bloodwork Integration',
      content: (
        <Typography variant="body1">
          Upload lab results to see how your diet affects your health markers. The AI will provide personalized recommendations.
        </Typography>
      ),
    },
  ],
  smartEntry: [
    {
      target: '[data-tour="search-input"]',
      placement: 'bottom',
      title: 'Start typing any food',
      content: (
        <Typography variant="body1">
          The app searches your personal foods first (instant), then suggests new foods that need AI analysis.
        </Typography>
      ),
    },
    {
      target: '[data-tour="personal-foods"]',
      placement: 'right',
      title: 'Personal Foods (Green)',
      content: (
        <Typography variant="body1">
          These are foods you've logged before. They're instant and free - no AI needed!
        </Typography>
      ),
    },
    {
      target: '[data-tour="food-queue"]',
      placement: 'top',
      title: 'Queue System',
      content: (
        <Typography variant="body1">
          Add multiple foods before processing. This saves money by batching AI requests.
        </Typography>
      ),
    },
  ],
  analytics: [
    {
      target: '[data-tour="daily-summary"]',
      placement: 'bottom',
      title: 'Daily Nutrition Summary',
      content: (
        <Typography variant="body1">
          Track 30+ nutrients including vitamins, minerals, and macros. Red indicates deficiencies, green shows you're on track.
        </Typography>
      ),
    },
    {
      target: '[data-tour="ai-analysis"]',
      placement: 'top',
      title: 'AI Health Analysis',
      content: (
        <Typography variant="body1">
          Get personalized recommendations based on your nutrition data, health goals, and bloodwork (if uploaded).
        </Typography>
      ),
    },
  ],
  bloodwork: [
    {
      target: '[data-tour="upload-bloodwork"]',
      placement: 'bottom',
      title: 'Upload Lab Results',
      content: (
        <Typography variant="body1">
          Upload PDFs or manually enter biomarkers. The AI will correlate with your nutrition data for personalized insights.
        </Typography>
      ),
    },
  ],
};

interface TutorialOverlayProps {
  step: TutorialStep;
  currentStepIndex: number;
  totalSteps: number;
  onNext: () => void;
  onPrev: () => void;
  onSkip: () => void;
  onClose: () => void;
}

const TutorialOverlay: React.FC<TutorialOverlayProps> = ({
  step,
  currentStepIndex,
  totalSteps,
  onNext,
  onPrev,
  onSkip,
  onClose,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [overlayPosition, setOverlayPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const updatePosition = () => {
      if (step.target === 'body' || step.placement === 'center') {
        setTargetRect(null);
        return;
      }

      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setTargetRect(rect);

        // Calculate overlay position based on placement
        const overlayWidth = isMobile ? 280 : 400;
        const overlayHeight = 200; // Approximate height
        let top = 0;
        let left = 0;

        switch (step.placement) {
          case 'bottom':
            top = rect.bottom + 16;
            left = rect.left + rect.width / 2 - overlayWidth / 2;
            break;
          case 'top':
            top = rect.top - overlayHeight - 16;
            left = rect.left + rect.width / 2 - overlayWidth / 2;
            break;
          case 'right':
            top = rect.top + rect.height / 2 - overlayHeight / 2;
            left = rect.right + 16;
            break;
          case 'left':
            top = rect.top + rect.height / 2 - overlayHeight / 2;
            left = rect.left - overlayWidth - 16;
            break;
          default:
            top = rect.bottom + 16;
            left = rect.left + rect.width / 2 - overlayWidth / 2;
        }

        // Keep overlay within viewport
        top = Math.max(16, Math.min(top, window.innerHeight - overlayHeight - 16));
        left = Math.max(16, Math.min(left, window.innerWidth - overlayWidth - 16));

        setOverlayPosition({ top, left });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [step, isMobile]);

  const isCenter = step.target === 'body' || step.placement === 'center';

  return createPortal(
    <Box>
      {/* Backdrop */}
      <Backdrop
        open={true}
        sx={{
          zIndex: 9998,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
        onClick={onSkip}
      />

      {/* Spotlight effect */}
      {targetRect && !isCenter && (
        <Box
          sx={{
            position: 'fixed',
            top: targetRect.top - 4,
            left: targetRect.left - 4,
            width: targetRect.width + 8,
            height: targetRect.height + 8,
            borderRadius: 1,
            border: `3px solid ${theme.palette.primary.main}`,
            backgroundColor: 'transparent',
            zIndex: 9999,
            pointerEvents: 'none',
            boxShadow: `0 0 0 4000px rgba(0, 0, 0, 0.4)`,
          }}
        />
      )}

      {/* Tutorial content */}
      <Fade in={true}>
        <Paper
          elevation={8}
          sx={{
            position: 'fixed',
            top: isCenter ? '50%' : overlayPosition.top,
            left: isCenter ? '50%' : overlayPosition.left,
            transform: isCenter ? 'translate(-50%, -50%)' : 'none',
            width: isMobile ? 280 : 400,
            maxWidth: '90vw',
            zIndex: 10000,
            borderRadius: 2,
            overflow: 'hidden',
          }}
        >
          {/* Progress bar */}
          <LinearProgress
            variant="determinate"
            value={(currentStepIndex / (totalSteps - 1)) * 100}
            sx={{ height: 4 }}
          />

          <Box p={3}>
            {/* Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
              <Typography variant="h6" component="h3" fontWeight="bold">
                {step.title}
              </Typography>
              <IconButton size="small" onClick={onClose}>
                <CloseIcon />
              </IconButton>
            </Box>

            {/* Content */}
            <Box mb={3}>
              {step.content}
            </Box>

            {/* Footer */}
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="caption" color="text.secondary">
                {currentStepIndex + 1} of {totalSteps}
              </Typography>

              <Box display="flex" gap={1}>
                <Button size="small" onClick={onSkip}>
                  Skip
                </Button>
                {currentStepIndex > 0 && (
                  <Button
                    size="small"
                    startIcon={<BackIcon />}
                    onClick={onPrev}
                  >
                    Back
                  </Button>
                )}
                <Button
                  variant="contained"
                  size="small"
                  endIcon={currentStepIndex < totalSteps - 1 ? <NextIcon /> : undefined}
                  onClick={onNext}
                >
                  {currentStepIndex < totalSteps - 1 ? 'Next' : 'Finish'}
                </Button>
              </Box>
            </Box>
          </Box>
        </Paper>
      </Fade>
    </Box>,
    document.body
  );
};

interface TutorialSystemProps {
  children: React.ReactNode;
}

export const TutorialProvider: React.FC<TutorialSystemProps> = ({ children }) => {
  const [activeTutorial, setActiveTutorial] = useState<string | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  const startTutorial = (type: string) => {
    setActiveTutorial(type);
    setCurrentStepIndex(0);
  };

  const completeTutorial = () => {
    if (activeTutorial) {
      localStorage.setItem(`tutorial-${activeTutorial}-completed`, 'true');
    }
    setActiveTutorial(null);
    setCurrentStepIndex(0);
  };

  const isFirstTimeUser = () => {
    return !localStorage.getItem('tutorial-firstTime-completed');
  };

  const handleNext = () => {
    if (!activeTutorial) return;

    const steps = tutorialSteps[activeTutorial];
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
    } else {
      completeTutorial();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  const handleSkip = () => {
    completeTutorial();
  };

  // Auto-start first-time tutorial
  useEffect(() => {
    const timer = setTimeout(() => {
      if (isFirstTimeUser()) {
        startTutorial('firstTime');
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const contextValue: TutorialContextType = {
    activeTutorial,
    startTutorial,
    completeTutorial,
    isFirstTimeUser,
  };

  const currentSteps = activeTutorial ? tutorialSteps[activeTutorial] : [];
  const currentStep = currentSteps[currentStepIndex];

  return (
    <TutorialContext.Provider value={contextValue}>
      {children}
      {activeTutorial && currentStep && (
        <TutorialOverlay
          step={currentStep}
          currentStepIndex={currentStepIndex}
          totalSteps={currentSteps.length}
          onNext={handleNext}
          onPrev={handlePrev}
          onSkip={handleSkip}
          onClose={completeTutorial}
        />
      )}
    </TutorialContext.Provider>
  );
};

// Help Button Component
export const TutorialHelpButton: React.FC<{
  tutorialType: string;
  position?: { bottom?: number; right?: number };
}> = ({ tutorialType, position = { bottom: 80, right: 24 } }) => {
  // const { startTutorial } = useTutorial();
  // const isCompleted = localStorage.getItem(`tutorial-${tutorialType}-completed`);

  // return (
  //   <Tooltip title={`${isCompleted ? 'Replay' : 'Start'} tutorial`}>
  //     <Fab
  //       size="small"
  //       color="primary"
  //       onClick={() => startTutorial(tutorialType)}
  //       sx={{
  //         position: 'fixed',
  //         bottom: position.bottom,
  //         right: position.right,
  //         zIndex: 1000,
  //         opacity: 0.8,
  //         '&:hover': {
  //           opacity: 1,
  //         },
  //       }}
  //     >
  //       <HelpOutlineIcon />
  //     </Fab>
  //   </Tooltip>
  // );
  return null; // Effectively hides the button
}; 