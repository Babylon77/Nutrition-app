import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  Typography,
  Paper,
  CircularProgress,
  Chip,
  Stack,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'app' | 'nutrition' | 'general';
}

interface AIAssistantProps {
  size?: 'small' | 'medium' | 'large';
}

const AIAssistant: React.FC<AIAssistantProps> = ({ size = 'medium' }) => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const avatarSizes = {
    small: { width: 32, height: 32 },
    medium: { width: 40, height: 40 },
    large: { width: 48, height: 48 },
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleOpen = () => {
    setOpen(true);
    // Add welcome message if this is the first time
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        text: "Hi! I'm your Fuel IQ AI assistant. I can help you with:\n\n• Questions about using the app\n• Nutrition and health guidance\n• Interpreting your food logs and analysis\n• Log your meals by telling me what you ate (e.g., \"log 1 apple and a banana for breakfast\")\n• General wellness advice\n\nWhat would you like to know?",
        isUser: false,
        timestamp: new Date(),
        type: 'general',
      };
      setMessages([welcomeMessage]);
    }
  };

  const handleClose = () => {
    setOpen(false);
  };

  const determineQuestionType = (question: string): 'app' | 'nutrition' | 'general' => {
    const appKeywords = ['app', 'fuel iq', 'fueliq', 'how to', 'where is', 'feature', 'button', 'page', 'dashboard', 'food log', 'bloodwork', 'analysis'];
    const nutritionKeywords = ['nutrition', 'calories', 'protein', 'carbs', 'vitamins', 'minerals', 'diet', 'meal', 'food', 'supplement', 'health', 'biomarker'];
    
    const lowerQuestion = question.toLowerCase();
    
    if (appKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'app';
    } else if (nutritionKeywords.some(keyword => lowerQuestion.includes(keyword))) {
      return 'nutrition';
    }
    return 'general';
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const questionType = determineQuestionType(userMessage.text);
      
      const response = await fetch('/api/ai-assistant/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          message: userMessage.text,
          type: questionType,
          conversationHistory: messages.slice(-5), // Last 5 messages for context
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const data = await response.json();
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: data.response,
        isUser: false,
        timestamp: new Date(),
        type: questionType,
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm sorry, I'm having trouble connecting right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
        type: 'general',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputFocus = () => {
    if (isMobile) {
      setTimeout(() => {
        inputContainerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  };

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'app': return 'var(--color-primary-blue)';
      case 'nutrition': return 'var(--color-primary-green)';
      default: return 'var(--color-text-secondary)';
    }
  };

  const getTypeLabel = (type?: string) => {
    switch (type) {
      case 'app': return 'App Help';
      case 'nutrition': return 'Nutrition';
      default: return 'General';
    }
  };

  return (
    <>
      {/* Avatar Button */}
      <IconButton
        onClick={handleOpen}
        sx={{
          ...avatarSizes[size],
          padding: 0,
          backgroundColor: 'var(--color-bg-card)',
          boxShadow: 'var(--shadow-md)',
          border: '2px solid var(--color-primary-blue)',
          '&:hover': {
            boxShadow: 'var(--shadow-lg)',
            transform: 'scale(1.05)',
          },
          transition: 'all var(--transition-fast)',
        }}
        title="Ask AI Assistant"
      >
        <img
          src="/Avatar1.png"
          alt="AI Assistant"
          style={{
            width: '100%',
            height: '100%',
            borderRadius: '50%',
            objectFit: 'cover',
          }}
        />
      </IconButton>

      {/* Chat Dialog */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            height: isMobile ? '100vh' : '600px',
            backgroundColor: '#f8f9fa',
            boxShadow: 'var(--shadow-xl)',
          },
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            p: 2,
            backgroundColor: 'var(--color-primary-blue)',
            color: '#ffffff', // White text on blue background
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid var(--color-border-light)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img
              src="/Avatar1.png"
              alt="AI Assistant"
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #ffffff', // White border on blue background
              }}
            />
            <Box>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 600,
                  fontSize: '1.1rem',
                  color: '#ffffff', // White text
                }}
              >
                AI Assistant
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
                  fontSize: '0.75rem',
                }}
              >
                Ask about nutrition, health, or app features
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={handleClose}
            sx={{
              color: '#ffffff', // White close button
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)', // Light overlay on hover
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column' }}>
          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflowY: 'auto',
              minHeight: 0,
              p: 2,
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            {messages.map((message) => (
              <Box
                key={message.id}
                sx={{
                  display: 'flex',
                  justifyContent: message.isUser ? 'flex-end' : 'flex-start',
                  mb: 1,
                  overflow: 'visible',
                }}
              >
                <Paper
                  sx={{
                    p: 2,
                    maxWidth: '85%',
                    minWidth: 0,
                    height: 'auto',
                    backgroundColor: message.isUser
                      ? 'var(--color-primary-blue)'
                      : '#ffffff',
                    color: message.isUser
                      ? '#ffffff'
                      : '#1a1a1a',
                    borderRadius: message.isUser
                      ? '20px 20px 4px 20px'
                      : '20px 20px 20px 4px',
                    border: message.isUser
                      ? 'none'
                      : '1px solid var(--color-border-light)',
                    boxShadow: message.isUser
                      ? 'var(--shadow-sm)'
                      : 'var(--shadow-md)',
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    hyphens: 'auto',
                  }}
                >
                  {!message.isUser && message.type && (
                    <Chip
                      label={getTypeLabel(message.type)}
                      size="small"
                      sx={{
                        mb: 1,
                        backgroundColor: getTypeColor(message.type),
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 500,
                      }}
                    />
                  )}
                  <Typography
                    variant="body2"
                    sx={{
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word',
                      lineHeight: 1.5,
                      fontSize: '0.875rem',
                      color: 'inherit',
                    }}
                  >
                    {message.text}
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'block',
                      mt: 1,
                      opacity: 0.7,
                      fontSize: '0.7rem',
                      color: 'inherit',
                    }}
                  >
                    {message.timestamp.toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Paper>
              </Box>
            ))}
            
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'flex-start' }}>
                <Paper
                  sx={{
                    p: 2,
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    borderRadius: '20px 20px 20px 4px',
                    border: '1px solid var(--color-border-light)',
                    boxShadow: 'var(--shadow-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                  }}
                >
                  <CircularProgress size={20} sx={{ color: 'var(--color-primary-blue)' }} />
                  <Typography variant="body2" sx={{ color: '#1a1a1a' }}>
                    Thinking...
                  </Typography>
                </Paper>
              </Box>
            )}
            
            <div ref={messagesEndRef} />
          </Box>

          {/* Input Area */}
          <Box
            ref={inputContainerRef}
            sx={{
              p: 2,
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--color-border-light)',
              boxShadow: '0 -2px 8px rgba(0, 0, 0, 0.1)',
            }}
          >
            <Stack direction="row" spacing={1} alignItems="flex-end">
              <TextField
                fullWidth
                multiline
                maxRows={3}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                onFocus={handleInputFocus}
                placeholder="Ask a question or log food (e.g., 'log an apple')..."
                variant="outlined"
                size="small"
                disabled={isLoading}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: '#ffffff',
                    color: '#1a1a1a',
                    '& fieldset': {
                      borderColor: 'var(--color-border-medium)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'var(--color-primary-blue)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: 'var(--color-primary-blue)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: '#6b7280',
                    opacity: 1,
                  },
                }}
              />
              <IconButton
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading}
                sx={{
                  backgroundColor: 'var(--color-primary-blue)',
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'var(--color-primary-blue-dark)',
                  },
                  '&:disabled': {
                    backgroundColor: '#d1d5db',
                    color: '#9ca3af',
                  },
                }}
              >
                <SendIcon />
              </IconButton>
            </Stack>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AIAssistant; 