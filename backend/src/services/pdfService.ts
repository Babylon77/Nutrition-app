import fs from 'fs';
import path from 'path';
import pdfParse from 'pdf-parse';
import { logger } from '../utils/logger';
import { ILabValue } from '../models/Bloodwork';
import { aiService } from './aiService';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export interface ParsedLabResult {
  labValues: ILabValue[];
  rawText: string;
  confidence: number;
  extractionMethod: 'ai' | 'regex' | 'mock';
  metadata?: {
    testDate?: string;
    labName?: string;
    doctorName?: string;
  };
}

class PDFService {
  async parsePDF(filePath: string): Promise<ParsedLabResult> {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      
      const rawText = pdfData.text;
      
      // First try AI-powered extraction
      let labValues: ILabValue[] = [];
      let extractionMethod: 'ai' | 'regex' | 'mock' = 'regex';
      let confidence = 0;
      let metadata: { testDate?: string; labName?: string; doctorName?: string } | undefined;
      
      try {
        const aiResult = await this.extractLabValuesWithAI(rawText);
        if (aiResult.labValues.length > 0) {
          labValues = aiResult.labValues;
          confidence = aiResult.confidence;
          metadata = aiResult.metadata;
          extractionMethod = 'ai';
          logger.info(`AI extraction successful: ${labValues.length} lab values found`);
          if (metadata?.testDate) logger.info(`Extracted test date: ${metadata.testDate}`);
          if (metadata?.labName) logger.info(`Extracted lab name: ${metadata.labName}`);
          if (metadata?.doctorName) logger.info(`Extracted doctor: ${metadata.doctorName}`);
        }
      } catch (aiError) {
        logger.warn('AI extraction failed, falling back to regex:', aiError);
      }
      
      // Fallback to regex extraction if AI fails or finds nothing
      if (labValues.length === 0) {
        labValues = this.extractLabValuesWithRegex(rawText);
        confidence = this.calculateConfidence(labValues, rawText);
        extractionMethod = 'regex';
        logger.info(`Regex extraction: ${labValues.length} lab values found`);
      }
      
      // If still no lab values found, create some mock values for testing
      if (labValues.length === 0) {
        logger.warn('No lab values extracted from PDF, using mock data for testing');
        labValues = this.getMockLabValues();
        confidence = 10; // Low confidence for mock data
        extractionMethod = 'mock';
      }
      
      return {
        labValues,
        rawText,
        confidence,
        extractionMethod,
        metadata
      };
    } catch (error) {
      logger.error('PDF parsing error:', error);
      throw new Error('Failed to parse PDF file');
    }
  }

  private async extractLabValuesWithAI(rawText: string): Promise<{ labValues: ILabValue[]; confidence: number; metadata?: { testDate?: string; labName?: string; doctorName?: string } }> {
    const prompt = `
You are a medical laboratory expert. Extract all lab values AND metadata from the following lab report text.

Lab Report Text:
${rawText}

IMPORTANT: Return ONLY valid JSON with this exact structure:

{
  "metadata": {
    "testDate": "2024-01-15",
    "labName": "LabCorp",
    "doctorName": "Dr. John Smith"
  },
  "labValues": [
    {
      "name": "Total Cholesterol",
      "value": 180,
      "unit": "mg/dL",
      "referenceRange": "125-200",
      "status": "normal"
    }
  ]
}

EXTRACTION REQUIREMENTS:

**METADATA** (extract if available):
- testDate: Date of lab test (YYYY-MM-DD format, e.g., "2024-01-15")
- labName: Laboratory facility name (e.g., "LabCorp", "Quest Diagnostics", "Hospital Lab")
- doctorName: Ordering physician name (e.g., "Dr. John Smith", "Jane Doe, MD")

**LAB VALUES** (extract all available):
- Lipid panel (Total Cholesterol, HDL, LDL, Triglycerides)
- Metabolic panel (Glucose, BUN, Creatinine, Sodium, Potassium, Chloride, CO2)
- Liver function (ALT, AST, Bilirubin, Alkaline Phosphatase)
- Blood counts (Hemoglobin, Hematocrit, WBC, RBC, Platelets)
- Thyroid (TSH, Free T4, Free T3)
- Vitamins (B12, Folate, Vitamin D)
- Hormones (Testosterone, Estradiol, etc.)
- Any other lab values present

For each lab value include:
- name: Standardized test name
- value: Numeric result
- unit: Unit of measurement
- referenceRange: Normal range if provided
- status: "normal", "high", "low", or "critical" based on value vs reference range

IMPORTANT NOTES:
- If metadata fields are not found, omit them from the response
- Ensure all values are numeric and units are text
- Be precise with test names and reference ranges
- Return valid JSON only, no markdown or explanations
    `;

    try {
      // Construct the messages array for aiService.callOpenAI
      const messagesForOpenAI: ChatCompletionMessageParam[] = [
        { role: 'system', content: 'You are an AI assistant specialized in extracting structured lab data from text and responding in JSON format.' },
        { role: 'user', content: prompt } 
      ];
      const response = await aiService.callOpenAI(messagesForOpenAI, 2500);
      
      // Clean and parse the response
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
      
      // Try to find JSON object in the response
      let jsonStartIndex = cleanedResponse.indexOf('{');
      let jsonEndIndex = cleanedResponse.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanedResponse = cleanedResponse.substring(jsonStartIndex, jsonEndIndex + 1);
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      if (!parsed.labValues || !Array.isArray(parsed.labValues)) {
        throw new Error('AI response missing lab values array');
      }
      
      // Validate and normalize the lab values
      const labValues: ILabValue[] = parsed.labValues.map((item: any) => ({
        name: String(item.name || '').trim(),
        value: Number(item.value) || 0,
        unit: String(item.unit || '').trim(),
        referenceRange: item.referenceRange ? String(item.referenceRange).trim() : undefined,
        status: item.status && ['normal', 'high', 'low', 'critical'].includes(item.status) 
          ? item.status as 'normal' | 'high' | 'low' | 'critical' 
          : undefined
      })).filter(lab => lab.name && lab.value && lab.unit);
      
      // Extract metadata
      const metadata = parsed.metadata ? {
        testDate: parsed.metadata.testDate ? String(parsed.metadata.testDate).trim() : undefined,
        labName: parsed.metadata.labName ? String(parsed.metadata.labName).trim() : undefined,
        doctorName: parsed.metadata.doctorName ? String(parsed.metadata.doctorName).trim() : undefined
      } : undefined;
      
      // Calculate confidence based on extraction completeness
      let confidence = 60; // Base confidence for AI extraction
      if (labValues.length > 5) confidence += 20;
      if (labValues.length > 10) confidence += 15;
      if (labValues.every(lab => lab.referenceRange)) confidence += 5;
      if (labValues.every(lab => lab.status)) confidence += 5;
      if (metadata?.testDate) confidence += 3;
      if (metadata?.labName) confidence += 2;
      
      confidence = Math.min(confidence, 95); // Cap at 95% to leave room for manual verification
      
      return {
        labValues,
        confidence,
        metadata
      };
      
    } catch (error) {
      logger.error('AI lab value extraction failed:', error);
      throw error;
    }
  }

  private extractLabValuesWithRegex(text: string): ILabValue[] {
    const labValues: ILabValue[] = [];
    
    // Common lab value patterns
    const patterns = [
      // Pattern: "Test Name: 123.45 mg/dL (Normal: 70-100)"
      /([A-Za-z\s]+):\s*(\d+\.?\d*)\s*([a-zA-Z\/\%]+)?\s*(?:\(([^)]+)\))?/g,
      
      // Pattern: "Test Name    123.45    mg/dL    Normal"
      /([A-Za-z\s]+)\s+(\d+\.?\d*)\s+([a-zA-Z\/\%]+)?\s+(Normal|High|Low|Critical)/gi,
      
      // Pattern: "Test Name 123.45 mg/dL Normal 70-100"
      /([A-Za-z\s]+)\s+(\d+\.?\d*)\s+([a-zA-Z\/\%]+)?\s+(Normal|High|Low|Critical)\s+([\d\-\.]+)/gi
    ];

    // Common lab test names and their variations
    const commonTests = [
      'glucose', 'cholesterol', 'hdl', 'ldl', 'triglycerides',
      'hemoglobin', 'hematocrit', 'white blood cell', 'red blood cell',
      'platelet', 'sodium', 'potassium', 'chloride', 'co2', 'bun',
      'creatinine', 'gfr', 'protein', 'albumin', 'bilirubin',
      'alt', 'ast', 'alkaline phosphatase', 'calcium', 'phosphorus',
      'magnesium', 'iron', 'ferritin', 'b12', 'folate', 'vitamin d',
      'tsh', 'free t4', 'free t3', 'psa', 'a1c', 'hemoglobin a1c'
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const testName = match[1]?.trim().toLowerCase();
        const value = parseFloat(match[2]);
        const unit = match[3]?.trim() || '';
        const status = this.determineStatus(match[4] || match[5] || '');
        const referenceRange = match[4] || match[5] || '';

        // Check if this looks like a valid lab test
        if (testName && !isNaN(value) && this.isValidLabTest(testName, commonTests)) {
          labValues.push({
            name: this.normalizeTestName(testName),
            value,
            unit,
            referenceRange,
            status
          });
        }
      }
    });

    // Remove duplicates and invalid entries
    return this.deduplicateLabValues(labValues);
  }

  private getMockLabValues(): ILabValue[] {
    return [
      {
        name: 'Total Cholesterol',
        value: 180,
        unit: 'mg/dL',
        referenceRange: '125-200',
        status: 'normal'
      },
      {
        name: 'HDL Cholesterol',
        value: 55,
        unit: 'mg/dL',
        referenceRange: '>40',
        status: 'normal'
      },
      {
        name: 'LDL Cholesterol',
        value: 110,
        unit: 'mg/dL',
        referenceRange: '<100',
        status: 'high'
      },
      {
        name: 'Glucose',
        value: 95,
        unit: 'mg/dL',
        referenceRange: '70-100',
        status: 'normal'
      },
      {
        name: 'Hemoglobin A1c',
        value: 5.2,
        unit: '%',
        referenceRange: '<5.7',
        status: 'normal'
      }
    ];
  }

  private isValidLabTest(testName: string, commonTests: string[]): boolean {
    const normalizedName = testName.toLowerCase().trim();
    
    // Check if it matches any common test names
    return commonTests.some(test => 
      normalizedName.includes(test) || test.includes(normalizedName)
    );
  }

  private normalizeTestName(name: string): string {
    const normalized = name.toLowerCase().trim();
    
    // Common normalizations
    const normalizations: { [key: string]: string } = {
      'glucose': 'Glucose',
      'total cholesterol': 'Total Cholesterol',
      'hdl cholesterol': 'HDL Cholesterol',
      'ldl cholesterol': 'LDL Cholesterol',
      'triglycerides': 'Triglycerides',
      'hemoglobin': 'Hemoglobin',
      'hematocrit': 'Hematocrit',
      'white blood cell': 'White Blood Cell Count',
      'red blood cell': 'Red Blood Cell Count',
      'platelet count': 'Platelet Count',
      'sodium': 'Sodium',
      'potassium': 'Potassium',
      'chloride': 'Chloride',
      'co2': 'CO2',
      'bun': 'BUN',
      'creatinine': 'Creatinine',
      'gfr': 'eGFR',
      'total protein': 'Total Protein',
      'albumin': 'Albumin',
      'total bilirubin': 'Total Bilirubin',
      'alt': 'ALT',
      'ast': 'AST',
      'alkaline phosphatase': 'Alkaline Phosphatase',
      'calcium': 'Calcium',
      'phosphorus': 'Phosphorus',
      'magnesium': 'Magnesium',
      'iron': 'Iron',
      'ferritin': 'Ferritin',
      'vitamin b12': 'Vitamin B12',
      'folate': 'Folate',
      'vitamin d': 'Vitamin D',
      'tsh': 'TSH',
      'free t4': 'Free T4',
      'free t3': 'Free T3',
      'psa': 'PSA',
      'hemoglobin a1c': 'Hemoglobin A1c',
      'a1c': 'Hemoglobin A1c'
    };

    return normalizations[normalized] || name.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private determineStatus(statusText: string): 'normal' | 'low' | 'high' | 'critical' | undefined {
    const text = statusText.toLowerCase();
    
    if (text.includes('normal') || text.includes('nl')) return 'normal';
    if (text.includes('high') || text.includes('h') || text.includes('elevated')) return 'high';
    if (text.includes('low') || text.includes('l') || text.includes('decreased')) return 'low';
    if (text.includes('critical') || text.includes('panic') || text.includes('alert')) return 'critical';
    
    return undefined;
  }

  private deduplicateLabValues(labValues: ILabValue[]): ILabValue[] {
    const seen = new Set<string>();
    return labValues.filter(lab => {
      const key = `${lab.name.toLowerCase()}-${lab.value}-${lab.unit}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  private calculateConfidence(labValues: ILabValue[], rawText: string): number {
    let confidence = 0;
    
    // Base confidence on number of extracted values
    if (labValues.length > 0) confidence += 30;
    if (labValues.length > 5) confidence += 20;
    if (labValues.length > 10) confidence += 20;
    
    // Check for common lab report indicators
    const indicators = [
      'laboratory', 'lab report', 'test results', 'reference range',
      'normal', 'abnormal', 'mg/dl', 'mmol/l', 'g/dl', 'units'
    ];
    
    const foundIndicators = indicators.filter(indicator => 
      rawText.toLowerCase().includes(indicator)
    ).length;
    
    confidence += Math.min(foundIndicators * 5, 30);
    
    return Math.min(confidence, 100);
  }

  async deletePDF(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info(`Deleted PDF file: ${filePath}`);
      }
    } catch (error) {
      logger.error('Error deleting PDF file:', error);
    }
  }
}

export const pdfService = new PDFService(); 