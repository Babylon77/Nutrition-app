import OpenAI from 'openai';
import { logger } from '../utils/logger';
import { IFoodLog } from '../models/FoodLog';
import { IBloodwork } from '../models/Bloodwork';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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

  private async callOpenAI(prompt: string, maxTokens: number = 2000): Promise<string> {
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
        model: this.currentModel,
        messages: [
          {
            role: 'system',
            content: 'You are a qualified nutritionist and health analyst. Provide evidence-based, actionable insights about nutrition and health data. Always include disclaimers about consulting healthcare professionals for medical advice.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: maxTokens,
        temperature: 0.3,
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

  async analyzeNutrition(nutritionData: any): Promise<{
    insights: string[];
    recommendations: string[];
    confidence: number;
    summary: string;
    detailedAnalysis: string;
    llmModel: string;
  }> {
    // Calculate actual data period by counting unique dates
    const foodLogs = nutritionData.foodLogs || [];
    const uniqueDates = [...new Set(foodLogs.map((log: any) => 
      new Date(log.date).toDateString()
    ))];
    const actualDays = uniqueDates.length;
    const dateRange = foodLogs.length > 0 ? {
      start: new Date(Math.min(...foodLogs.map((log: any) => new Date(log.date).getTime()))),
      end: new Date(Math.max(...foodLogs.map((log: any) => new Date(log.date).getTime())))
    } : null;
    
    const prompt = `
Analyze the following nutrition data and provide comprehensive insights and recommendations:

${JSON.stringify(nutritionData, null, 2)}

IMPORTANT CONTEXT:
- Data covers ${actualDays} day${actualDays !== 1 ? 's' : ''} of food logging
- Date range: ${dateRange ? `${dateRange.start.toDateString()} to ${dateRange.end.toDateString()}` : 'Single day analysis'}
- Adjust analysis depth and confidence based on available data period
- For single-day analysis: focus on daily patterns and immediate recommendations
- For multi-day analysis: identify trends and patterns over time

${nutritionData.userProfile?.activityLevel ? `
ACTIVITY LEVEL CONTEXT:
- User's activity level: ${nutritionData.userProfile.activityLevel}
- Factor this specific activity level into your calorie recommendations
- Use appropriate activity multipliers: sedentary (1.15), lightly_active (1.3), moderately_active (1.45), very_active (1.6), extra_active (1.75)
- Calorie needs should be based on BMR × activity multiplier
` : ''}

${nutritionData.userProfile?.weightGoal && nutritionData.userProfile?.weight && nutritionData.userProfile?.weightGoalTimeframe ? `
WEIGHT GOAL CONTEXT:
- Current weight: ${(nutritionData.userProfile.weight * 2.20462).toFixed(1)} lbs
- Target weight: ${nutritionData.userProfile.weightGoal} lbs
- Timeline: ${nutritionData.userProfile.weightGoalTimeframe} weeks
- Weight change needed: ${((nutritionData.userProfile.weight * 2.20462) - nutritionData.userProfile.weightGoal).toFixed(1)} lbs
- Rate needed: ${(((nutritionData.userProfile.weight * 2.20462) - nutritionData.userProfile.weightGoal) / nutritionData.userProfile.weightGoalTimeframe).toFixed(1)} lbs/week
- Factor this weight goal into your calorie and macronutrient recommendations
- Assess whether current intake aligns with weight goal objectives
- Use conservative BMR calculations and realistic activity level estimates
- Cap recommendations at 2 lbs/week weight loss maximum for safety
- For sustainable weight loss, recommend 1-2 lbs/week (deficit of 500-1000 calories/day)
` : ''}

Please provide a JSON response with the following structure:
{
  "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
  "confidence": 85,
  "summary": "A brief 2-3 sentence overview of the nutritional status for the ${actualDays}-day period",
  "detailedAnalysis": "A detailed 3-4 paragraph narrative analysis covering macro/micronutrient balance, fiber and sugar intake patterns, meal timing, potential deficiencies, and overall nutritional health assessment"
}

ANALYSIS FOCUS AREAS:
- Macronutrient balance (protein, carbs, fat ratios)
- Caloric intake relative to weight goals AND activity level (if specified)
- Fiber intake: adequacy, sources, and digestive health implications
- Sugar breakdown: added vs natural sugars, timing, and metabolic impact
- Micronutrient density and potential gaps (vitamins, minerals)
- Meal timing and distribution throughout the day
- Hydration and electrolyte balance (sodium, potassium)
- Food variety and nutritional quality
- Energy balance relative to estimated needs, activity level, and weight goals

IMPORTANT GUIDELINES:
- Return ONLY valid JSON, no markdown formatting or code blocks
- Confidence should be 30-50 for single day, 60-80 for 2-7 days, 80-95 for week+ data
- Provide exactly 5 insights and 5 recommendations
- Be specific about fiber and sugar intake (separate from total carbs)
- Include specific nutritional values and percentages when relevant
- Adapt language based on data period (daily vs weekly patterns)
- For limited data: focus on immediate actionable improvements
- For extensive data: identify trends and long-term optimization strategies
- If weight goals are specified, prioritize recommendations that support those goals
- If activity level is specified, factor it into calorie recommendations and energy balance assessments
`;

    let response: string = '';
    let cleanedResponse: string = '';
    
    try {
      response = await this.callOpenAI(prompt, 2500);
      
      // Enhanced JSON extraction and cleaning
      cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }
      
      // Remove control characters that can break JSON parsing
      cleanedResponse = cleanedResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Try to find valid JSON structure
      let jsonStartIndex = cleanedResponse.indexOf('{');
      let jsonEndIndex = cleanedResponse.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanedResponse = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      logger.info('Attempting to parse AI response for nutrition analysis...');
      const parsed = JSON.parse(cleanedResponse);
      
      // Convert confidence from percentage (0-100) to decimal (0-1)
      const confidence = typeof parsed.confidence === 'number' 
        ? Math.min(Math.max(parsed.confidence / 100, 0), 1) 
        : 0.8; // Default fallback
      
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence,
        summary: parsed.summary || 'Nutritional analysis completed with available data.',
        detailedAnalysis: parsed.detailedAnalysis || 'Detailed analysis is currently unavailable. Please ensure sufficient nutritional data is logged for comprehensive insights.',
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error('Failed to parse AI response for nutrition analysis:', error);
      logger.error('Raw AI response (first 500 chars):', response?.substring(0, 500));
      logger.error('Cleaned response (first 500 chars):', cleanedResponse?.substring(0, 500));
      
      // Fallback response
      return {
        insights: ['Unable to analyze nutrition data at this time', 'Please ensure you have logged sufficient food entries', 'Try again later or consult with a nutritionist', 'Check your internet connection', 'Consider upgrading your analysis plan'],
        recommendations: ['Log more diverse food entries for better analysis', 'Include all meals and snacks in your food diary', 'Ensure accurate portion sizes', 'Try again in a few minutes', 'Contact support if the issue persists'],
        confidence: 0.1,
        summary: 'Analysis temporarily unavailable due to technical issues.',
        detailedAnalysis: 'We were unable to generate a detailed nutritional analysis at this time. This may be due to insufficient data, temporary service issues, or connectivity problems. Please ensure you have logged at least 3-7 days of comprehensive food entries including all meals and snacks with accurate portion sizes. If you continue to experience issues, please try again later or contact our support team.',
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
    const prompt = `
Analyze the following bloodwork data and provide comprehensive health insights and recommendations:

${JSON.stringify(bloodworkData, null, 2)}

Please provide a JSON response with the following structure:
{
  "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
  "confidence": 85,
  "summary": "A brief 2-3 sentence overview of the bloodwork results and overall health status",
  "detailedAnalysis": "A detailed 3-4 paragraph narrative analysis covering lab value interpretation, trends, risk factors, and health implications with specific reference ranges and recommendations"
}

Important: 
- Return ONLY valid JSON, no markdown formatting or code blocks
- Confidence should be a number between 0-100 (percentage)
- Provide exactly 5 insights and 5 recommendations
- Focus on lab values, trends, and health implications
- Be specific and actionable in your recommendations
- Include specific lab values and reference ranges when relevant
- Always recommend consulting healthcare professionals for medical advice
- Summary should highlight key findings
- Detailed analysis should be educational and comprehensive
`;

    let response: string = '';
    let cleanedResponse: string = '';
    
    try {
      response = await this.callOpenAI(prompt, 2500);
      
      // Enhanced JSON extraction and cleaning
      cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }
      
      // Remove control characters that can break JSON parsing
      cleanedResponse = cleanedResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Try to find valid JSON structure
      let jsonStartIndex = cleanedResponse.indexOf('{');
      let jsonEndIndex = cleanedResponse.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanedResponse = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      logger.info('Attempting to parse AI response for bloodwork analysis...');
      const parsed = JSON.parse(cleanedResponse);
      
      // Convert confidence from percentage (0-100) to decimal (0-1)
      const confidence = typeof parsed.confidence === 'number' 
        ? Math.min(Math.max(parsed.confidence / 100, 0), 1) 
        : 0.8; // Default fallback
      
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence,
        summary: parsed.summary || 'Bloodwork analysis completed with available data.',
        detailedAnalysis: parsed.detailedAnalysis || 'Detailed bloodwork analysis is currently unavailable. Please consult with a healthcare professional for proper interpretation.',
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error('Failed to parse AI response for bloodwork analysis:', error);
      logger.error('Raw AI response (first 500 chars):', response?.substring(0, 500));
      logger.error('Cleaned response (first 500 chars):', cleanedResponse?.substring(0, 500));
      
      // Fallback response
      return {
        insights: ['Unable to analyze bloodwork data at this time', 'Most lab values appear to be documented', 'Professional interpretation recommended', 'Regular monitoring is important', 'Follow up with healthcare provider'],
        recommendations: ['Consult with a healthcare professional for proper interpretation', 'Discuss any abnormal values with your doctor', 'Maintain regular health checkups', 'Keep a record of all lab results', 'Follow prescribed treatment plans'],
        confidence: 0.1,
        summary: 'Bloodwork analysis temporarily unavailable due to technical issues.',
        detailedAnalysis: 'We were unable to generate a detailed bloodwork analysis at this time. This may be due to technical issues or service limitations. For proper medical interpretation of your lab results, it is essential to consult with a qualified healthcare professional who can provide personalized medical advice based on your complete health history, current symptoms, and individual risk factors. Never rely solely on automated analysis for medical decisions.',
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
    const prompt = `
Analyze the correlation between the following nutrition and bloodwork data to identify relationships and provide comprehensive recommendations:

Nutrition Data:
${JSON.stringify(nutritionData, null, 2)}

Bloodwork Data:
${JSON.stringify(bloodworkData, null, 2)}

Please provide a JSON response with the following structure:
{
  "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
  "confidence": 85,
  "summary": "A brief 2-3 sentence overview of key correlations found between nutrition and bloodwork",
  "detailedAnalysis": "A detailed 3-4 paragraph narrative analysis exploring specific correlations between dietary patterns and lab values, potential causal relationships, and evidence-based dietary interventions that could improve biomarkers"
}

Important: 
- Return ONLY valid JSON, no markdown formatting or code blocks
- Confidence should be a number between 0-100 (percentage)
- Provide exactly 5 insights and 5 recommendations
- Focus on correlations between diet and lab values
- Be specific and actionable in your recommendations
- Include specific nutritional values and lab results when relevant
- Explain potential mechanisms behind correlations
- Summary should highlight the most significant correlations
- Detailed analysis should be scientifically grounded and educational
`;

    let response: string = '';
    let cleanedResponse: string = '';
    
    try {
      response = await this.callOpenAI(prompt, 2500);
      
      // Enhanced JSON extraction and cleaning
      cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }
      
      // Remove control characters that can break JSON parsing
      cleanedResponse = cleanedResponse.replace(/[\x00-\x1F\x7F-\x9F]/g, '');
      
      // Try to find valid JSON structure
      let jsonStartIndex = cleanedResponse.indexOf('{');
      let jsonEndIndex = cleanedResponse.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanedResponse = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      logger.info('Attempting to parse AI response for correlation analysis...');
      const parsed = JSON.parse(cleanedResponse);
      
      // Convert confidence from percentage (0-100) to decimal (0-1)
      const confidence = typeof parsed.confidence === 'number' 
        ? Math.min(Math.max(parsed.confidence / 100, 0), 1) 
        : 0.8; // Default fallback
      
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence,
        summary: parsed.summary || 'Correlation analysis completed with available data.',
        detailedAnalysis: parsed.detailedAnalysis || 'Detailed correlation analysis is currently unavailable. Please ensure sufficient nutrition and bloodwork data is available.',
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error('Failed to parse AI response for correlation analysis:', error);
      logger.error('Raw AI response (first 500 chars):', response?.substring(0, 500));
      logger.error('Cleaned response (first 500 chars):', cleanedResponse?.substring(0, 500));
      
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
    const prompt = `
You are a nutrition expert with comprehensive knowledge of food composition. Analyze the following food item and provide detailed nutritional information including weight conversion.

Food Item: "${foodQuery}"
Quantity: ${quantity}
Unit: ${unit}

Please provide a JSON response with comprehensive nutritional data per the specified quantity and unit. Focus on accuracy and include all available micronutrients important for:
- Hydration and electrolyte balance (sodium, potassium, magnesium)
- Metabolic health (B-vitamins, chromium, magnesium)
- Lipid profile and cardiovascular health (omega-3s, fiber, detailed fat breakdown)
- Immune system function (vitamins A, C, D, E, zinc, selenium)
- Performance and muscle health (creatine for applicable foods)

For non-weight based units (serving, cup, slice, etc.), provide weight conversion estimates.

Return ONLY valid JSON in this exact format:
{
  "name": "Original food name as entered",
  "normalizedName": "Standardized food name",
  "quantity": ${quantity},
  "unit": "${unit}",
  "nutrition": {
    "calories": 0,
    "protein": 0,
    "carbs": 0,
    "fat": 0,
    "fiber": 0,
    "sugar": 0,
    "sodium": 0,
    "potassium": 0,
    "calcium": 0,
    "magnesium": 0,
    "phosphorus": 0,
    "iron": 0,
    "zinc": 0,
    "selenium": 0,
    "vitaminA": 0,
    "vitaminC": 0,
    "vitaminD": 0,
    "vitaminE": 0,
    "vitaminK": 0,
    "thiamin": 0,
    "riboflavin": 0,
    "niacin": 0,
    "vitaminB6": 0,
    "folate": 0,
    "vitaminB12": 0,
    "biotin": 0,
    "pantothenicAcid": 0,
    "cholesterol": 0,
    "saturatedFat": 0,
    "monounsaturatedFat": 0,
    "polyunsaturatedFat": 0,
    "transFat": 0,
    "omega3": 0,
    "omega6": 0,
    "creatine": 0
  },
  "confidence": 85,
  "weightConversion": {
    "grams": 150,
    "ounces": 5.3,
    "pounds": 0.33
  }
}

Units reference:
- Macronutrients: grams (g) except calories (kcal)
- Vitamins: mcg (micrograms) except Vitamin C, E, K, Niacin (mg)
- Minerals: mg (milligrams) except selenium (mcg)
- Creatine: grams (g) - only include if the food naturally contains creatine (meat, fish)
- Weight conversion: only include if unit is NOT already weight-based (g, kg, oz, lb)
- Confidence: 0-100 percentage

Be accurate with portion sizes and provide realistic nutritional values. If the food item is ambiguous, make reasonable assumptions and adjust confidence accordingly.
`;

    let response: string = '';
    let cleanedResponse: string = '';
    
    try {
      response = await this.callOpenAI(prompt, 1500);
      
      // Simple JSON extraction and cleaning
      cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      // Validate and ensure all required fields exist
      const nutrition = {
        calories: Number(parsed.nutrition?.calories) || 0,
        protein: Number(parsed.nutrition?.protein) || 0,
        carbs: Number(parsed.nutrition?.carbs) || 0,
        fat: Number(parsed.nutrition?.fat) || 0,
        fiber: Number(parsed.nutrition?.fiber) || 0,
        sugar: Number(parsed.nutrition?.sugar) || 0,
        sodium: Number(parsed.nutrition?.sodium) || 0,
        potassium: Number(parsed.nutrition?.potassium) || 0,
        calcium: Number(parsed.nutrition?.calcium) || 0,
        magnesium: Number(parsed.nutrition?.magnesium) || 0,
        phosphorus: Number(parsed.nutrition?.phosphorus) || 0,
        iron: Number(parsed.nutrition?.iron) || 0,
        zinc: Number(parsed.nutrition?.zinc) || 0,
        selenium: Number(parsed.nutrition?.selenium) || 0,
        vitaminA: Number(parsed.nutrition?.vitaminA) || 0,
        vitaminC: Number(parsed.nutrition?.vitaminC) || 0,
        vitaminD: Number(parsed.nutrition?.vitaminD) || 0,
        vitaminE: Number(parsed.nutrition?.vitaminE) || 0,
        vitaminK: Number(parsed.nutrition?.vitaminK) || 0,
        thiamin: Number(parsed.nutrition?.thiamin) || 0,
        riboflavin: Number(parsed.nutrition?.riboflavin) || 0,
        niacin: Number(parsed.nutrition?.niacin) || 0,
        vitaminB6: Number(parsed.nutrition?.vitaminB6) || 0,
        folate: Number(parsed.nutrition?.folate) || 0,
        vitaminB12: Number(parsed.nutrition?.vitaminB12) || 0,
        biotin: Number(parsed.nutrition?.biotin) || 0,
        pantothenicAcid: Number(parsed.nutrition?.pantothenicAcid) || 0,
        cholesterol: Number(parsed.nutrition?.cholesterol) || 0,
        saturatedFat: Number(parsed.nutrition?.saturatedFat) || 0,
        monounsaturatedFat: Number(parsed.nutrition?.monounsaturatedFat) || 0,
        polyunsaturatedFat: Number(parsed.nutrition?.polyunsaturatedFat) || 0,
        transFat: Number(parsed.nutrition?.transFat) || 0,
        omega3: Number(parsed.nutrition?.omega3) || 0,
        omega6: Number(parsed.nutrition?.omega6) || 0,
        creatine: Number(parsed.nutrition?.creatine) || 0,
      };
      
      return {
        name: parsed.name || foodQuery,
        normalizedName: parsed.normalizedName || foodQuery,
        quantity: Number(parsed.quantity) || quantity,
        unit: parsed.unit || unit,
        nutrition,
        confidence: Math.min(Math.max(Number(parsed.confidence) || 80, 0), 100) / 100,
        weightConversion: parsed.weightConversion || undefined
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
    if (!query.trim()) {
      return [];
    }

    const prompt = `
You are a food database expert. Provide a list of the most relevant food items matching the search query "${query}".

Return exactly 5-8 food suggestions in JSON format. Include common portion sizes and basic nutrition estimates.

Return ONLY valid JSON in this format:
[
  {
    "name": "Food name",
    "category": "Food category (e.g., 'Fruits', 'Vegetables', 'Proteins', 'Grains', 'Dairy', 'Snacks')",
    "commonPortions": [
      {"amount": 1, "unit": "medium", "description": "1 medium apple"},
      {"amount": 100, "unit": "g", "description": "100g raw"},
      {"amount": 1, "unit": "cup", "description": "1 cup sliced"}
    ],
    "estimatedNutrition": {
      "calories": 52,
      "protein": 0.3,
      "carbs": 14,
      "fat": 0.2
    }
  }
]

Focus on:
- Exact matches first, then similar foods
- Include brand names if relevant
- Provide realistic portion sizes
- Estimate nutrition per 100g or common serving
`;

    let response: string = '';
    
    try {
      response = await this.callOpenAI(prompt, 1000);
      
      let cleanedResponse = response.trim();
      
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }
      
      const parsed = JSON.parse(cleanedResponse);
      return Array.isArray(parsed) ? parsed.slice(0, 8) : [];
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
    if (foodQueries.length === 0) {
      return [];
    }

    const prompt = `
You are a nutrition expert with comprehensive knowledge of food composition. Analyze the following list of food items and provide detailed nutritional information for each one.

Food Items to Analyze:
${foodQueries.map((query, index) => `${index + 1}. ${query}`).join('\n')}

IMPORTANT: Return a JSON array with nutritional data for each food item in the EXACT same order as listed above.

For each food item, provide:
1. Standardized name
2. Complete nutritional breakdown (same format as single food analysis)
3. Confidence score (0-1)

Return ONLY a valid JSON array like this:
[
  {
    "name": "Grilled Chicken Breast",
    "normalizedName": "grilled chicken breast",
    "nutrition": {
      "calories": 231,
      "protein": 43.5,
      "carbs": 0,
      "fat": 5.0,
      "fiber": 0,
      "sugar": 0,
      "sodium": 104,
      "potassium": 421,
      "calcium": 15,
      "magnesium": 32,
      "phosphorus": 229,
      "iron": 1.04,
      "zinc": 1.09,
      "selenium": 30.6,
      "vitaminA": 16,
      "vitaminC": 2.4,
      "vitaminD": 0.3,
      "vitaminE": 0.27,
      "vitaminK": 2.4,
      "thiamin": 0.087,
      "riboflavin": 0.166,
      "niacin": 14.772,
      "vitaminB6": 0.862,
      "folate": 4,
      "vitaminB12": 0.34,
      "biotin": 10.4,
      "pantothenicAcid": 1.329,
      "cholesterol": 104,
      "saturatedFat": 1.35,
      "monounsaturatedFat": 1.84,
      "polyunsaturatedFat": 1.08,
      "transFat": 0.04,
      "omega3": 0.08,
      "omega6": 0.85,
      "creatine": 0.4
    },
    "confidence": 0.95,
    "weightConversion": {
      "grams": 172,
      "ounces": 6.07,
      "pounds": 0.38
    }
  }
]

Ensure the array has exactly ${foodQueries.length} items in the same order as the input list.
    `;

    try {
      const response = await this.callOpenAI(prompt, 3000);
      
      let cleanedResponse = response.trim();
      
      // Remove markdown code blocks if present
      if (cleanedResponse.includes('```json')) {
        const jsonMatch = cleanedResponse.match(/```json\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      } else if (cleanedResponse.includes('```')) {
        const jsonMatch = cleanedResponse.match(/```\s*([\s\S]*?)\s*```/);
        if (jsonMatch) {
          cleanedResponse = jsonMatch[1].trim();
        }
      }

      const parsed = JSON.parse(cleanedResponse);
      
      if (!Array.isArray(parsed)) {
        throw new Error('Expected array response');
      }

      // Ensure we have the right number of results
      if (parsed.length !== foodQueries.length) {
        throw new Error(`Expected ${foodQueries.length} results, got ${parsed.length}`);
      }

      // Validate and normalize each result
      return parsed.map((item, index) => ({
        name: item.name || foodQueries[index],
        normalizedName: item.normalizedName || foodQueries[index].toLowerCase(),
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
}

export const aiService = new AIService(); 