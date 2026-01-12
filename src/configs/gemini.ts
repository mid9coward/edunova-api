/**
 * Google Gemini AI Configuration
 */

export const GEMINI_CONFIG = {
  // API key is loaded from environment variable GEMINI_API_KEY
  DEFAULT_MODEL: 'gemini-1.5-pro',

  // Generation parameters
  GENERATION_CONFIG: {
    temperature: 0.4, // Lower for more consistent outputs
    topP: 0.95, // Controls diversity
    topK: 40, // Number of highest probability tokens to consider
    maxOutputTokens: 1000
  },

  // Model settings
  MODELS: {
    STANDARD: 'gemini-1.5-pro',
    FLASH: 'gemini-1.5-flash',
    VISION: 'gemini-1.5-pro-vision'
  },

  // Safety settings (optional)
  SAFETY_SETTINGS: [
    {
      category: 'HARM_CATEGORY_HARASSMENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_HATE_SPEECH',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    },
    {
      category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
      threshold: 'BLOCK_MEDIUM_AND_ABOVE'
    }
  ],

  // Chat history settings
  CHAT_HISTORY: {
    MAX_MESSAGES: 10,
    MAX_SESSIONS: 100,
    SESSION_EXPIRY_HOURS: 24
  }
}
