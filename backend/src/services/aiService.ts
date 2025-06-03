import OpenAI from 'openai';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { logger } from '../utils/logger';
import { IFoodLog } from '../models/FoodLog';
import { IBloodwork } from '../models/Bloodwork';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface NutritionAnalysisInput {
  foodLogs: IFoodLog[];
  userProfile: {
    age?: number;
    gender?: string;
    weight?: number;
    height?: number;
    activityLevel?: string;
    healthGoals?: string[];
    allergies?: string[];
    dietaryRestrictions?: string[];
    weightGoal?: number;
    weightGoalTimeframe?: string;
  };
}

export interface BloodworkAnalysisInput {
  bloodwork: IBloodwork[];
  userProfile: {
    age?: number;
    gender?: string;
    weight?: number;
    height?: number;
  };
}

export interface CorrelationAnalysisInput {
  foodLogs: IFoodLog[];
  bloodwork: IBloodwork[];
  userProfile: {
    age?: number;
    gender?: string;
    weight?: number;
    height?: number;
    activityLevel?: string;
    healthGoals?: string[];
  };
}

class AIService {
  private currentModel = 'gpt-4o-mini'; // Back to stable, working model
  private geminiModel = 'gemini-1.5-flash-latest'; // Changed to 1.5 flash
  
  getCurrentModel(): string {
    return this.currentModel;
  }
  
  setModel(model: string): void {
    this.currentModel = model;
  }

  getAvailableModels(): { value: string; label: string; description: string }[] {
    return [
      {
        value: 'gpt-4o-mini',
        label: 'GPT-4o Mini',
        description: 'Fast & cost-effective (recommended)'
      },
      {
        value: 'gpt-4o',
        label: 'GPT-4o', 
        description: 'More capable, higher cost'
      },
      {
        value: 'gpt-4-turbo',
        label: 'GPT-4 Turbo',
        description: 'Advanced capabilities'
      },
      {
        value: 'gpt-3.5-turbo',
        label: 'GPT-3.5 Turbo',
        description: 'Fast & economical'
      }
    ];
  }

