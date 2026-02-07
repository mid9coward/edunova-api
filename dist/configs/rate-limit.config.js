"use strict";
/**
 * Rate Limiting Configuration
 *
 * This file contains the configuration for different rate limiting strategies
 * used throughout the application. Adjust these values based on your needs.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RATE_LIMIT_HEADERS = exports.getEnvironmentConfig = exports.RATE_LIMIT_CONFIG = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const envNumber = (key, fallback) => {
    const raw = process.env[key];
    if (!raw)
        return fallback;
    const value = Number.parseInt(raw, 10);
    if (!Number.isFinite(value) || value <= 0)
        return fallback;
    return value;
};
exports.RATE_LIMIT_CONFIG = {
    // Default rate limit for general API usage
    DEFAULT: {
        windowMs: envNumber('RATE_LIMIT_DEFAULT_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
        limit: envNumber('RATE_LIMIT_DEFAULT_LIMIT', 100), // requests per window
        message: 'Too many requests from this IP, please try again later.'
    },
    // Authentication endpoints (login, register, etc.)
    AUTH: {
        windowMs: envNumber('RATE_LIMIT_AUTH_WINDOW_MS', 15 * 60 * 1000), // 15 minutes
        limit: envNumber('RATE_LIMIT_AUTH_LIMIT', 5), // requests per window
        message: 'Too many authentication attempts, please try again later.',
        skipSuccessfulRequests: false // Count all requests for testing
    },
    // Account creation (register endpoints)
    CREATE_ACCOUNT: {
        windowMs: envNumber('RATE_LIMIT_CREATE_ACCOUNT_WINDOW_MS', 60 * 60 * 1000), // 1 hour
        limit: envNumber('RATE_LIMIT_CREATE_ACCOUNT_LIMIT', 3), // requests per window
        message: 'Too many account creation attempts, please try again later.'
    },
    // Password reset requests
    PASSWORD_RESET: {
        windowMs: envNumber('RATE_LIMIT_PASSWORD_RESET_WINDOW_MS', 60 * 60 * 1000), // 1 hour
        limit: envNumber('RATE_LIMIT_PASSWORD_RESET_LIMIT', 3), // requests per window
        message: 'Too many password reset attempts, please try again later.'
    },
    // Payment processing
    PAYMENT: {
        windowMs: envNumber('RATE_LIMIT_PAYMENT_WINDOW_MS', 10 * 60 * 1000), // 10 minutes
        limit: envNumber('RATE_LIMIT_PAYMENT_LIMIT', 10), // requests per window
        message: 'Too many payment attempts, please try again later.'
    },
    // Search functionality
    SEARCH: {
        windowMs: envNumber('RATE_LIMIT_SEARCH_WINDOW_MS', 1 * 60 * 1000), // 1 minute
        limit: envNumber('RATE_LIMIT_SEARCH_LIMIT', 30), // requests per window
        message: 'Too many search requests, please try again later.'
    },
    // Upload endpoints (comments, file uploads, etc.)
    UPLOAD: {
        windowMs: envNumber('RATE_LIMIT_UPLOAD_WINDOW_MS', 5 * 60 * 1000), // 5 minutes
        limit: envNumber('RATE_LIMIT_UPLOAD_LIMIT', 20), // requests per window
        message: 'Too many upload attempts, please try again later.'
    },
    // Chatbot interactions
    CHATBOT: {
        windowMs: envNumber('RATE_LIMIT_CHATBOT_WINDOW_MS', 1 * 60 * 1000), // 1 minute
        limit: envNumber('RATE_LIMIT_CHATBOT_LIMIT', 10), // requests per window
        message: 'Too many chatbot requests, please try again later.'
    },
    // Coding exercise run endpoint
    CODING_RUN: {
        windowMs: envNumber('RATE_LIMIT_CODING_RUN_WINDOW_MS', 1 * 1000), // 1 second
        limit: envNumber('RATE_LIMIT_CODING_RUN_LIMIT', 3), // requests per window
        message: 'Too many code runs, please wait 1 second before retrying.'
    },
    // Coding exercise submit endpoint
    CODING_SUBMIT: {
        windowMs: envNumber('RATE_LIMIT_CODING_SUBMIT_WINDOW_MS', 1 * 1000), // 1 second
        limit: envNumber('RATE_LIMIT_CODING_SUBMIT_LIMIT', 1), // requests per window
        message: 'Too many submissions, please wait 1 second before retrying.'
    }
};
/**
 * Environment-specific rate limit configurations
 * Adjust limits based on environment (development, staging, production)
 */
const getEnvironmentConfig = () => {
    const env = process.env.NODE_ENV || 'development';
    // In development, be more lenient with rate limits
    if (env === 'development') {
        return {
            ...exports.RATE_LIMIT_CONFIG,
            DEFAULT: {
                ...exports.RATE_LIMIT_CONFIG.DEFAULT,
                limit: envNumber('RATE_LIMIT_DEV_DEFAULT_LIMIT', envNumber('RATE_LIMIT_DEFAULT_LIMIT', 1000))
            },
            AUTH: {
                ...exports.RATE_LIMIT_CONFIG.AUTH,
                limit: envNumber('RATE_LIMIT_DEV_AUTH_LIMIT', envNumber('RATE_LIMIT_AUTH_LIMIT', 50))
            },
            SEARCH: {
                ...exports.RATE_LIMIT_CONFIG.SEARCH,
                limit: envNumber('RATE_LIMIT_DEV_SEARCH_LIMIT', envNumber('RATE_LIMIT_SEARCH_LIMIT', 100))
            },
            CHATBOT: {
                ...exports.RATE_LIMIT_CONFIG.CHATBOT,
                limit: envNumber('RATE_LIMIT_DEV_CHATBOT_LIMIT', envNumber('RATE_LIMIT_CHATBOT_LIMIT', 50))
            }
        };
    }
    // In production, use stricter limits
    return exports.RATE_LIMIT_CONFIG;
};
exports.getEnvironmentConfig = getEnvironmentConfig;
/**
 * Rate limit headers configuration
 */
exports.RATE_LIMIT_HEADERS = {
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false // Disable the `X-RateLimit-*` headers
};
