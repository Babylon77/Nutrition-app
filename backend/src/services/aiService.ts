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

  async callOpenAI(prompt: string, maxTokens: number = 2000): Promise<string> {
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
    const supplementRegimens = nutritionData.supplementRegimens || [];
    const supplementIntakes = nutritionData.supplementIntakes || [];
    
    // Log food data for debugging
    logger.info('NUTRITION ANALYSIS DEBUG - Food data:', {
      foodLogsCount: foodLogs.length,
      totalCalories: nutritionData.totalCalories,
      totalProtein: nutritionData.totalProtein,
      totalCarbs: nutritionData.totalCarbs,
      totalFat: nutritionData.totalFat,
      supplementRegimenCount: supplementRegimens.length,
      supplementIntakeCount: supplementIntakes.length,
      foodSample: foodLogs.slice(0, 2).map((log: any) => ({
        date: log.date,
        mealType: log.mealType,
        totalCalories: log.totalCalories,
        totalProtein: log.totalProtein,
        foodsCount: log.foods?.length || 0,
        firstFood: log.foods?.[0]?.name || 'No foods'
      }))
    });
    
    const uniqueDates = [...new Set(foodLogs.map((log: any) => 
      new Date(log.date).toDateString()
    ))];
    const actualDays = uniqueDates.length;
    const dateRange = foodLogs.length > 0 ? {
      start: new Date(Math.min(...foodLogs.map((log: any) => new Date(log.date).getTime()))),
      end: new Date(Math.max(...foodLogs.map((log: any) => new Date(log.date).getTime())))
    } : null;
    
    const prompt = `
Analyze the following comprehensive nutrition data including both food intake and supplement regimens:

CALCULATED NUTRITION TOTALS (${actualDays} day${actualDays !== 1 ? 's' : ''}):
- Total Calories: ${nutritionData.totalCalories || 0} kcal (${actualDays > 0 ? Math.round((nutritionData.totalCalories || 0) / actualDays) : 0} kcal/day average)
- Total Protein: ${nutritionData.totalProtein || 0}g (${actualDays > 0 ? Math.round((nutritionData.totalProtein || 0) / actualDays) : 0}g/day average)
- Total Carbohydrates: ${nutritionData.totalCarbs || 0}g (${actualDays > 0 ? Math.round((nutritionData.totalCarbs || 0) / actualDays) : 0}g/day average)
- Total Fat: ${nutritionData.totalFat || 0}g (${actualDays > 0 ? Math.round((nutritionData.totalFat || 0) / actualDays) : 0}g/day average)
- Total Fiber: ${nutritionData.totalFiber || 0}g (${actualDays > 0 ? Math.round((nutritionData.totalFiber || 0) / actualDays) : 0}g/day average)
- Total Sugar: ${nutritionData.totalSugar || 0}g (${actualDays > 0 ? Math.round((nutritionData.totalSugar || 0) / actualDays) : 0}g/day average)
- Total Sodium: ${nutritionData.totalSodium || 0}mg (${actualDays > 0 ? Math.round((nutritionData.totalSodium || 0) / actualDays) : 0}mg/day average)
- Total Potassium: ${nutritionData.totalPotassium || 0}mg (${actualDays > 0 ? Math.round((nutritionData.totalPotassium || 0) / actualDays) : 0}mg/day average)

FOOD LOGS SUMMARY:
- Food logs analyzed: ${foodLogs.length} entries across ${actualDays} day${actualDays !== 1 ? 's' : ''}
- Date range: ${dateRange ? `${dateRange.start.toDateString()} to ${dateRange.end.toDateString()}` : 'Single day analysis'}
- Meal distribution: ${foodLogs.map((log: any) => `${log.mealType}(${log.totalCalories}cal)`).join(', ')}

USER PROFILE:
${JSON.stringify(nutritionData.userProfile, null, 2)}

SUPPLEMENT DATA:
Active Supplement Regimens: ${supplementRegimens.length} supplements
${JSON.stringify(supplementRegimens.map((reg: any) => ({
  name: reg.name,
  brand: reg.brand,
  dosage: reg.dosage,
  unit: reg.unit,
  frequency: reg.frequency,
  timeOfDay: reg.timeOfDay,
  notes: reg.notes,
  instructions: reg.instructions
})), null, 2)}

Recent Supplement Intake: ${supplementIntakes.length} recorded intakes
${JSON.stringify(supplementIntakes.map((intake: any) => ({
  supplementName: intake.supplementName,
  dosage: intake.dosage,
  unit: intake.unit,
  dateTaken: intake.dateTaken,
  timeOfDay: intake.timeOfDay
})), null, 2)}

IMPORTANT CONTEXT:
- Food data covers ${actualDays} day${actualDays !== 1 ? 's' : ''} of logging
- Date range: ${dateRange ? `${dateRange.start.toDateString()} to ${dateRange.end.toDateString()}` : 'Single day analysis'}
- User has ${supplementRegimens.length} active supplement regimens
- Recent supplement compliance: ${supplementIntakes.length} recorded intakes
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
  "summary": "A brief 2-3 sentence overview of the comprehensive nutritional status including both food and supplement intake for the ${actualDays}-day period",
  "detailedAnalysis": "A detailed 3-4 paragraph narrative analysis covering food macro/micronutrient balance, supplement regimen effectiveness, potential nutrient gaps or overlaps, overall nutritional health assessment, and integrated recommendations"
}

COMPREHENSIVE ANALYSIS FOCUS AREAS:
- Food macronutrient balance (protein, carbs, fat ratios) from dietary sources.  Use modern ratios for target weight and activity level.
- Supplement regimen effectiveness and appropriateness in the context of total nutrient intake.  
- Focus supplments analysis on immune health, gut health, and overall health.  
- Focus analysis on user's personal information, goals, allergies and dietary restrictions.  Make sure it feels personalized and tailored to the user.
- Total nutrient intake combining food + supplements (avoid double-counting)
- Potential nutrient gaps that supplements are addressing vs. remaining deficiencies
- Supplement timing and absorption optimization recommendations
- Drug-nutrient and supplement-food interactions
- Caloric intake relative to weight goals AND activity level (if specified)
- Fiber intake: adequacy, sources, and digestive health implications
- Sugar breakdown: added vs natural sugars, timing, and metabolic impact
- Micronutrient density from food sources and supplement contributions
- Meal timing and distribution throughout the day + supplement scheduling
- Hydration and electrolyte balance (sodium, potassium) from all sources
- Food variety, supplement necessity, and overall nutritional quality
- Energy balance relative to estimated needs, activity level, and weight goals

CRITICAL GUIDELINES:
- Return ONLY valid JSON, no markdown formatting or code blocks
- Confidence should be 30-50 for single day, 60-80 for 2-7 days, 80-95 for week+ data
- Provide exactly 5 insights and 5 recommendations.  
- Insights and reccomendations should be as short as possible.  Recommendations should be of the highest impact, actionable and specific.
- Use the CALCULATED NUTRITION TOTALS provided above - do not manually recalculate from raw food data
- Base your analysis on the daily averages: ${actualDays > 0 ? Math.round((nutritionData.totalCalories || 0) / actualDays) : 0} cal/day, ${actualDays > 0 ? Math.round((nutritionData.totalProtein || 0) / actualDays) : 0}g protein/day, etc.
- Consider BOTH food and supplement sources for all nutrients
- Identify any redundant supplementation or nutrient gaps
- Be specific about supplement timing and food interactions
- Include specific nutritional values and percentages when relevant
- Adapt language based on data period (daily vs weekly patterns)
- For limited data: focus on immediate actionable improvements
- For extensive data: identify trends and long-term optimization strategies
- If weight goals are specified, prioritize recommendations that support those goals
- If activity level is specified, factor it into calorie recommendations and energy balance assessments
- Address supplement-food synergies and potential conflicts. Specifically address interaction between supplements, such as vitamins and fiber.
- Recommend supplement timing optimizations (with/without food, spacing, etc.)
- Always reference the provided calculated totals, not individual food items
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
      
      logger.info('Attempting to parse AI response for comprehensive nutrition analysis...');
      const parsed = JSON.parse(cleanedResponse);
      
      // Convert confidence from percentage (0-100) to decimal (0-1)
      const confidence = typeof parsed.confidence === 'number' 
        ? Math.min(Math.max(parsed.confidence / 100, 0), 1) 
        : 0.8; // Default fallback
      
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence,
        summary: parsed.summary || 'Comprehensive nutritional analysis completed with available food and supplement data.',
        detailedAnalysis: parsed.detailedAnalysis || 'Detailed analysis includes both dietary intake and supplement regimen effectiveness. Consider working with a registered dietitian for personalized optimization.',
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error('Failed to parse AI response for comprehensive nutrition analysis:', error);
      logger.error('Raw AI response (first 500 chars):', response?.substring(0, 500));
      logger.error('Cleaned response (first 500 chars):', cleanedResponse?.substring(0, 500));
      
      // Fallback response
      return {
        insights: ['Unable to analyze comprehensive nutrition data at this time', 'Please ensure you have logged sufficient food entries', 'Consider reviewing your supplement regimen with a healthcare provider', 'Try again later or check your internet connection', 'Both food and supplement tracking contribute to optimal health'],
        recommendations: ['Log more diverse food entries for better analysis', 'Review supplement timing with meals for better absorption', 'Ensure accurate portion sizes and supplement dosages', 'Try again in a few minutes', 'Consider consulting with a registered dietitian'],
        confidence: 0.1,
        summary: 'Comprehensive analysis temporarily unavailable due to technical issues.',
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
    const bloodworkEntries = Array.isArray(bloodworkData.bloodwork) ? bloodworkData.bloodwork : [bloodworkData.bloodwork];
    const entryCount = bloodworkEntries.length;
    const isMultipleTests = entryCount > 1;
    
    const prompt = `
Analyze the following comprehensive bloodwork data ${isMultipleTests ? `across ${entryCount} test results` : 'from a single test'} and provide detailed health insights and recommendations:

BLOODWORK DATA (${entryCount} ${entryCount === 1 ? 'entry' : 'entries'}):
${JSON.stringify(bloodworkEntries.map((entry: any) => ({
  testDate: entry.testDate,
  labName: entry.labName,
  doctorName: entry.doctorName,
  labValues: entry.labValues.map((lab: any) => ({
    name: lab.name,
    value: lab.value,
    unit: lab.unit,
    referenceRange: lab.referenceRange,
    status: lab.status
  }))
})), null, 2)}

USER PROFILE:
${JSON.stringify(bloodworkData.userProfile, null, 2)}

${isMultipleTests ? `
TREND ANALYSIS CONTEXT:
- Multiple test results available spanning from ${new Date(bloodworkEntries[bloodworkEntries.length - 1].testDate).toDateString()} to ${new Date(bloodworkEntries[0].testDate).toDateString()}
- Focus on trends, improvements, and changes over time
- Identify patterns and trajectory of key biomarkers
- Consider whether values are moving in positive or negative directions
- Assess effectiveness of any interventions between tests
` : `
SINGLE TEST ANALYSIS CONTEXT:
- Single test result analysis
- Focus on current status relative to reference ranges
- Provide baseline assessment for future monitoring
- Recommend appropriate follow-up timing
`}

Please provide a JSON response with the following structure:
{
  "insights": ["insight1", "insight2", "insight3", "insight4", "insight5"],
  "recommendations": ["recommendation1", "recommendation2", "recommendation3", "recommendation4", "recommendation5"],
  "confidence": 85,
  "summary": "A brief 2-3 sentence overview of the ${isMultipleTests ? 'bloodwork trends and' : ''} overall health status ${isMultipleTests ? 'across multiple tests' : 'from this test'}",
  "detailedAnalysis": "A detailed 3-4 paragraph narrative analysis covering lab value interpretation${isMultipleTests ? ', trends over time' : ''}, risk factors, health implications with specific reference ranges and ${isMultipleTests ? 'trend-based' : ''} recommendations"
}

Important: 
- Return ONLY valid JSON, no markdown formatting or code blocks
- Confidence should be a number between 0-100 (percentage)
- ${isMultipleTests ? 'Higher confidence due to multiple data points and trend analysis' : 'Moderate confidence based on single test result'}
- Provide exactly 5 insights and 5 recommendations
- Focus on lab values${isMultipleTests ? ', trends,' : ''} and health implications
- Be specific and actionable in your recommendations
- Your analysis should be cutting edge and up to date.  Use the latest research and evidence based practices.
- You should critically evaluate the data and provide a detailed analysis of the data.  Do not just provide a summary of the data.
- Identify the impact of confounding factors, such as age, gender, weight, and also multiplicative effects to risk factors.  For example, if a user is has high LDL, and Lipoprotein(a) is high, then the impact of LDL is amplified.
- Include specific lab values and reference ranges when relevant
- ${isMultipleTests ? 'Emphasize trend analysis and changes over time' : 'Focus on current status and future monitoring'}
- Always recommend consulting healthcare professionals for medical advice
- Summary should highlight key findings${isMultipleTests ? ' and trends' : ''}
- Detailed analysis should be educational and comprehensive${isMultipleTests ? ' with trend interpretation' : ''}
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
      
      logger.info(`Attempting to parse AI response for ${isMultipleTests ? 'multi-test' : 'single'} bloodwork analysis...`);
      const parsed = JSON.parse(cleanedResponse);
      
      // Convert confidence from percentage (0-100) to decimal (0-1)
      // Higher confidence for multiple tests due to trend data
      const baseConfidence = typeof parsed.confidence === 'number' ? parsed.confidence : (isMultipleTests ? 85 : 75);
      const confidence = Math.min(Math.max(baseConfidence / 100, 0), 1);
      
      return {
        insights: Array.isArray(parsed.insights) ? parsed.insights.slice(0, 5) : ['Unable to generate insights'],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations.slice(0, 5) : ['Unable to generate recommendations'],
        confidence,
        summary: parsed.summary || `${isMultipleTests ? 'Multi-test' : 'Single'} bloodwork analysis completed with available data.`,
        detailedAnalysis: parsed.detailedAnalysis || `Detailed ${isMultipleTests ? 'trend' : 'bloodwork'} analysis is currently unavailable. Please consult with a healthcare professional for proper interpretation.`,
        llmModel: this.currentModel
      };
    } catch (error) {
      logger.error(`Failed to parse AI response for ${isMultipleTests ? 'multi-test' : 'single'} bloodwork analysis:`, error);
      logger.error('Raw AI response (first 500 chars):', response?.substring(0, 500));
      logger.error('Cleaned response (first 500 chars):', cleanedResponse?.substring(0, 500));
      
      // Fallback response
      return {
        insights: ['Unable to analyze bloodwork data at this time', `${isMultipleTests ? 'Multiple test results' : 'Lab values'} appear to be documented`, 'Professional interpretation recommended', 'Regular monitoring is important', 'Follow up with healthcare provider'],
        recommendations: ['Consult with a healthcare professional for proper interpretation', 'Discuss any abnormal values with your doctor', 'Maintain regular health checkups', 'Keep a record of all lab results', 'Follow prescribed treatment plans'],
        confidence: 0.1,
        summary: `${isMultipleTests ? 'Multi-test' : 'Single'} bloodwork analysis temporarily unavailable due to technical issues.`,
        detailedAnalysis: `We were unable to generate a detailed ${isMultipleTests ? 'trend-based ' : ''}bloodwork analysis at this time. This may be due to technical issues or service limitations. For proper medical interpretation of your lab results${isMultipleTests ? ' and trends over time' : ''}, it is essential to consult with a qualified healthcare professional who can provide personalized medical advice based on your complete health history, current symptoms, and individual risk factors. Never rely solely on automated analysis for medical decisions.`,
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
- Provide exactly 5 insights and 5 recommendations. Keep insights and recommendations short and concise.  
- Recommendations should be of the highest impact, actionable and specific. They should focus on actions the user can take to improve their health.
- Focus on correlations between diet and lab values
- Be specific and actionable in your recommendations.  Recommendations should be of the highest impact, actionable and specific.
- Include specific nutritional values and lab results when relevant
- Explain potential mechanisms behind correlations.  Search deep and look for all confounding factors, multiplicative effects, and other factors that could be influencing the correlation.
- Summary should highlight the most significant correlations
- Detailed analysis should be scientifically grounded and educational, but based on modern research and evidence based practices.  
- Do not make up information, but be bold, while explaining uncertainty.  
- When there are debates in the literature, explain the debate and provide your own opinion.  Do not just say "there is no evidence to support this" or "there is evidence to support this".  Explain the evidence and your opinion.
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
    const prompt = `
You are a supplement and medication expert. Analyze the following supplement query and provide detailed information.

Query: "${query}"

Extract or estimate the following information:
1. Supplement name (standardized)
2. Brand (if mentioned)
3. Dosage amount and unit
4. Form (capsule, tablet, liquid, powder, gummy, injection, patch, other)
5. Active ingredients list
6. Nutritional/supplement content (vitamins, minerals, compounds)
7. Instructions (if any - "take with food", etc.)
8. Notes: Include helpful information about primary uses, benefits, potential side effects, and other important details
9. Confidence in analysis (0-1)

Return ONLY valid JSON in this exact format:
{
  "name": "Vitamin D3",
  "brand": "Nature Made",
  "dosage": 2000,
  "unit": "IU",
  "form": "capsule",
  "activeIngredients": ["Cholecalciferol"],
  "content": {
    "vitaminD": 2000,
    "calcium": 0,
    "magnesium": 0,
    "vitaminK": 0,
    "omega3": 0,
    "probioticCFU": 0,
    "coq10": 0,
    "creatine": 0
  },
  "instructions": "Take with food for better absorption",
  "notes": "Supports bone health, immune function, and muscle strength. Helps with calcium absorption. May improve mood and reduce inflammation. Best taken with fatty foods. Deficiency is common, especially in winter months.",
  "confidence": 0.9
}

For content values:
- Use 0 for nutrients not present in the supplement
- Include values in standard units (mg, mcg, IU as appropriate)
- Common supplement compounds: vitaminA, vitaminC, vitaminD, vitaminE, vitaminK, thiamin, riboflavin, niacin, vitaminB6, folate, vitaminB12, biotin, pantothenicAcid, calcium, magnesium, iron, zinc, selenium, potassium, phosphorus, sodium, omega3, omega6, creatine, coq10, probioticCFU

For notes, include:
- Primary uses and health benefits
- Common dosage recommendations
- Best time to take or absorption tips
- Potential interactions or contraindications
- Who might benefit most from this supplement

If the query is unclear or insufficient, make reasonable assumptions but lower the confidence score.
    `;

    try {
      const response = await this.callOpenAI(prompt, 1000);
      
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
      
      // Validate and normalize the response
      return {
        name: parsed.name || query,
        brand: parsed.brand || undefined,
        dosage: Number(parsed.dosage) || 1,
        unit: parsed.unit || 'capsule',
        form: parsed.form || 'capsule',
        activeIngredients: Array.isArray(parsed.activeIngredients) ? parsed.activeIngredients : [],
        content: {
          vitaminA: Number(parsed.content?.vitaminA) || 0,
          vitaminC: Number(parsed.content?.vitaminC) || 0,
          vitaminD: Number(parsed.content?.vitaminD) || 0,
          vitaminE: Number(parsed.content?.vitaminE) || 0,
          vitaminK: Number(parsed.content?.vitaminK) || 0,
          thiamin: Number(parsed.content?.thiamin) || 0,
          riboflavin: Number(parsed.content?.riboflavin) || 0,
          niacin: Number(parsed.content?.niacin) || 0,
          vitaminB6: Number(parsed.content?.vitaminB6) || 0,
          folate: Number(parsed.content?.folate) || 0,
          vitaminB12: Number(parsed.content?.vitaminB12) || 0,
          biotin: Number(parsed.content?.biotin) || 0,
          pantothenicAcid: Number(parsed.content?.pantothenicAcid) || 0,
          calcium: Number(parsed.content?.calcium) || 0,
          magnesium: Number(parsed.content?.magnesium) || 0,
          iron: Number(parsed.content?.iron) || 0,
          zinc: Number(parsed.content?.zinc) || 0,
          selenium: Number(parsed.content?.selenium) || 0,
          potassium: Number(parsed.content?.potassium) || 0,
          phosphorus: Number(parsed.content?.phosphorus) || 0,
          sodium: Number(parsed.content?.sodium) || 0,
          omega3: Number(parsed.content?.omega3) || 0,
          omega6: Number(parsed.content?.omega6) || 0,
          creatine: Number(parsed.content?.creatine) || 0,
          coq10: Number(parsed.content?.coq10) || 0,
          probioticCFU: Number(parsed.content?.probioticCFU) || 0,
          confidence: Math.min(Math.max(Number(parsed.content?.confidence) || 0.8, 0), 1)
        },
        instructions: parsed.instructions || undefined,
        notes: parsed.notes || undefined,
        confidence: Math.min(Math.max(Number(parsed.confidence) || 0.8, 0), 1)
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
}

export const aiService = new AIService(); 