  private parseArrayString(arrayStr: string): string[] {
    try {
      // Clean up the array string and try to parse it
      const cleaned = arrayStr
        .replace(/\\"/g, '"')           // Unescape quotes
        .replace(/\\n/g, '\n')          // Unescape newlines
        .replace(/\\r/g, '\r')          // Unescape carriage returns
        .replace(/\\t/g, '\t');         // Unescape tabs
      
      // Try to parse as JSON array
      const parsed = JSON.parse(`[${cleaned}]`);
      return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
      // If parsing fails, try to split by quotes and commas
      const items = arrayStr
        .split('",')
        .map(item => item.replace(/^"/, '').replace(/"$/, '').trim())
        .filter(item => item.length > 0);
      
      return items.length > 0 ? items : ['Analysis unavailable'];
    }
  }

  async callOpenAI(
    messages: ChatCompletionMessageParam[], 
    maxTokens: number = 2000, 
    temperature: number = 0.3,
    model?: string // Optional model override
  ): Promise<string> {
    try {
      if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'your-openai-api-key-here') {
        logger.error('OpenAI API key is not configured or is the default placeholder');
        throw new Error('OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env file.');
      }

      // Log the first and last few characters for debugging (safely)
      const keyStart = process.env.OPENAI_API_KEY.substring(0, 7);
      const keyEnd = process.env.OPENAI_API_KEY.substring(process.env.OPENAI_API_KEY.length - 4);
      logger.info(`Using OpenAI API key: ${keyStart}...${keyEnd} (length: ${process.env.OPENAI_API_KEY.length})`);

      const response = await openai.chat.completions.create({
        model: model || this.currentModel, // Use provided model or default
        messages: messages, // Use the full messages array
        max_tokens: maxTokens,
        temperature: temperature,
      });

      return response.choices[0]?.message?.content || '';
    } catch (error: any) {
      logger.error('OpenAI API error:', {
        message: error.message,
        code: error.code,
        type: error.type,
        status: error.status
      });
      
      if (error.message.includes('API key')) {
        throw new Error('OpenAI API key is missing or invalid. Please check your configuration.');
      }
      
      if (error.code === 'insufficient_quota') {
        throw new Error('OpenAI API quota exceeded. Please check your billing and usage.');
      }
      
      if (error.code === 'model_not_found') {
        throw new Error(`Model ${this.currentModel} not found. Please try a different model.`);
      }

      if (error.code === 'invalid_api_key') {
        throw new Error('Invalid OpenAI API key. Please check your API key in the .env file.');
      }

      if (error.status === 401) {
        throw new Error('OpenAI API authentication failed. Please check your API key.');
      }
      
      throw new Error(`OpenAI API error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  private async callGemini(prompt: string, maxOutputTokens: number = 2000): Promise<string> {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'your_actual_gemini_api_key_here' || process.env.GEMINI_API_KEY === '') {
        logger.error('Gemini API key is not configured or is the default placeholder');
        throw new Error('Gemini API key is not configured. Please set GEMINI_API_KEY in your .env file.');
      }

      // Log the first and last few characters for debugging (safely)
      const keyStart = process.env.GEMINI_API_KEY.substring(0, 7);
      const keyEnd = process.env.GEMINI_API_KEY.substring(process.env.GEMINI_API_KEY.length - 4);
      logger.info(`Using Gemini API key: ${keyStart}...${keyEnd} (length: ${process.env.GEMINI_API_KEY.length})`);
      
      const model = genAI.getGenerativeModel({ 
        model: this.geminiModel,
        // Basic safety settings - adjust as needed
        safetySettings: [
          {
            category: HarmCategory.HARM_CATEGORY_HARASSMENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
          {
            category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
            threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
          },
        ],
        generationConfig: {
          maxOutputTokens: maxOutputTokens,
          // temperature: 0.9, // Optional: Adjust for creativity, default is often 0.9 for gemini-pro
          // topP: 1, // Optional
        }
      });

      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      
      if (!text) {
        logger.warn('Gemini API returned an empty response or response without text.', { response });
        // Check for blocked content due to safety settings
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Gemini API request was blocked due to: ${response.promptFeedback.blockReason}. Prompt feedback: ${JSON.stringify(response.promptFeedback)}`);
        }
        throw new Error('Gemini API returned an empty response.');
      }
      return text;
    } catch (error: any) {
      logger.error('Gemini API error:', {
        message: error.message,
        // Add any specific Gemini error properties if available
      });
      if (error.message.includes('API key')) {
        throw new Error('Gemini API key is missing, invalid, or not enabled. Please check your configuration and ensure the Gemini API is enabled in your Google Cloud project.');
      }
      if (error.message.includes('content was blocked')) { // Specific check for content blocking
         throw new Error(`Gemini content generation blocked: ${error.message}`);
      }
      // It's useful to check for specific error types from the Gemini SDK if they become known
      // For example, if the SDK throws errors with specific `code` or `status` properties.
      throw new Error(`Gemini API error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  async analyzeNutrition(nutritionData: any): Promise<{
    insights: string[];
    recommendations: string[];
    confidence: number;
    summary: string;
    detailedAnalysis: string;
    llmModel: string;
  }> {
    const prompt = `Analyze the following nutrition data and provide insights and recommendations.
      User Profile: ${JSON.stringify(nutritionData.userProfile, null, 2)}
      Food Logs Summary (Actual Days: ${nutritionData.actualDays}, Requested: ${nutritionData.requestedDays}):
      Total Calories: ${nutritionData.totalCalories}, Protein: ${nutritionData.totalProtein}g, Carbs: ${nutritionData.totalCarbs}g, Fat: ${nutritionData.totalFat}g
      Full Food Log Details:
      ${nutritionData.foodLogs.map((log: { date: string | number | Date; mealType: any; foods: any[]; totalCalories: any; }) => `
        Date: ${new Date(log.date).toLocaleDateString()}
        Meal: ${log.mealType}
        Foods: ${log.foods.map((food: { name: any; quantity: any; unit: any; calories: any; }) => `${food.name} (${food.quantity} ${food.unit}) - ${food.calories} kcal`).join(', ')}
        Total Meal Calories: ${log.totalCalories}
      `).join('\\n')}

      Supplement Regimens:
      ${nutritionData.supplementRegimens.map((reg: { name: any; dosage: any; unit: any; frequency: any; }) => `${reg.name} - ${reg.dosage} ${reg.unit}, ${reg.frequency}`).join('\\n') || 'None'}

      Supplement Intakes (Recent):
      ${nutritionData.supplementIntakes.map((intake: { supplementName: any; dosage: any; unit: any; dateTaken: string | number | Date; }) => `${intake.supplementName} - ${intake.dosage} ${intake.unit} on ${new Date(intake.dateTaken).toLocaleDateString()}`).join('\\n') || 'None'}

      Focus on:
      - Overall diet quality and macronutrient balance.
      - Potential micronutrient deficiencies or excesses (infer based on food types if specific data is missing).
      - Alignment with user's health goals: ${nutritionData.userProfile?.healthGoals?.join(', ') || 'Not specified'}.
      - Actionable recommendations for improvement.
      - Impact of supplements, if any.
      
      Return your response as a JSON object with the following structure:
      {
        "insights": ["Insight 1", "Insight 2", "Insight 3", "Insight 4", "Insight 5"],
        "recommendations": ["Recommendation 1", "Recommendation 2", "Recommendation 3", "Recommendation 4", "Recommendation 5"],
        "confidence": 0.85, // Your confidence in the analysis (0.0 to 1.0)
        "summary": "A brief overall summary of the nutritional status.",
        "detailedAnalysis": "A more detailed breakdown of the analysis."
      }
      Be concise and clear in your insights and recommendations.
      `;
    
    logger.info('Requesting nutrition analysis from OpenAI.');
    const messagesForOpenAI: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are a qualified nutritionist and health analyst. Respond in JSON.' },
      { role: 'user', content: prompt }
    ];
    const analysisResult = await this.callOpenAI(messagesForOpenAI, 3000, 0.3, this.currentModel);

    try {
      // Clean the AI response: remove markdown code block fences
      let cleanedResult = analysisResult;
      if (cleanedResult.startsWith("```json")) {
        cleanedResult = cleanedResult.substring(7); // Remove ```json
      }
      if (cleanedResult.endsWith("```")) {
        cleanedResult = cleanedResult.substring(0, cleanedResult.length - 3);
      }
      cleanedResult = cleanedResult.trim(); // Trim whitespace

      const parsedResult = JSON.parse(cleanedResult);
      return {
        insights: Array.isArray(parsedResult.insights) ? parsedResult.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsedResult.recommendations) ? parsedResult.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence: typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 0.85,
        summary: parsedResult.summary || 'Nutrition analysis completed with available data.',
        detailedAnalysis: parsedResult.detailedAnalysis || 'Detailed analysis includes both dietary intake and supplement regimen effectiveness. Consider working with a registered dietitian for personalized optimization.',
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error('Failed to parse AI response for nutrition analysis:', error);
      logger.error('Raw AI response (first 500 chars):', analysisResult?.substring(0, 500));
      
      // Fallback response
      return {
        insights: ['Unable to analyze nutrition data at this time', 'Please ensure you have logged sufficient food entries', 'Consider reviewing your supplement regimen with a healthcare provider', 'Try again later or check your internet connection', 'Both food and supplement tracking contribute to optimal health'],
        recommendations: ['Log more diverse food entries for better analysis', 'Review supplement timing with meals for better absorption', 'Ensure accurate portion sizes and supplement dosages', 'Try again in a few minutes', 'Consider consulting with a registered dietitian'],
        confidence: 0.1,
        summary: 'Nutrition analysis temporarily unavailable due to technical issues.',
        detailedAnalysis: 'We were unable to generate a detailed nutritional analysis including both food and supplement data at this time. For optimal health insights, ensure you have logged comprehensive food entries and accurate supplement regimens. A registered dietitian can help you optimize both your diet and supplement strategy based on your individual needs and health goals.',
        llmModel: this.currentModel
      };
    }
  }

  async analyzeBloodwork(bloodworkData: any): Promise<{
    insights: string[];
    recommendations: string[];
    confidence: number;
    summary: string;
    detailedAnalysis: string;
    llmModel: string;
  }> {
    const prompt = `Analyze the following bloodwork data and provide insights and recommendations.
      User Profile: ${JSON.stringify(bloodworkData.userProfile, null, 2)}
      Bloodwork Results:
      ${bloodworkData.bloodwork.map((test: { testName: any; testDate: string | number | Date; labValues: any[]; notes: any; }) => `
        Test: ${test.testName} (Date: ${new Date(test.testDate).toLocaleDateString()})
        Values:
        ${test.labValues.map((val: { name: any; value: any; unit: any; referenceRange: any; status: any; }) => 
          `  - ${val.name}: ${val.value} ${val.unit} (Range: ${val.referenceRange || 'N/A'}, Status: ${val.status || 'N/A'})`
        ).join('\\n')}
        ${test.notes ? `Notes: ${test.notes}` : ''}
      `).join('\\n\\n')}

      Focus on:
      - Key biomarkers out of range or concerning.
      - Potential health implications.
      - Lifestyle or dietary factors that might influence these results.
      - Actionable recommendations for improvement or further investigation.
      
      Return your response as a JSON object with the following structure:
      {
        "insights": ["Insight 1 regarding bloodwork", "Insight 2"],
        "recommendations": ["Recommendation 1 for bloodwork", "Recommendation 2"],
        "confidence": 0.9, // Your confidence in the analysis (0.0 to 1.0)
        "summary": "A brief overall summary of the bloodwork findings.",
        "detailedAnalysis": "A more detailed breakdown of the bloodwork analysis."
      }
      `;

    logger.info('Requesting bloodwork analysis from OpenAI.');
    const messagesForOpenAI: ChatCompletionMessageParam[] = [ 
      { role: 'system', content: 'You are a health analyst specializing in bloodwork interpretation. Provide evidence-based insights. Respond in JSON.' },
      { role: 'user', content: prompt }
    ];
    const analysisResult = await this.callOpenAI(messagesForOpenAI, 2500, 0.3, this.currentModel);

    try {
      const parsedResult = JSON.parse(analysisResult);
      return {
        insights: Array.isArray(parsedResult.insights) ? parsedResult.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsedResult.recommendations) ? parsedResult.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence: typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 0.9,
        summary: parsedResult.summary || 'Bloodwork analysis completed with available data.',
        detailedAnalysis: parsedResult.detailedAnalysis || 'Detailed bloodwork analysis is currently unavailable. Please consult with a healthcare professional for proper interpretation.',
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error('Failed to parse AI response for bloodwork analysis:', error);
      logger.error('Raw AI response (first 500 chars):', analysisResult?.substring(0, 500));
      
      // Fallback response
      return {
        insights: ['Unable to analyze bloodwork data at this time', 'Lab values appear to be documented', 'Professional interpretation recommended', 'Regular monitoring is important', 'Follow up with healthcare provider'],
        recommendations: ['Consult with a healthcare professional for proper interpretation', 'Discuss any abnormal values with your doctor', 'Maintain regular health checkups', 'Keep a record of all lab results', 'Follow prescribed treatment plans'],
        confidence: 0.1,
        summary: 'Bloodwork analysis temporarily unavailable due to technical issues.',
        detailedAnalysis: 'We were unable to generate a detailed bloodwork analysis at this time. This type of analysis requires sophisticated interpretation of laboratory biomarkers. For meaningful insights into your health markers, consider working with a qualified healthcare professional who can provide personalized medical advice based on your complete health history, current symptoms, and individual risk factors. Never rely solely on automated analysis for medical decisions.',
        llmModel: this.currentModel
      };
    }
  }

  async analyzeCorrelation(nutritionData: any, bloodworkData: any): Promise<{
    insights: string[];
    recommendations: string[];
    confidence: number;
    summary: string;
    detailedAnalysis: string;
    llmModel: string;
  }> {
    const prompt = `Analyze the following integrated nutrition and bloodwork data for potential correlations and provide insights.
      User Profile: ${JSON.stringify(nutritionData.userProfile, null, 2)}
      
      Nutrition Summary (Last ${nutritionData.actualDays} days):
      Average Calories: ${nutritionData.totalCalories / nutritionData.actualDays}, Protein: ${nutritionData.totalProtein / nutritionData.actualDays}g, Carbs: ${nutritionData.totalCarbs / nutritionData.actualDays}g, Fat: ${nutritionData.totalFat / nutritionData.actualDays}g
      Key Food Log Patterns: [Provide a brief summary of common foods or meal types if possible from data]
      ${nutritionData.foodLogs.slice(0,3).map((log: { date: string | number | Date; mealType: any; foods: any[]; }) => `Date: ${new Date(log.date).toLocaleDateString()}, Meal: ${log.mealType}, Foods: ${log.foods.map((food: { name: any; }) => food.name).join(', ')}`).join('\\n')}

      Bloodwork Summary:
      ${bloodworkData.bloodwork.map((test: { testName: any; testDate: string | number | Date; labValues: any[]; }) => `
        Test: ${test.testName} (Date: ${new Date(test.testDate).toLocaleDateString()})
        Key Values:
        ${test.labValues.filter((val: { status: string; }) => val.status && val.status !== 'Normal').map((val: { name: any; value: any; unit: any; status: any; }) => 
          `  - ${val.name}: ${val.value} ${val.unit} (Status: ${val.status})`
        ).join('\\n')}
      `).join('\\n\\n')}

      Focus on:
      - Potential correlations between dietary habits (e.g., high intake of certain foods/nutrients) and bloodwork markers.
      - How supplements might be influencing biomarkers, based on nutrition data.
      - Actionable recommendations considering both diet and bloodwork.
      
      Return your response as a JSON object with the structure:
      {
        "insights": ["Correlation insight 1", "Insight 2"],
        "recommendations": ["Recommendation based on correlation", "Recommendation 2"],
        "confidence": 0.75,
        "summary": "Brief summary of correlations and overall health status.",
        "detailedAnalysis": "Detailed breakdown of the correlation analysis."
      }
      If no clear correlations can be drawn, state that, but still provide general advice based on the combined data.
      `;

    logger.info('Requesting correlation analysis from OpenAI.');
    const messagesForOpenAI: ChatCompletionMessageParam[] = [ 
      { role: 'system', content: 'You are a health data analyst specializing in correlating diet, supplements, and bloodwork. Respond in JSON.' },
      { role: 'user', content: prompt }
    ];
    const analysisResult = await this.callOpenAI(messagesForOpenAI, 3500, 0.3, this.currentModel);

    try {
      const parsedResult = JSON.parse(analysisResult);
      return {
        insights: Array.isArray(parsedResult.insights) ? parsedResult.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsedResult.recommendations) ? parsedResult.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence: typeof parsedResult.confidence === 'number' ? parsedResult.confidence : 0.75,
        summary: parsedResult.summary || 'Correlation analysis completed with available data.',
        detailedAnalysis: parsedResult.detailedAnalysis || 'Detailed correlation analysis is currently unavailable. Please ensure sufficient nutrition and bloodwork data is available.',
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error('Failed to parse AI response for correlation analysis:', error);
      logger.error('Raw AI response (first 500 chars):', analysisResult?.substring(0, 500));
      
      // Fallback response
      return {
        insights: ['Unable to analyze correlation data at this time', 'Both nutrition and bloodwork data appear to be available', 'Professional guidance recommended for interpretation', 'Individual responses to diet vary significantly', 'Long-term patterns are most meaningful'],
        recommendations: ['Continue logging detailed food intake', 'Maintain regular bloodwork monitoring', 'Consult with a registered dietitian', 'Consider working with a healthcare team', 'Focus on consistent, long-term dietary patterns'],
        confidence: 0.1,
        summary: 'Correlation analysis temporarily unavailable due to technical issues.',
        detailedAnalysis: 'We were unable to generate a detailed correlation analysis at this time. This type of analysis requires sophisticated interpretation of both nutritional intake patterns and laboratory biomarkers. For meaningful insights into how your diet may be affecting your health markers, consider working with a qualified healthcare team including a registered dietitian and your primary care physician who can provide personalized guidance based on your complete health profile and goals.',
        llmModel: this.currentModel
      };
    }
  }

  async lookupFood(foodQuery: string, quantity: number = 1, unit: string = 'serving'): Promise<{
    name: string;
    normalizedName: string;
    quantity: number;
    unit: string;
    nutrition: {
      // Macronutrients
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
      fiber: number;
      sugar: number;
      
      // Minerals for metabolic health and hydration
      sodium: number;
      potassium: number;
      calcium: number;
      magnesium: number;
      phosphorus: number;
      iron: number;
      zinc: number;
      selenium: number;
      
      // Vitamins for immune system and overall health
      vitaminA: number;
      vitaminC: number;
      vitaminD: number;
      vitaminE: number;
      vitaminK: number;
      thiamin: number; // B1
      riboflavin: number; // B2
      niacin: number; // B3
      vitaminB6: number;
      folate: number; // B9
      vitaminB12: number;
      biotin: number;
      pantothenicAcid: number; // B5
      
      // Additional nutrients for lipids and cardiovascular health
      cholesterol: number;
      saturatedFat: number;
      monounsaturatedFat: number;
      polyunsaturatedFat: number;
      transFat: number;
      omega3: number;
      omega6: number;
      
      // Performance compounds
      creatine: number;
    };
    confidence: number;
    weightConversion?: {
      grams: number;
      ounces: number;
      pounds: number;
    };
  }> {
    // Construct the prompt for the LLM
    const prompt = `Provide detailed nutritional information for the food item: "${foodQuery}".
If quantity and unit are part of the query (e.g., "1 large apple", "100g chicken breast"), use them. Otherwise, assume quantity is ${quantity} and unit is "${unit}".
Break down the food item into its components if it's a meal (e.g., "chicken salad sandwich").
If the item is ambiguous, use the most common interpretation.

Return the response as a JSON object with the following structure. Ensure all nutrient values are numbers. If a nutrient is not present or data is unavailable, use 0.
Do not include any text outside the JSON object.

{
  "name": "Original food query or most specific name found",
  "normalizedName": "Normalized name of the food item (e.g., 'Apple, raw, with skin')",
  "quantity": <parsed or default quantity as number>,
  "unit": "<parsed or default unit as string>",
  "nutrition": {
    "calories": <number>,
    "protein": <number>, // grams
    "carbs": <number>, // grams
    "fat": <number>, // grams
    "fiber": <number>, // grams
    "sugar": <number>, // grams
    "sodium": <number>, // milligrams
    "potassium": <number>, // milligrams
    "calcium": <number>, // milligrams
    "magnesium": <number>, // milligrams
    "phosphorus": <number>, // milligrams
    "iron": <number>, // milligrams
    "zinc": <number>, // milligrams
    "selenium": <number>, // micrograms
    "vitaminA": <number>, // IU or RAE (specify if possible, otherwise just number)
    "vitaminC": <number>, // milligrams
    "vitaminD": <number>, // IU
    "vitaminE": <number>, // milligrams or IU
    "vitaminK": <number>, // micrograms
    "thiamin": <number>, // B1, milligrams
    "riboflavin": <number>, // B2, milligrams
    "niacin": <number>, // B3, milligrams
    "vitaminB6": <number>, // milligrams
    "folate": <number>, // DFE or micrograms (specify if possible, otherwise just number)
    "vitaminB12": <number>, // micrograms
    "biotin": <number>, // micrograms
    "pantothenicAcid": <number>, // B5, milligrams
    "cholesterol": <number>, // milligrams
    "saturatedFat": <number>, // grams
    "monounsaturatedFat": <number>, // grams
    "polyunsaturatedFat": <number>, // grams
    "transFat": <number>, // grams
    "omega3": <number>, // milligrams or grams
    "omega6": <number>, // milligrams or grams
    "creatine": <number> // grams (often 0 for most foods)
  },
  "confidence": <number between 0.0 and 1.0 indicating confidence in the accuracy>,
  "weightConversion": { // Optional: if applicable and known for common units
    "grams": <number for 1 default serving in grams>,
    "ounces": <number for 1 default serving in ounces>,
    "pounds": <number for 1 default serving in pounds>
  }
}
Example for "1 large apple":
{
  "name": "1 large apple",
  "normalizedName": "Apple, raw, fuji, large, with skin",
  "quantity": 1,
  "unit": "large",
  "nutrition": {
    "calories": 116, "protein": 0.5, "carbs": 30.7, "fat": 0.3, "fiber": 5.4, "sugar": 23.1, 
    "sodium": 2, "potassium": 239, "calcium": 13, "magnesium": 11, "phosphorus": 25, "iron": 0.3, "zinc": 0.1, "selenium": 0.7,
    "vitaminA": 121, "vitaminC": 10.3, "vitaminD": 0, "vitaminE": 0.4, "vitaminK": 4.9,
    "thiamin": 0.038, "riboflavin": 0.058, "niacin": 0.203, "vitaminB6": 0.091, "folate": 7, "vitaminB12": 0,
    "biotin": 0, "pantothenicAcid": 0.135, "cholesterol": 0, 
    "saturatedFat": 0.1, "monounsaturatedFat": 0, "polyunsaturatedFat": 0.1, "transFat": 0,
    "omega3": 0, "omega6": 0, "creatine": 0
  },
  "confidence": 0.9,
  "weightConversion": { "grams": 223, "ounces": 7.8, "pounds": 0.49 }
}
Ensure all values are numbers. If a nutrient is not applicable or unknown, use 0.
`;

    logger.info(`Requesting food lookup from OpenAI for: "${foodQuery}"`);
    const messagesForOpenAI: ChatCompletionMessageParam[] = [ 
      { role: 'system', content: 'You are a food nutrition database. Provide detailed nutritional information in JSON format.' },
      { role: 'user', content: prompt }
    ];
    // Ensure this call matches the updated signature: (messages, maxTokens, temperature, model)
    const resultString = await this.callOpenAI(messagesForOpenAI, 1500, 0.2, this.currentModel);

    try {
      const parsedResult = JSON.parse(resultString);
      return {
        name: parsedResult.name || foodQuery,
        normalizedName: parsedResult.normalizedName || foodQuery,
        quantity: Number(parsedResult.quantity) || quantity,
        unit: parsedResult.unit || unit,
        nutrition: {
          calories: Number(parsedResult.nutrition?.calories) || 0,
          protein: Number(parsedResult.nutrition?.protein) || 0,
          carbs: Number(parsedResult.nutrition?.carbs) || 0,
          fat: Number(parsedResult.nutrition?.fat) || 0,
          fiber: Number(parsedResult.nutrition?.fiber) || 0,
          sugar: Number(parsedResult.nutrition?.sugar) || 0,
          sodium: Number(parsedResult.nutrition?.sodium) || 0,
          potassium: Number(parsedResult.nutrition?.potassium) || 0,
          calcium: Number(parsedResult.nutrition?.calcium) || 0,
          magnesium: Number(parsedResult.nutrition?.magnesium) || 0,
          phosphorus: Number(parsedResult.nutrition?.phosphorus) || 0,
          iron: Number(parsedResult.nutrition?.iron) || 0,
          zinc: Number(parsedResult.nutrition?.zinc) || 0,
          selenium: Number(parsedResult.nutrition?.selenium) || 0,
          vitaminA: Number(parsedResult.nutrition?.vitaminA) || 0,
          vitaminC: Number(parsedResult.nutrition?.vitaminC) || 0,
          vitaminD: Number(parsedResult.nutrition?.vitaminD) || 0,
          vitaminE: Number(parsedResult.nutrition?.vitaminE) || 0,
          vitaminK: Number(parsedResult.nutrition?.vitaminK) || 0,
          thiamin: Number(parsedResult.nutrition?.thiamin) || 0,
          riboflavin: Number(parsedResult.nutrition?.riboflavin) || 0,
          niacin: Number(parsedResult.nutrition?.niacin) || 0,
          vitaminB6: Number(parsedResult.nutrition?.vitaminB6) || 0,
          folate: Number(parsedResult.nutrition?.folate) || 0,
          vitaminB12: Number(parsedResult.nutrition?.vitaminB12) || 0,
          biotin: Number(parsedResult.nutrition?.biotin) || 0,
          pantothenicAcid: Number(parsedResult.nutrition?.pantothenicAcid) || 0,
          cholesterol: Number(parsedResult.nutrition?.cholesterol) || 0,
          saturatedFat: Number(parsedResult.nutrition?.saturatedFat) || 0,
          monounsaturatedFat: Number(parsedResult.nutrition?.monounsaturatedFat) || 0,
          polyunsaturatedFat: Number(parsedResult.nutrition?.polyunsaturatedFat) || 0,
          transFat: Number(parsedResult.nutrition?.transFat) || 0,
          omega3: Number(parsedResult.nutrition?.omega3) || 0,
          omega6: Number(parsedResult.nutrition?.omega6) || 0,
          creatine: Number(parsedResult.nutrition?.creatine) || 0,
        },
        confidence: Math.min(Math.max(Number(parsedResult.confidence) || 0.8, 0), 1),
        weightConversion: parsedResult.weightConversion || undefined
      };
    } catch (error) {
      logger.error('Failed to lookup food with AI:', error);
      
      // Fallback response
      return {
        name: foodQuery,
        normalizedName: foodQuery,
        quantity,
        unit,
        nutrition: {
          calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0,
          sodium: 0, potassium: 0, calcium: 0, magnesium: 0, phosphorus: 0,
          iron: 0, zinc: 0, selenium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
          vitaminE: 0, vitaminK: 0, thiamin: 0, riboflavin: 0, niacin: 0,
          vitaminB6: 0, folate: 0, vitaminB12: 0, biotin: 0, pantothenicAcid: 0,
          cholesterol: 0, saturatedFat: 0, monounsaturatedFat: 0, 
          polyunsaturatedFat: 0, transFat: 0, omega3: 0, omega6: 0,
          creatine: 0
        },
        confidence: 0.1,
        weightConversion: undefined
      };
    }
  }

  async searchFoods(query: string): Promise<{
    name: string;
    category: string;
    commonPortions: Array<{ amount: number; unit: string; description: string }>;
    estimatedNutrition: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
  }[]> {
    const prompt = `Search for food items matching "${query}". 
For each item, provide a common name, category (e.g., Fruit, Vegetable, Meat, Dairy, Grain, Packaged Meal, Fast Food, Beverage), 
a few common portions (e.g., 1 serving, 100g, 1 cup, 1 piece), and estimated nutrition for a standard serving (calories, protein, carbs, fat).
Limit to 5-7 results.
Return the response as a JSON array, where each element is an object with "name", "category", "commonPortions" (array of objects with "amount", "unit", "description"), and "estimatedNutrition" (object with "calories", "protein", "carbs", "fat").
Example for "apple":
[
  {
    "name": "Apple, raw",
    "category": "Fruit",
    "commonPortions": [
      {"amount": 1, "unit": "medium", "description": "1 medium (approx 182g)"},
      {"amount": 100, "unit": "g", "description": "100 grams"},
      {"amount": 1, "unit": "cup", "description": "1 cup slices (approx 110g)"}
    ],
    "estimatedNutrition": {"calories": 95, "protein": 0.5, "carbs": 25, "fat": 0.3}
  },
  {
    "name": "Apple Juice, unsweetened",
    "category": "Beverage",
    "commonPortions": [
      {"amount": 1, "unit": "cup", "description": "1 cup (240ml)"},
      {"amount": 8, "unit": "fl oz", "description": "8 fluid ounces"}
    ],
    "estimatedNutrition": {"calories": 110, "protein": 0.2, "carbs": 28, "fat": 0.1}
  }
]
Do not include any text outside the JSON array.
`;

    logger.info(`Requesting food search from OpenAI for: "${query}"`);
    const messagesForOpenAI: ChatCompletionMessageParam[] = [ 
      { role: 'system', content: 'You are a food search engine. Provide results in JSON format.' },
      { role: 'user', content: prompt }
    ];
    // Ensure this call matches the updated signature: (messages, maxTokens, temperature, model)
    const resultString = await this.callOpenAI(messagesForOpenAI, 1000, 0.2, this.currentModel);

    try {
      const parsedResult = JSON.parse(resultString);
      return Array.isArray(parsedResult) ? parsedResult.slice(0, 8) : [];
    } catch (error) {
      logger.error('Failed to search foods with AI:', error);
      return [];
    }
  }

  async bulkLookupFoods(foodQueries: string[]): Promise<Array<{
    name: string;
    normalizedName: string;
    nutrition: any;
    confidence: number;
    weightConversion?: any;
  }>> {
    const prompt = `For each food query in the following list, provide detailed nutritional information.
Queries:
${foodQueries.map(q => `- ${q}`).join('\n')}

Return the response as a JSON array, where each element corresponds to a query and follows the structure:
{
  "name": "Original food query or most specific name found for this query",
  "normalizedName": "Normalized name of the food item (e.g., 'Apple, raw, with skin')",
  // IMPORTANT: Quantity and Unit should be derived from the original query string (e.g., "100g chicken" -> quantity:100, unit:"g")
  // If not specified in the query, you can use a default (e.g., 1 serving) but state it clearly in 'name' or 'normalizedName'.
  "quantity": <parsed or default quantity as number>, 
  "unit": "<parsed or default unit as string>",
    "nutrition": {
    "calories": <number>, "protein": <number>, "carbs": <number>, "fat": <number>, "fiber": <number>, "sugar": <number>, 
    "sodium": <number>, "potassium": <number>, "calcium": <number>, "magnesium": <number>, "phosphorus": <number>, "iron": <number>, "zinc": <number>, "selenium": <number>,
    "vitaminA": <number>, "vitaminC": <number>, "vitaminD": <number>, "vitaminE": <number>, "vitaminK": <number>,
    "thiamin": <number>, "riboflavin": <number>, "niacin": <number>, "vitaminB6": <number>, "folate": <number>, "vitaminB12": <number>,
    "biotin": <number>, "pantothenicAcid": <number>, "cholesterol": <number>, 
    "saturatedFat": <number>, "monounsaturatedFat": <number>, "polyunsaturatedFat": <number>, "transFat": <number>,
    "omega3": <number>, "omega6": <number>, "creatine": <number>
  },
  "confidence": <number between 0.0 and 1.0>,
  "weightConversion": { "grams": <number>, "ounces": <number>, "pounds": <number> } // Optional
}
Ensure all nutrient values are numbers. If unknown, use 0.
Do not include any text outside the main JSON array. Each query must have a corresponding object in the array, even if confidence is low or it's an error state (in which case nutrition can be zeros).
The order of results in the array MUST match the order of the input foodQueries.
Example for ["1 apple", "100g banana"]:
[
  { "name": "1 apple", "normalizedName": "Apple, raw, medium", "quantity": 1, "unit": "medium", "nutrition": { "calories": 95, /* ... */ }, "confidence": 0.9, /* ... */ },
  { "name": "100g banana", "normalizedName": "Banana, raw, 100g", "quantity": 100, "unit": "g", "nutrition": { "calories": 89, /* ... */ }, "confidence": 0.95, /* ... */ }
]`;

    logger.info('Requesting bulk food lookup from OpenAI.');
    const messagesForOpenAI: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are a food nutrition database. Provide detailed nutritional information in JSON array format.' },
      { role: 'user', content: prompt }
    ];
    const resultString = await this.callOpenAI(messagesForOpenAI, 3500, 0.2, this.currentModel);

    try {
      const parsedResults = JSON.parse(resultString);
      return parsedResults.map((item: any) => ({
        name: item.name || foodQueries[parsedResults.indexOf(item)],
        normalizedName: item.normalizedName || foodQueries[parsedResults.indexOf(item)].toLowerCase(),
        nutrition: {
          calories: Number(item.nutrition?.calories) || 0,
          protein: Number(item.nutrition?.protein) || 0,
          carbs: Number(item.nutrition?.carbs) || 0,
          fat: Number(item.nutrition?.fat) || 0,
          fiber: Number(item.nutrition?.fiber) || 0,
          sugar: Number(item.nutrition?.sugar) || 0,
          sodium: Number(item.nutrition?.sodium) || 0,
          potassium: Number(item.nutrition?.potassium) || 0,
          calcium: Number(item.nutrition?.calcium) || 0,
          magnesium: Number(item.nutrition?.magnesium) || 0,
          phosphorus: Number(item.nutrition?.phosphorus) || 0,
          iron: Number(item.nutrition?.iron) || 0,
          zinc: Number(item.nutrition?.zinc) || 0,
          selenium: Number(item.nutrition?.selenium) || 0,
          vitaminA: Number(item.nutrition?.vitaminA) || 0,
          vitaminC: Number(item.nutrition?.vitaminC) || 0,
          vitaminD: Number(item.nutrition?.vitaminD) || 0,
          vitaminE: Number(item.nutrition?.vitaminE) || 0,
          vitaminK: Number(item.nutrition?.vitaminK) || 0,
          thiamin: Number(item.nutrition?.thiamin) || 0,
          riboflavin: Number(item.nutrition?.riboflavin) || 0,
          niacin: Number(item.nutrition?.niacin) || 0,
          vitaminB6: Number(item.nutrition?.vitaminB6) || 0,
          folate: Number(item.nutrition?.folate) || 0,
          vitaminB12: Number(item.nutrition?.vitaminB12) || 0,
          biotin: Number(item.nutrition?.biotin) || 0,
          pantothenicAcid: Number(item.nutrition?.pantothenicAcid) || 0,
          cholesterol: Number(item.nutrition?.cholesterol) || 0,
          saturatedFat: Number(item.nutrition?.saturatedFat) || 0,
          monounsaturatedFat: Number(item.nutrition?.monounsaturatedFat) || 0,
          polyunsaturatedFat: Number(item.nutrition?.polyunsaturatedFat) || 0,
          transFat: Number(item.nutrition?.transFat) || 0,
          omega3: Number(item.nutrition?.omega3) || 0,
          omega6: Number(item.nutrition?.omega6) || 0,
          creatine: Number(item.nutrition?.creatine) || 0,
        },
        confidence: Math.min(Math.max(Number(item.confidence) || 0.8, 0), 1),
        weightConversion: item.weightConversion || undefined
      }));
    } catch (error) {
      logger.error('Bulk food lookup failed:', error);
      
      // Fallback: return empty nutrition data for each query
      return foodQueries.map(query => ({
        name: query,
        normalizedName: query.toLowerCase(),
        nutrition: {
          calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, sugar: 0,
          sodium: 0, potassium: 0, calcium: 0, magnesium: 0, phosphorus: 0,
          iron: 0, zinc: 0, selenium: 0, vitaminA: 0, vitaminC: 0, vitaminD: 0,
          vitaminE: 0, vitaminK: 0, thiamin: 0, riboflavin: 0, niacin: 0,
          vitaminB6: 0, folate: 0, vitaminB12: 0, biotin: 0, pantothenicAcid: 0,
          cholesterol: 0, saturatedFat: 0, monounsaturatedFat: 0, 
          polyunsaturatedFat: 0, transFat: 0, omega3: 0, omega6: 0,
          creatine: 0
        },
        confidence: 0.1,
        weightConversion: undefined
      }));
    }
  }

  async analyzeSupplementQuery(query: string): Promise<{
    name: string;
    brand?: string;
    dosage: number;
    unit: string;
    form: string;
    activeIngredients: string[];
    content: any;
    instructions?: string;
    notes?: string;
    confidence: number;
  }> {
    const prompt = `Analyze the supplement query: "${query}".
Identify the supplement name, brand (if specified), dosage, unit, form (e.g., tablet, powder, liquid), and key active ingredients.
Return the response as a JSON object with the following structure:
{
  "name": "Supplement Name",
  "brand": "Brand Name (optional)",
  "dosage": <number (e.g., 500)>,
  "unit": "<string (e.g., mg, IU, mcg)>",
  "form": "<string (e.g., tablet, capsule, powder)>",
  "activeIngredients": ["Ingredient1", "Ingredient2"],
  "content": {}, // Placeholder for potential future full label parsing
  "instructions": "Suggested usage instructions if inferable or commonly known (optional)",
  "notes": "Any other relevant notes or observations (optional)",
  "confidence": <number between 0.0 and 1.0 for the overall parsing accuracy>
}
Example for "Vitamin D3 5000 IU softgel by Now":
{
  "name": "Vitamin D3",
  "brand": "Now",
  "dosage": 5000,
  "unit": "IU",
  "form": "softgel",
  "activeIngredients": ["Cholecalciferol (Vitamin D3)"],
  "content": {},
  "instructions": "Take one softgel daily with a meal, or as directed by your healthcare practitioner.",
  "notes": "Commonly used for bone health and immune support.",
  "confidence": 0.9
}
Do not include any text outside the JSON object.`;

    logger.info(`Requesting supplement query analysis from OpenAI for: "${query}"`);
    const messagesForOpenAI: ChatCompletionMessageParam[] = [
      { role: 'system', content: 'You are a supplement information parser. Provide details in JSON format.' },
      { role: 'user', content: prompt }
    ];
    const resultString = await this.callOpenAI(messagesForOpenAI, 1000, 0.2, this.currentModel);

    try {
      const parsedResult = JSON.parse(resultString);
      return {
        name: parsedResult.name || query,
        brand: parsedResult.brand || undefined,
        dosage: Number(parsedResult.dosage) || 1,
        unit: parsedResult.unit || 'capsule',
        form: parsedResult.form || 'capsule',
        activeIngredients: Array.isArray(parsedResult.activeIngredients) ? parsedResult.activeIngredients : [],
        content: {
          vitaminA: Number(parsedResult.content?.vitaminA) || 0,
          vitaminC: Number(parsedResult.content?.vitaminC) || 0,
          vitaminD: Number(parsedResult.content?.vitaminD) || 0,
          vitaminE: Number(parsedResult.content?.vitaminE) || 0,
          vitaminK: Number(parsedResult.content?.vitaminK) || 0,
          thiamin: Number(parsedResult.content?.thiamin) || 0,
          riboflavin: Number(parsedResult.content?.riboflavin) || 0,
          niacin: Number(parsedResult.content?.niacin) || 0,
          vitaminB6: Number(parsedResult.content?.vitaminB6) || 0,
          folate: Number(parsedResult.content?.folate) || 0,
          vitaminB12: Number(parsedResult.content?.vitaminB12) || 0,
          biotin: Number(parsedResult.content?.biotin) || 0,
          pantothenicAcid: Number(parsedResult.content?.pantothenicAcid) || 0,
          calcium: Number(parsedResult.content?.calcium) || 0,
          magnesium: Number(parsedResult.content?.magnesium) || 0,
          iron: Number(parsedResult.content?.iron) || 0,
          zinc: Number(parsedResult.content?.zinc) || 0,
          selenium: Number(parsedResult.content?.selenium) || 0,
          potassium: Number(parsedResult.content?.potassium) || 0,
          phosphorus: Number(parsedResult.content?.phosphorus) || 0,
          sodium: Number(parsedResult.content?.sodium) || 0,
          omega3: Number(parsedResult.content?.omega3) || 0,
          omega6: Number(parsedResult.content?.omega6) || 0,
          creatine: Number(parsedResult.content?.creatine) || 0,
          coq10: Number(parsedResult.content?.coq10) || 0,
          probioticCFU: Number(parsedResult.content?.probioticCFU) || 0,
          confidence: Math.min(Math.max(Number(parsedResult.content?.confidence) || 0.8, 0), 1)
        },
        instructions: parsedResult.instructions || undefined,
        notes: parsedResult.notes || undefined,
        confidence: Math.min(Math.max(Number(parsedResult.confidence) || 0.8, 0), 1)
      };
    } catch (error) {
      logger.error('Supplement analysis failed:', error);
      
      // Fallback: return basic supplement info
      return {
        name: query,
        dosage: 1,
        unit: 'capsule',
        form: 'capsule',
        activeIngredients: [],
        content: {
          vitaminA: 0, vitaminC: 0, vitaminD: 0, vitaminE: 0, vitaminK: 0,
          thiamin: 0, riboflavin: 0, niacin: 0, vitaminB6: 0, folate: 0,
          vitaminB12: 0, biotin: 0, pantothenicAcid: 0, calcium: 0,
          magnesium: 0, iron: 0, zinc: 0, selenium: 0, potassium: 0,
          phosphorus: 0, sodium: 0, omega3: 0, omega6: 0, creatine: 0,
          coq10: 0, probioticCFU: 0, confidence: 0.1
        },
        confidence: 0.1
      };
    }
  }

  // Method to get a second opinion analysis using Gemini or OpenAI
  async getSecondOpinionAnalysis(
    nutritionData: any, 
    originalAnalysis: { insights: string[]; recommendations: string[]; summary?: string; llmModel?: string; },
    requestedSecondOpinionModel: string
  ): Promise<{ secondOpinionText: string; llmModel: string; }> {
    try {
      logger.info(`Requesting second opinion analysis using ${requestedSecondOpinionModel}.`);
      
      let independentAnalysisText: string;
      let actualModelUsed = requestedSecondOpinionModel;

      // STEP 1: Generate an independent analysis from the requested second opinion model
      const independentAnalysisPrompt = `
        You are an AI nutritionist. Based on the following nutritional data, provide your own detailed analysis.
        Focus on insights, potential deficiencies/excesses, alignment with goals, and actionable recommendations.
        Output your analysis as comprehensive raw text. Do not use JSON.

        User Profile: ${JSON.stringify(nutritionData.userProfile, null, 2)}
        Food Logs Summary (Actual Days: ${nutritionData.actualDays}, Requested: ${nutritionData.requestedDays}):
        Total Calories: ${nutritionData.totalCalories}, Protein: ${nutritionData.totalProtein}g, Carbs: ${nutritionData.totalCarbs}g, Fat: ${nutritionData.totalFat}g
        Full Food Log Details (sample):
        ${nutritionData.foodLogs?.slice(0, 3).map((log: { date: string | number | Date; mealType: any; foods: any[]; totalCalories: any; }) => `
          Date: ${new Date(log.date).toLocaleDateString()}
          Meal: ${log.mealType || 'N/A'}
          Foods: ${log.foods?.map((food: { name: any; quantity: any; unit: any; calories: any; }) => `${food.name} (${food.quantity} ${food.unit}) - ${food.calories} kcal`).join(', ') || 'N/A'}
          Total Meal Calories: ${log.totalCalories || 'N/A'}
        `).join('\n') || 'No food logs sample available.'}
        Supplement Regimens:
        ${nutritionData.supplementRegimens?.map((reg: { name: any; dosage: any; unit: any; frequency: any; }) => `${reg.name} - ${reg.dosage} ${reg.unit}, ${reg.frequency}`).join('\n') || 'None'}
        Supplement Intakes (Recent):
        ${nutritionData.supplementIntakes?.map((intake: { supplementName: any; dosage: any; unit: any; dateTaken: string | number | Date; }) => `${intake.supplementName} - ${intake.dosage} ${intake.unit} on ${new Date(intake.dateTaken).toLocaleDateString()}`).join('\n') || 'None'}
      `;

      if (requestedSecondOpinionModel.startsWith('gemini')) {
        actualModelUsed = requestedSecondOpinionModel; // Use the specific gemini model (e.g., gemini-1.5-flash-latest)
        independentAnalysisText = await this.callGemini(independentAnalysisPrompt, 2000);
      } else { // Assume OpenAI model
        const messages: ChatCompletionMessageParam[] = [
          { role: 'system', content: 'You are an AI nutritionist providing an independent detailed analysis. Respond in raw text, not JSON.' },
          { role: 'user', content: independentAnalysisPrompt }
        ];
        independentAnalysisText = await this.callOpenAI(messages, 2000, 0.5, requestedSecondOpinionModel);
        actualModelUsed = requestedSecondOpinionModel;
      }
      logger.info(`Independent analysis generated by ${actualModelUsed}. Length: ${independentAnalysisText.length}`);

      // STEP 2: Perform comparative analysis
      const comparisonPrompt = `
        You are an expert medical/nutritional analyst. You have been provided with an Original Nutritional Analysis (from ${originalAnalysis.llmModel || 'an AI'}) and a Second Independent Analysis (from ${actualModelUsed}) for the same underlying patient data.

        Your task is to write a "Second Opinion Report". This report should:
        1.  Start with an overall statement summarizing the degree of agreement or disagreement (e.g., "${actualModelUsed} largely concurs with the original analysis by ${originalAnalysis.llmModel || 'the initial AI'}, but offers additional perspectives on X and Y." or "${actualModelUsed} presents some notable differences from the original analysis by ${originalAnalysis.llmModel || 'the initial AI'}, particularly regarding Z.").
        2.  Briefly summarize the key findings/conclusions of the Original Analysis.
        3.  Briefly summarize the key findings/conclusions of the Second Independent Analysis you (or your counterpart model ${actualModelUsed}) just performed.
        4.  Critically compare them, highlighting:
            - Key areas of agreement in insights and recommendations.
            - Significant points of disagreement or differing emphasis in insights and recommendations.
            - Any unique insights or recommendations offered by one analysis but not the other.
        5.  Conclude with a short summary of the value added by this second opinion.

        Be objective and clear. Output the report as raw text.

        CONTEXTUAL DATA (DO NOT RE-ANALYZE THIS DATA, IT'S FOR REFERENCE ONLY):
        User Profile: Age ${nutritionData.userProfile?.age || 'N/A'}, Gender: ${nutritionData.userProfile?.gender || 'N/A'}, Goals: ${nutritionData.userProfile?.healthGoals?.join(', ') || 'N/A'}
        Data Period: ${nutritionData.actualDays} days of logs.

        ORIGINAL ANALYSIS (from ${originalAnalysis.llmModel || 'an AI'}):
        Summary: ${originalAnalysis.summary || 'Not provided.'}
        Insights: 
        ${originalAnalysis.insights?.map(insight => `- ${insight}`).join('\n') || 'No insights provided.'}
        Recommendations: 
        ${originalAnalysis.recommendations?.map(rec => `- ${rec}`).join('\n') || 'No recommendations provided.'}

        SECOND INDEPENDENT ANALYSIS (from ${actualModelUsed}):
        ${independentAnalysisText}
      `;
      
      let finalComparativeText: string;
      if (requestedSecondOpinionModel.startsWith('gemini')) {
        finalComparativeText = await this.callGemini(comparisonPrompt, 2500);
      } else { // Assume OpenAI model
        const messages: ChatCompletionMessageParam[] = [
          { role: 'system', content: 'You are an expert analyst comparing two nutritional reports and providing a final second opinion report. Respond in raw text, not JSON.' },
          { role: 'user', content: comparisonPrompt }
        ];
        finalComparativeText = await this.callOpenAI(messages, 2500, 0.5, requestedSecondOpinionModel);
      }
      logger.info(`Comparative analysis generated by ${actualModelUsed}. Length: ${finalComparativeText.length}`);
      
      return {
        secondOpinionText: finalComparativeText,
        llmModel: actualModelUsed, 
      };
    } catch (error: any) {
      logger.error(`Error getting second opinion analysis with ${requestedSecondOpinionModel}:`, { message: error.message });
      throw new Error(`Failed to get second opinion analysis with ${requestedSecondOpinionModel}: ${error.message}`);
    }
  }
}

export const aiService = new AIService(); 