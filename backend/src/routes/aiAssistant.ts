import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';
import { protect, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { FoodLog } from '../models/FoodLog';
import { Bloodwork } from '../models/Bloodwork';

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  type?: 'app' | 'nutrition' | 'general';
}

interface ChatRequest extends AuthRequest {
  body: {
    message: string;
    type?: 'app' | 'nutrition' | 'general';
    conversationHistory?: ChatMessage[];
  };
}

// Helper function to fetch user's recent bloodwork
const getUserBloodwork = async (userId: string, limit: number = 3): Promise<string> => {
  try {
    const bloodwork = await Bloodwork.find({ userId: userId })
      .sort({ testDate: -1 })
      .limit(limit)
      .lean();

    if (bloodwork.length === 0) {
      return 'No bloodwork data available.';
    }

    return bloodwork.map(test => {
      const date = new Date(test.testDate).toLocaleDateString();
      const labValues = test.labValues
        .map(lab => `${lab.name}: ${lab.value} ${lab.unit}${lab.status ? ` (${lab.status})` : ''}`)
        .join(', ');
      return `Test Date: ${date} - ${labValues}`;
    }).join('\n');
  } catch (error) {
    logger.error('Error fetching user bloodwork:', error);
    return 'Error retrieving bloodwork data.';
  }
};

// Helper function to fetch user's recent food logs
const getUserFoodLogs = async (userId: string, days: number = 7): Promise<string> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const foodLogs = await FoodLog.find({
      userId: userId,
      date: { $gte: startDate }
    }).sort({ date: -1 }).lean();

    if (foodLogs.length === 0) {
      return 'No recent food logs available.';
    }

    // Summarize recent nutrition data using the totalX fields
    const totalCalories = foodLogs.reduce((sum, log) => sum + (log.totalCalories || 0), 0);
    const totalProtein = foodLogs.reduce((sum, log) => sum + (log.totalProtein || 0), 0);
    const totalCarbs = foodLogs.reduce((sum, log) => sum + (log.totalCarbs || 0), 0);
    const totalFat = foodLogs.reduce((sum, log) => sum + (log.totalFat || 0), 0);

    const avgCalories = Math.round(totalCalories / days);
    const avgProtein = Math.round(totalProtein / days);
    const avgCarbs = Math.round(totalCarbs / days);
    const avgFat = Math.round(totalFat / days);

    // Recent foods from the foods array
    const recentFoods = foodLogs.slice(0, 10).map(log => {
      const date = new Date(log.date).toLocaleDateString();
      const foodList = log.foods.map(food => food.name).join(', ');
      return `${date} (${log.mealType}): ${foodList} (${log.totalCalories || 0} cal)`;
    }).join('\n');

    return `RECENT NUTRITION SUMMARY (Last ${days} days):
Average daily: ${avgCalories} calories, ${avgProtein}g protein, ${avgCarbs}g carbs, ${avgFat}g fat

RECENT MEALS:
${recentFoods}`;
  } catch (error) {
    logger.error('Error fetching user food logs:', error);
    return 'Error retrieving food log data.';
  }
};

// Enhanced function to determine what data to include based on question content
const determineDataNeeds = (message: string): { needsBloodwork: boolean; needsFoodLogs: boolean; needsSupplements: boolean } => {
  const lowerMessage = message.toLowerCase();
  
  // Bloodwork indicators
  const bloodworkKeywords = [
    'ldl', 'hdl', 'cholesterol', 'triglycerides', 'glucose', 'blood sugar', 'hemoglobin', 'hba1c',
    'testosterone', 'vitamin d', 'b12', 'iron', 'ferritin', 'tsh', 'thyroid', 'creatinine',
    'blood pressure', 'biomarker', 'lab result', 'blood test', 'my levels', 'my cholesterol',
    'my blood', 'my results'
  ];

  // Food/nutrition indicators
  const nutritionKeywords = [
    'calories', 'protein', 'carbs', 'fat', 'macro', 'micro', 'nutrition', 'diet', 'eating',
    'food', 'meal', 'intake', 'my eating', 'what i ate', 'my diet', 'my nutrition',
    'my calories', 'my protein'
  ];

  // Supplement indicators (for future)
  const supplementKeywords = [
    'supplement', 'vitamin', 'mineral', 'pill', 'medication', 'my supplements', 'taking'
  ];

  return {
    needsBloodwork: bloodworkKeywords.some(keyword => lowerMessage.includes(keyword)),
    needsFoodLogs: nutritionKeywords.some(keyword => lowerMessage.includes(keyword)),
    needsSupplements: supplementKeywords.some(keyword => lowerMessage.includes(keyword))
  };
};

