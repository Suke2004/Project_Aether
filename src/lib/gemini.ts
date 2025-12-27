/**
 * Google Gemini AI service for quest verification
 * Handles image analysis and quest completion validation
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_CONFIG, APP_CONFIG } from './config';
import { AIVerificationResult } from './types';

// Initialize Gemini AI client
const genAI = new GoogleGenerativeAI(GEMINI_CONFIG.apiKey);

/**
 * Converts image URI to base64 format for Gemini API
 * @param imageUri - The image URI to convert
 * @returns Promise<string> - Base64 encoded image data
 */
export const convertImageToBase64 = async (imageUri: string): Promise<string> => {
  try {
    // For React Native, we need to handle different image sources
    if (imageUri.startsWith('data:')) {
      // Already base64 encoded
      return imageUri.split(',')[1];
    }
    
    // For file URIs, we'll use fetch to get the blob and convert to base64
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        // Remove the data:image/jpeg;base64, prefix
        const base64 = base64data.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    throw new Error(`Failed to convert image to base64: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Verifies quest completion using Google Gemini AI
 * @param imageUri - URI of the proof image
 * @param questDescription - Description of the quest to verify
 * @param verificationPrompt - Custom verification prompt for the quest
 * @returns Promise<AIVerificationResult> - Verification result with confidence score
 */
export const verifyQuest = async (
  imageUri: string,
  questDescription: string,
  verificationPrompt: string
): Promise<AIVerificationResult> => {
  try {
    // Validate inputs
    if (!imageUri || !questDescription || !verificationPrompt) {
      throw new Error('Missing required parameters for quest verification');
    }

    if (!GEMINI_CONFIG.apiKey) {
      throw new Error('Gemini API key not configured');
    }

    // Convert image to base64
    const base64Image = await convertImageToBase64(imageUri);

    // Get the generative model
    const model = genAI.getGenerativeModel({ model: GEMINI_CONFIG.model });

    // Construct the verification prompt
    const prompt = `
You are an AI referee for a children's attention wallet app. Your job is to verify if a child has completed a quest based on a photo they took.

Quest Description: ${questDescription}
Verification Instructions: ${verificationPrompt}

Please analyze the provided image and determine if the quest has been completed successfully.

Respond with a JSON object in this exact format:
{
  "isValid": boolean,
  "confidence": number (0-100),
  "reasoning": "Brief explanation of your decision"
}

Be encouraging but fair in your assessment. The confidence score should reflect how certain you are that the quest was completed correctly.
`;

    // Create the image part for the API call
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType: 'image/jpeg', // Assuming JPEG, could be made dynamic
      },
    };

    // Make the API call with timeout handling
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('AI verification timeout')), 30000); // 30 second timeout
    });

    const apiCallPromise = model.generateContent([prompt, imagePart]);

    const result = await Promise.race([apiCallPromise, timeoutPromise]);
    const response = await result.response;
    const text = response.text();

    // Parse the JSON response
    let parsedResult: AIVerificationResult;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      // Validate the response structure
      if (typeof jsonResponse.isValid !== 'boolean' || 
          typeof jsonResponse.confidence !== 'number' ||
          jsonResponse.confidence < 0 || 
          jsonResponse.confidence > 100) {
        throw new Error('Invalid AI response format');
      }

      parsedResult = {
        isValid: jsonResponse.isValid,
        confidence: Math.round(jsonResponse.confidence), // Ensure integer
        reasoning: jsonResponse.reasoning || 'No reasoning provided',
      };
    } catch (parseError) {
      // Fallback: try to extract boolean and confidence from text
      const isValidMatch = text.toLowerCase().includes('true') || text.toLowerCase().includes('valid');
      const confidenceMatch = text.match(/(\d+)%?/);
      
      parsedResult = {
        isValid: isValidMatch,
        confidence: confidenceMatch ? Math.min(100, Math.max(0, parseInt(confidenceMatch[1]))) : 50,
        reasoning: 'AI response could not be parsed, using fallback analysis',
      };
    }

    return parsedResult;

  } catch (error) {
    // Handle different types of errors gracefully
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        throw new Error('AI verification service is currently unavailable. Please try again later.');
      }
      
      if (error.message.includes('API key')) {
        throw new Error('AI service configuration error. Please contact support.');
      }
      
      if (error.message.includes('base64')) {
        throw new Error('Image processing failed. Please try taking a new photo.');
      }
      
      // Generic error handling
      throw new Error(`Quest verification failed: ${error.message}`);
    }
    
    throw new Error('An unexpected error occurred during quest verification');
  }
};

/**
 * Retry wrapper for quest verification with exponential backoff
 * @param imageUri - URI of the proof image
 * @param questDescription - Description of the quest to verify
 * @param verificationPrompt - Custom verification prompt for the quest
 * @param maxRetries - Maximum number of retry attempts (default from config)
 * @returns Promise<AIVerificationResult> - Verification result
 */
export const verifyQuestWithRetry = async (
  imageUri: string,
  questDescription: string,
  verificationPrompt: string,
  maxRetries: number = APP_CONFIG.maxRetries
): Promise<AIVerificationResult> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await verifyQuest(imageUri, questDescription, verificationPrompt);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      // Don't retry on configuration errors or invalid input
      if (lastError.message.includes('configuration') || 
          lastError.message.includes('Missing required parameters')) {
        throw lastError;
      }
      
      // If this is the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Exponential backoff: wait 2^attempt seconds
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Health check for Gemini AI service
 * @returns Promise<boolean> - True if service is available
 */
export const checkGeminiHealth = async (): Promise<boolean> => {
  try {
    if (!GEMINI_CONFIG.apiKey) {
      return false;
    }
    
    const model = genAI.getGenerativeModel({ model: GEMINI_CONFIG.model });
    const result = await model.generateContent('Hello, are you working?');
    const response = await result.response;
    
    return response.text().length > 0;
  } catch (error) {
    return false;
  }
};