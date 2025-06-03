import express, { Request, Response } from 'express';
import OpenAI from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { protect, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';
import { FoodLog, IFoodItem } from '../models/FoodLog';
import { Bloodwork } from '../models/Bloodwork';
import { SupplementRegimen } from '../models/SupplementRegimen';
import { SupplementIntake } from '../models/SupplementIntake';
import { aiService } from '../services/aiService';
// import PersonalFood from '../models/PersonalFood'; // Commenting out problematic import for now

const router = express.Router();

// Initialize OpenAI
// const openai = new OpenAI({ // This openai instance is local to this file, aiService has its own.
// apiKey: process.env.OPENAI_API_KEY
// });

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

// Helper function to fetch user's supplement data
const getUserSupplementData = async (userId: string, days: number = 7): Promise<string> => {
  try {
    const activeRegimens = await SupplementRegimen.find({
      userId: userId,
      isActive: true
    }).lean();

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const recentIntakes = await SupplementIntake.find({
      userId: userId,
      dateTaken: { $gte: startDate }
    }).sort({ dateTaken: -1 }).lean();

    if (activeRegimens.length === 0 && recentIntakes.length === 0) {
      return 'No supplement regimens or recent intake data available.';
    }

    let supplementString = 'ACTIVE SUPPLEMENT REGIMENS:\n';
    if (activeRegimens.length > 0) {
      supplementString += activeRegimens.map(reg => 
        `- ${reg.name} (${reg.dosage} ${reg.unit}, ${reg.frequency})`
      ).join('\n');
    } else {
      supplementString += 'No active supplement regimens found.\n';
    }

    supplementString += '\n\nRECENT SUPPLEMENT INTAKE (Last '+days+' days):\n';
    if (recentIntakes.length > 0) {
      // Summarize intake frequency
      const intakeSummary: { [key: string]: number } = {};
      recentIntakes.forEach(intake => {
        intakeSummary[intake.supplementName] = (intakeSummary[intake.supplementName] || 0) + 1;
      });
      supplementString += Object.entries(intakeSummary).map(([name, count]) => 
        `- ${name}: Taken ${count} time(s)`
      ).join('\n');
    } else {
      supplementString += 'No supplement intake recorded in the last '+days+' days.';
    }

    return supplementString;
  } catch (error) {
    logger.error('Error fetching user supplement data:', error);
    return 'Error retrieving supplement data.';
  }
};

// Helper function to fetch user's personal food summary
const getUserPersonalFoodsSummary = async (userId: string, limit: number = 7): Promise<string> => {
  try {
    // Ensure the PersonalFood model is registered and available
    const PersonalFoodModel = mongoose.models.PersonalFood || mongoose.model('PersonalFood'); // Use existing or register
    const personalFoodCount = await PersonalFoodModel.countDocuments({ userId: userId });

    if (personalFoodCount === 0) {
      return 'No personal foods saved.';
    }

    const topPersonalFoods = await PersonalFoodModel.find({ userId: userId })
      .sort({ timesUsed: -1 }) // Sort by most used
      .limit(limit)
      .select('name defaultQuantity defaultUnit nutrition.calories nutrition.protein nutrition.carbs nutrition.fat') // Select necessary fields
      .lean();

    let summaryString = `USER'S COMMON PERSONAL FOODS (Top ${topPersonalFoods.length} of ${personalFoodCount} total saved):
`;

    if (topPersonalFoods.length > 0) {
      summaryString += topPersonalFoods.map(pf => {
        const nutrition = pf.nutrition || {}; // Ensure nutrition object exists
        return `- ${pf.name} (${pf.defaultQuantity} ${pf.defaultUnit}): ` +
               `${nutrition.calories || 0} kcal, ` +
               `${nutrition.protein || 0}g P, ` +
               `${nutrition.carbs || 0}g C, ` +
               `${nutrition.fat || 0}g F`;
      }).join('\n');
    } else {
      summaryString += 'No personal foods with usage data found (this shouldn\'t typically happen if count > 0).';
    }

    return summaryString;
  } catch (error) {
    logger.error('Error fetching user personal foods summary:', error);
    // Check if the error is due to PersonalFood model not being registered
    if (error instanceof mongoose.Error.MissingSchemaError) {
        logger.error('PersonalFood model might not be registered. Ensure it is imported somewhere or explicitly registered.');
        return 'Error retrieving personal foods summary (model not registered).';
    }
    return 'Error retrieving personal foods summary.';
  }
};

// Enhanced function to determine what data to include based on question content
const determineDataNeeds = (message: string): { needsBloodwork: boolean; needsFoodLogs: boolean; needsSupplements: boolean; needsPersonalFoods: boolean; } => {
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

  // Personal food indicators
  const personalFoodKeywords = [
    'my food', 'my foods', 'personal food', 'saved food', 'my saved foods', 'my personal foods'
  ];

  return {
    needsBloodwork: bloodworkKeywords.some(keyword => lowerMessage.includes(keyword)),
    needsFoodLogs: nutritionKeywords.some(keyword => lowerMessage.includes(keyword)),
    needsSupplements: supplementKeywords.some(keyword => lowerMessage.includes(keyword)),
    needsPersonalFoods: personalFoodKeywords.some(keyword => lowerMessage.includes(keyword))
  };
};

// Read app documentation for context
const getAppContext = (): string => {
  try {
    const readmePath = path.join(__dirname, '../../../README.md');
    const algorithmDescPath = path.join(__dirname, '../../../ALGORITHM_DESCRIPTION.md');
    const tutorialContentPath = path.join(__dirname, '../../../TUTORIAL_CONTENT.md'); // Path to the new tutorial file
    
    let context = '';
    
    if (fs.existsSync(readmePath)) {
      context += '# General App Information (from README.md)\n'; // Added section header
      context += fs.readFileSync(readmePath, 'utf8');
    }
    
    if (fs.existsSync(algorithmDescPath)) {
      context += '\n\n# Algorithm and Technical Descriptions (from ALGORITHM_DESCRIPTION.md)\n'; // Added section header
      context += fs.readFileSync(algorithmDescPath, 'utf8');
    }

    if (fs.existsSync(tutorialContentPath)) {
      context += '\n\n# App Features and Tutorial Information (from TUTORIAL_CONTENT.md)\n'; // Added section header
      context += fs.readFileSync(tutorialContentPath, 'utf8');
    }
    
    if (!context) {
        return 'No app documentation context files (README.md, ALGORITHM_DESCRIPTION.md, TUTORIAL_CONTENT.md) found in the project root.';
    }

    return context;
  } catch (error) {
    logger.error('Error reading app documentation files:', error);
    return 'Error retrieving app documentation context.'; // Simplified error message for the AI
  }
};

// Create system prompts based on question type and user data
const createSystemPrompt = (type: string, appContext: string, userData: string): string => {
  const basePrompt = `You are a helpful AI assistant for Fuel IQ, an intelligent nutrition tracking app. You are knowledgeable about nutrition, health, and the app's features.

I can help you with understanding your nutrition, analyzing your data, and even logging your meals directly through chat! For example, you can say 'log an apple for breakfast' or 'I had chicken and rice for dinner'.

Always be friendly, helpful, and provide accurate information. If you're unsure about something, say so rather than guessing.

USER'S PERSONAL DATA (use this to inform your responses):
${userData || 'No specific user data provided for this query.'}

APP DOCUMENTATION (use this to answer app-specific questions):
${appContext || 'No app documentation context available.'}
`;

  const foodLoggingInstructions = `

FOOD LOGGING TASK:
- If the user's request is to log food (e.g., "log an apple", "I ate 2 eggs for breakfast", "add yogurt to my snack today"), identify this as a 'food_logging' intent.
- If the intent is 'food_logging', you MUST extract the following details:
  - 'food_description': The full description of the food including quantity if specified (e.g., "an apple", "2 eggs and a slice of toast", "yogurt with berries").
  - 'meal_type': (Optional) The meal type such as 'breakfast', 'lunch', 'dinner', or 'snack'. If not specified by the user, you can infer it from context or default to 'snack'.
  - 'date': (Optional) The date for logging, such as 'today' or 'yesterday'. If not specified, assume 'today'.
- If you identify a 'food_logging' intent, your ENTIRE response MUST be a JSON object string formatted EXACTLY like this (do not add any other text before or after the JSON object):
  { "intent": "food_logging", "details": { "food_description": "extracted food description", "meal_type": "extracted meal type", "date": "extracted date" } }
- Example: If user says "log 1 banana for breakfast", you respond: { "intent": "food_logging", "details": { "food_description": "1 banana", "meal_type": "breakfast", "date": "today" } }
- Example: If user says "I had some pasta yesterday", you respond: { "intent": "food_logging", "details": { "food_description": "some pasta", "meal_type": "snack", "date": "yesterday" } }
- If the request is NOT about logging food, then respond conversationally as a helpful AI assistant, answering the question or fulfilling the request directly without using the JSON format.
`;

  let systemPrompt = basePrompt;

  // For general and nutrition questions, provide more context.
  // For app questions, the appContext is primary.
  // Food logging instructions are always included to catch logging requests.
  systemPrompt += foodLoggingInstructions;

  if (type === 'app') {
    systemPrompt += '\nFocus on the app documentation to answer questions about app features and how to use Fuel IQ.';
  } else if (type === 'nutrition') {
    systemPrompt += '\nFocus on providing nutrition and health advice, using the provided user data for context.';
  } else { // general
    systemPrompt += '\nAnswer the user\'s general question or request.';
  }
  
  logger.debug('Generated System Prompt:', systemPrompt);
  return systemPrompt;
};

// Main chat endpoint
router.post('/chat', protect, async (req: ChatRequest, res: Response): Promise<Response | void> => {
  const { message, type = 'general', conversationHistory } = req.body;
  const userId = req.user._id;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    logger.info(`AI Assistant chat request from user: ${userId}, type: ${type}`);
    const dataNeeds = determineDataNeeds(message);
    let userDataForPrompt = '';

    if (dataNeeds.needsBloodwork) {
      userDataForPrompt += `\n\nUSER BLOODWORK DATA:\n${await getUserBloodwork(userId.toString())}`;
    }
    if (dataNeeds.needsFoodLogs) {
      userDataForPrompt += `\n\nUSER FOOD LOG DATA:\n${await getUserFoodLogs(userId.toString())}`;
    }
    if (dataNeeds.needsSupplements) {
      userDataForPrompt += `\n\nUSER SUPPLEMENT DATA:\n${await getUserSupplementData(userId.toString())}`;
    }
    if (dataNeeds.needsPersonalFoods) {
      userDataForPrompt += `\n\nUSER PERSONAL FOODS SUMMARY:\n${await getUserPersonalFoodsSummary(userId.toString())}`;
    }
    
    const appContext = getAppContext();
    const systemPrompt = createSystemPrompt(type, appContext, userDataForPrompt);

    // Construct the messages array for aiService.callOpenAI
    const chatMessages: ChatCompletionMessageParam[] = [{ role: 'system', content: systemPrompt }];

    if (conversationHistory && conversationHistory.length > 0) {
      conversationHistory.forEach(msg => {
        chatMessages.push({ role: msg.isUser ? 'user' : 'assistant', content: msg.text });
      });
    }
    chatMessages.push({ role: 'user', content: message });
    
    logger.debug(`Sending chat messages array to aiService.callOpenAI for completion.`);

    // Call aiService.callOpenAI with the ChatCompletionMessageParam[] array
    const aiResponseContent = await aiService.callOpenAI(
      chatMessages, // Pass the structured messages array
      500, 
      0.6, 
      process.env.OPENAI_MODEL || 'gpt-4o-mini'
    );

    logger.info('AI Response received from aiService.');
    logger.debug('Raw AI Response:', aiResponseContent);

    // Attempt to parse for food logging intent
    try {
      const parsedResponse = JSON.parse(aiResponseContent);
      if (parsedResponse && parsedResponse.intent === 'food_logging' && parsedResponse.details) {
        const { food_description, meal_type, date: dateQuery } = parsedResponse.details;
        logger.info(`Food logging intent detected: ${food_description}, ${meal_type}, ${dateQuery}`);

        if (!food_description) {
          throw new Error('Food description missing from LLM food logging response.');
        }

        // 1. Analyze food using aiService.lookupFood
        // lookupFood expects quantity and unit to be part of the foodQuery string
        const analyzedFood = await aiService.lookupFood(food_description); 
        
        if (!analyzedFood || !analyzedFood.nutrition || analyzedFood.nutrition.calories === undefined) {
          logger.error('Food analysis failed or returned no nutrition data for:', food_description);
          return res.json({ response: `I tried to look up "${food_description}" but couldn't find detailed nutrition information. Please try logging it manually through the Smart Food Entry.` });
        }

        // 2. Determine date and mealType
        let targetDate = new Date(); // Default to today
        if (dateQuery && dateQuery.toLowerCase() === 'yesterday') {
          targetDate.setDate(targetDate.getDate() - 1);
        }
        // Ensure date is in YYYY-MM-DD string format for FoodLog
        const dateString = targetDate.toISOString().split('T')[0];

        const validMealTypes = ['breakfast', 'lunch', 'dinner', 'snack'];
        let finalMealType = meal_type ? meal_type.toLowerCase() : 'snack';
        if (!validMealTypes.includes(finalMealType)) {
          finalMealType = 'snack'; // Default to snack if LLM provides invalid type
        }

        // 3. Prepare food item for FoodLog
        const foodToLog: IFoodItem = {
          name: analyzedFood.normalizedName,
          quantity: analyzedFood.quantity,
          unit: analyzedFood.unit,
          calories: analyzedFood.nutrition.calories || 0,
          protein: analyzedFood.nutrition.protein || 0,
          carbs: analyzedFood.nutrition.carbs || 0,
          fat: analyzedFood.nutrition.fat || 0,
          // Include all other nutrition fields from analyzedFood.nutrition
          // (Assuming IFood and analyzedFood.nutrition structure are compatible)
          ...analyzedFood.nutrition 
        };
        
        // 4. Find or create FoodLog and add the item
        let foodLogEntry = await FoodLog.findOne({
          userId: userId,
          date: dateString,
          mealType: finalMealType,
        });

        if (foodLogEntry) {
          foodLogEntry.foods.push(foodToLog);
          // Recalculate totals
          foodLogEntry.totalCalories = foodLogEntry.foods.reduce((sum, f) => sum + (f.calories || 0), 0);
          foodLogEntry.totalProtein = foodLogEntry.foods.reduce((sum, f) => sum + (f.protein || 0), 0);
          foodLogEntry.totalCarbs = foodLogEntry.foods.reduce((sum, f) => sum + (f.carbs || 0), 0);
          foodLogEntry.totalFat = foodLogEntry.foods.reduce((sum, f) => sum + (f.fat || 0), 0);
          await foodLogEntry.save();
          logger.info(`Food item added to existing FoodLog for ${dateString}, ${finalMealType}`);
        } else {
          foodLogEntry = await FoodLog.create({
            userId: userId,
            date: dateString,
            mealType: finalMealType,
            foods: [foodToLog],
            totalCalories: foodToLog.calories || 0,
            totalProtein: foodToLog.protein || 0,
            totalCarbs: foodToLog.carbs || 0,
            totalFat: foodToLog.fat || 0,
          });
          logger.info(`New FoodLog created for ${dateString}, ${finalMealType}`);
        }
        
        const confirmationMessage = `Okay, I've logged "${analyzedFood.name}" (${foodToLog.calories} kcal) to your ${finalMealType} for ${dateString === new Date().toISOString().split('T')[0] ? 'today' : dateString}.`;
        return res.json({ response: confirmationMessage, loggedFood: true });

      } else {
        // Not a food logging intent or not valid JSON, proceed as normal chat
        logger.info('Not a food logging intent or JSON parse failed. Standard chat response.');
        res.json({ response: aiResponseContent });
      }
    } catch (parseError: any) {
      // JSON parsing failed, means it's a normal text response
      if (parseError instanceof SyntaxError) {
        logger.info('Response was not JSON, treating as standard chat response.');
        res.json({ response: aiResponseContent });
      } else {
        // Some other error during the food logging specific logic
        logger.error('Error processing potential food logging response:', parseError);
        // Fallback to sending the original AI response if something went wrong in our logic
        res.json({ response: aiResponseContent });
      }
    }

  } catch (error: any) {
    logger.error('AI Assistant chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to process AI chat request' });
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