// Read app documentation for context
const getAppContext = (): string => {
  try {
    const readmePath = path.join(__dirname, '../../../README.md');
    const addPath = path.join(__dirname, '../../../ALGORITHM_DESCRIPTION.md');
    
    let context = '';
    
    if (fs.existsSync(readmePath)) {
      context += fs.readFileSync(readmePath, 'utf8');
    }
    
    if (fs.existsSync(addPath)) {
      context += '\n\n' + fs.readFileSync(addPath, 'utf8');
    }
    
    return context;
  } catch (error) {
    logger.error('Error reading app documentation:', error);
    return '';
  }
};

// Create system prompts based on question type and user data
const createSystemPrompt = (type: string, appContext: string, userData: string): string => {
  const basePrompt = `You are a helpful AI assistant for Fuel IQ, an intelligent nutrition tracking app. You are knowledgeable about nutrition, health, and the app's features.

Always be friendly, helpful, and provide accurate information. If you're unsure about something, say so rather than guessing.

${userData ? `USER'S PERSONAL DATA:
${userData}

When providing advice, reference the user's actual data when relevant. Be specific about their metrics, trends, and patterns.` : ''}`;

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
router.post('/chat', protect, async (req: ChatRequest, res: Response): Promise<Response | void> => {
  try {
    const { message, type = 'general', conversationHistory = [] } = req.body;
    const authReq = req as AuthRequest;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    logger.info(`AI Assistant chat request - Type: ${type}, User: ${authReq.user?.id}`);

    // Get app context for app-specific questions
    const appContext = type === 'app' ? getAppContext() : '';
    
    // Determine data needs based on message content
    const dataNeeds = determineDataNeeds(message);

    // Fetch user data based on needs
    let userData = '';
    if (dataNeeds.needsBloodwork) {
      const bloodworkData = await getUserBloodwork(authReq.user?.id || '');
      userData += bloodworkData + '\n\n';
      logger.info(`Including bloodwork data for user ${authReq.user?.id}`);
    }
    if (dataNeeds.needsFoodLogs) {
      const foodLogData = await getUserFoodLogs(authReq.user?.id || '');
      userData += foodLogData + '\n\n';
      logger.info(`Including food log data for user ${authReq.user?.id}`);
    }
    // Note: supplement data will be added when that feature is implemented
    if (dataNeeds.needsSupplements) {
      userData += 'Supplement tracking feature coming soon.\n\n';
    }

    // Create system prompt based on question type and user data
    const systemPrompt = createSystemPrompt(type, appContext, userData.trim());

    // Build conversation history for context
    const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
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

    logger.info(`AI Assistant response generated - Tokens: ${completion.usage?.total_tokens}`);

    return res.json({
      success: true,
      response: response.trim(),
      type,
      tokens_used: completion.usage?.total_tokens
    });

  } catch (error: any) {
    logger.error('AI Assistant chat error:', error);
    
    let errorMessage = 'I apologize, but I\'m having trouble responding right now. Please try again in a moment.';
    
    if (error.code === 'insufficient_quota') {
      errorMessage = 'The AI service is temporarily unavailable due to quota limits. Please try again later.';
    } else if (error.code === 'model_not_found') {
      errorMessage = 'The AI model is not available. Please contact support.';
    }

    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

// Health check endpoint
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    message: 'AI Assistant service is running',
    timestamp: new Date().toISOString()
  });
});

export default router; 