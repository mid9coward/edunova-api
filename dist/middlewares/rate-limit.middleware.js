"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createAccountRateLimit = exports.chatbotRateLimit = exports.uploadRateLimit = exports.searchRateLimit = exports.paymentRateLimit = exports.passwordResetRateLimit = exports.authRateLimit = exports.defaultRateLimit = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const rate_limit_config_1 = require("../configs/rate-limit.config");
const errors_1 = require("../utils/errors");
// Get environment-specific configuration
const config = (0, rate_limit_config_1.getEnvironmentConfig)();
// Helper function to create rate limit handler following project error structure
const createRateLimitHandler = (errorMessage, defaultRetryAfter) => {
    return (req, res, next) => {
        const retryAfter = req.rateLimit?.resetTime
            ? Math.ceil(req.rateLimit.resetTime.getTime() / 1000)
            : defaultRetryAfter;
        // Create custom RateLimitError following project's error handling pattern
        const rateLimitError = new errors_1.RateLimitError(errorMessage, errors_1.ErrorCodes.RATE_LIMIT_EXCEEDED, {
            retryAfter,
            limit: req.rateLimit?.limit,
            remaining: req.rateLimit?.remaining,
            resetTime: req.rateLimit?.resetTime
        });
        // Pass to error middleware for consistent handling
        next(rateLimitError);
    };
};
// Default rate limiter - general API usage
exports.defaultRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.DEFAULT.windowMs,
    limit: config.DEFAULT.limit,
    message: {
        error: config.DEFAULT.message,
        retryAfter: Math.ceil(config.DEFAULT.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    handler: createRateLimitHandler(config.DEFAULT.message, Math.ceil(config.DEFAULT.windowMs / 1000))
});
// Strict rate limiter for authentication endpoints
exports.authRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.AUTH.windowMs,
    limit: config.AUTH.limit,
    message: {
        error: config.AUTH.message,
        retryAfter: Math.ceil(config.AUTH.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    skipSuccessfulRequests: config.AUTH.skipSuccessfulRequests,
    handler: createRateLimitHandler(config.AUTH.message, Math.ceil(config.AUTH.windowMs / 1000))
});
// Password reset rate limiter
exports.passwordResetRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.PASSWORD_RESET.windowMs,
    limit: config.PASSWORD_RESET.limit,
    message: {
        error: config.PASSWORD_RESET.message,
        retryAfter: Math.ceil(config.PASSWORD_RESET.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    handler: createRateLimitHandler(config.PASSWORD_RESET.message, Math.ceil(config.PASSWORD_RESET.windowMs / 1000))
});
// Payment rate limiter
exports.paymentRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.PAYMENT.windowMs,
    limit: config.PAYMENT.limit,
    message: {
        error: config.PAYMENT.message,
        retryAfter: Math.ceil(config.PAYMENT.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    handler: createRateLimitHandler(config.PAYMENT.message, Math.ceil(config.PAYMENT.windowMs / 1000))
});
// Search rate limiter
exports.searchRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.SEARCH.windowMs,
    limit: config.SEARCH.limit,
    message: {
        error: config.SEARCH.message,
        retryAfter: Math.ceil(config.SEARCH.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    handler: createRateLimitHandler(config.SEARCH.message, Math.ceil(config.SEARCH.windowMs / 1000))
});
// Upload rate limiter (for file uploads, comments, etc.)
exports.uploadRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.UPLOAD.windowMs,
    limit: config.UPLOAD.limit,
    message: {
        error: config.UPLOAD.message,
        retryAfter: Math.ceil(config.UPLOAD.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    handler: createRateLimitHandler(config.UPLOAD.message, Math.ceil(config.UPLOAD.windowMs / 1000))
});
// Chatbot rate limiter
exports.chatbotRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.CHATBOT.windowMs,
    limit: config.CHATBOT.limit,
    message: {
        error: config.CHATBOT.message,
        retryAfter: Math.ceil(config.CHATBOT.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    handler: createRateLimitHandler(config.CHATBOT.message, Math.ceil(config.CHATBOT.windowMs / 1000))
});
// Create account rate limiter
exports.createAccountRateLimit = (0, express_rate_limit_1.default)({
    windowMs: config.CREATE_ACCOUNT.windowMs,
    limit: config.CREATE_ACCOUNT.limit,
    message: {
        error: config.CREATE_ACCOUNT.message,
        retryAfter: Math.ceil(config.CREATE_ACCOUNT.windowMs / 1000)
    },
    ...rate_limit_config_1.RATE_LIMIT_HEADERS,
    handler: createRateLimitHandler(config.CREATE_ACCOUNT.message, Math.ceil(config.CREATE_ACCOUNT.windowMs / 1000))
});
