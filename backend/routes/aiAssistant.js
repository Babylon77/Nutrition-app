const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const auth = require('../middleware/auth');

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Read app documentation for context
const getAppContext = () => {
  try {
    const readmePath = path.join(__dirname, '../../README.md');
    const addPath = path.join(__dirname, '../../ALGORITHM_DESCRIPTION.md');
    
    let context = '';
    
    if (fs.existsSync(readmePath)) {
      context += fs.readFileSync(readmePath, 'utf8');
    }
    
    if (fs.existsSync(addPath)) {
      context += '\n\n' + fs.readFileSync(addPath, 'utf8');
    }
    
    return context;
  } catch (error) {
    console.error('Error reading app documentation:', error);
    return '';
  }
};

// Create system prompts based on question type
const createSystemPrompt = (type, appContext) => {
  const basePrompt = `You are a helpful AI assistant for Fuel IQ, an intelligent nutrition tracking app. You are knowledgeable about nutrition, health, and the app's features.

Always be friendly, helpful, and provide accurate information. If you're unsure about something, say so rather than guessing.`;

  switch (type) {
    case 'app':
      return `${basePrompt}

You are specifically helping users understand how to use the Fuel IQ app. Use the following app documentation to answer questions accurately:

${appContext}

Focus on:
- How to use specific features
- Where to find things in the app
- Understanding the app's AI-powered nutrition analysis
- Interpreting food logs and nutrition data
- Using the bloodwork analysis features
- Understanding the personal food database

Be specific about button locations, page names, and step-by-step instructions when helpful.`;

    case 'nutrition':
      return `${basePrompt}

You are providing nutrition and health guidance. Focus on:
- Nutrition science and macronutrients
- Vitamin and mineral functions
- General dietary advice
- Interpreting nutrition data
- Health biomarkers and lab results
- Supplement guidance
- General wellness advice

Always recommend consulting healthcare professionals for personalized medical advice.`;

    default:
      return `${basePrompt}

You can help with both app-related questions and general nutrition/health guidance. Determine from the user's question whether they need app help or nutrition advice and respond accordingly.`;
  }
};

// Main chat endpoint
router.post('/chat', auth, async (req, res) => {
  try {
    const { message, type = 'general', conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Get app context for app-specific questions
    const appContext = type === 'app' ? getAppContext() : '';
    
    // Create system prompt based on question type
    const systemPrompt = createSystemPrompt(type, appContext);

    // Build conversation history for context
    const messages = [
      { role: 'system', content: systemPrompt }
    ];

    // Add recent conversation history (last 5 messages)
    conversationHistory.slice(-5).forEach(msg => {
      messages.push({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      });
    });

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenAI API
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: messages,
      max_tokens: 500,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;

    if (!response) {
      throw new Error('No response from AI');
    }

    res.json({
      success: true,
      response: response.trim(),
      type,
      tokens_used: completion.usage?.total_tokens
    });

  } catch (error) {
    console.error('AI Assistant chat error:', error);
    
    let errorMessage = 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.';
    
    if (error.code === 'insufficient_quota') {
      errorMessage = 'The AI service is temporarily unavailable due to quota limits. Please try again later.';
    } else if (error.code === 'model_not_found') {
      errorMessage = 'The AI model is not available. Please contact support.';
    }

    res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'AI Assistant service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router; 