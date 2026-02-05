/**
 * Rate Limiting Configuration
 *
 * This file contains the configuration for different rate limiting strategies
 * used throughout the application. Adjust these values based on your needs.
 */

import dotenv from 'dotenv'

dotenv.config()

export const RATE_LIMIT_CONFIG = {
  // Default rate limit for general API usage
  DEFAULT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 100, // requests per window
    message: 'Too many requests from this IP, please try again later.'
  },

  // Authentication endpoints (login, register, etc.)
  AUTH: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 5, // requests per window
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: false // Count all requests for testing
  },

  // Account creation (register endpoints)
  CREATE_ACCOUNT: {
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 3, // requests per window
    message: 'Too many account creation attempts, please try again later.'
  },

  // Password reset requests
  PASSWORD_RESET: {
    windowMs: 60 * 60 * 1000, // 1 hour
    limit: 3, // requests per window
    message: 'Too many password reset attempts, please try again later.'
  },

  // Payment processing
  PAYMENT: {
    windowMs: 10 * 60 * 1000, // 10 minutes
    limit: 10, // requests per window
    message: 'Too many payment attempts, please try again later.'
  },

  // Search functionality
  SEARCH: {
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 30, // requests per window
    message: 'Too many search requests, please try again later.'
  },

  // Upload endpoints (comments, file uploads, etc.)
  UPLOAD: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    limit: 20, // requests per window
    message: 'Too many upload attempts, please try again later.'
  },

  // Chatbot interactions
  CHATBOT: {
    windowMs: 1 * 60 * 1000, // 1 minute
    limit: 10, // requests per window
    message: 'Too many chatbot requests, please try again later.'
  },

  // Coding exercise run endpoint
  CODING_RUN: {
    windowMs: 1 * 1000, // 1 second
    limit: 3, // requests per window
    message: 'Too many code runs, please wait 1 second before retrying.'
  },

  // Coding exercise submit endpoint
  CODING_SUBMIT: {
    windowMs: 1 * 1000, // 1 second
    limit: 1, // requests per window
    message: 'Too many submissions, please wait 1 second before retrying.'
  }
} as const

/**
 * Environment-specific rate limit configurations
 * Adjust limits based on environment (development, staging, production)
 */
export const getEnvironmentConfig = () => {
  const env = process.env.NODE_ENV || 'development'

  // In development, be more lenient with rate limits
  if (env === 'development') {
    return {
      ...RATE_LIMIT_CONFIG,
      DEFAULT: { ...RATE_LIMIT_CONFIG.DEFAULT, limit: 1000 },
      AUTH: { ...RATE_LIMIT_CONFIG.AUTH, limit: 50 },
      SEARCH: { ...RATE_LIMIT_CONFIG.SEARCH, limit: 100 },
      CHATBOT: { ...RATE_LIMIT_CONFIG.CHATBOT, limit: 50 }
    }
  }

  // In production, use stricter limits
  return RATE_LIMIT_CONFIG
}

/**
 * Rate limit headers configuration
 */
export const RATE_LIMIT_HEADERS = {
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false // Disable the `X-RateLimit-*` headers
} as const
