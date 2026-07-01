// OpenAI API Configuration
// DEPRECATED: Direct API calls are now handled by Firebase Cloud Functions
// This file is kept for type definitions and legacy support only

// WARNING: Do not use EXPO_PUBLIC_OPENAI_API_KEY in production!
// API calls should go through Cloud Functions for security
const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || '';

export const OpenAIConfig = {
  apiKey: OPENAI_API_KEY,
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o', // Vision destekli model
  maxTokens: 1500,
  temperature: 0.7,
};

// API Key kontrol - DEPRECATED
// Use Cloud Functions instead of direct API calls
export function isOpenAIConfigured(): boolean {
  console.warn('isOpenAIConfigured is deprecated. Use Cloud Functions for API calls.');
  return OpenAIConfig.apiKey.length > 0 && OpenAIConfig.apiKey !== 'YOUR_OPENAI_API_KEY';
}

// Headers - DEPRECATED
// Use Cloud Functions instead of direct API calls
export function getOpenAIHeaders(): HeadersInit {
  console.warn('getOpenAIHeaders is deprecated. Use Cloud Functions for API calls.');
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${OpenAIConfig.apiKey}`,
  };
}
