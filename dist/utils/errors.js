"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorCodes = exports.RateLimitError = exports.ExternalServiceError = exports.DatabaseError = exports.ConflictError = exports.NotFoundError = exports.AuthorizationError = exports.AuthenticationError = exports.ValidationError = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    isOperational;
    errorCode;
    constructor(message, statusCode, errorCode, isOperational = true) {
        super(message);
        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.errorCode = errorCode;
        // Maintains proper stack trace for where our error was thrown (only available on V8)
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, this.constructor);
        }
        this.name = this.constructor.name;
    }
}
exports.AppError = AppError;
class ValidationError extends AppError {
    constructor(message, errorCode) {
        super(message, 400, errorCode);
    }
}
exports.ValidationError = ValidationError;
class AuthenticationError extends AppError {
    constructor(message = 'Authentication failed', errorCode) {
        super(message, 401, errorCode);
    }
}
exports.AuthenticationError = AuthenticationError;
class AuthorizationError extends AppError {
    constructor(message = 'Insufficient permissions', errorCode) {
        super(message, 403, errorCode);
    }
}
exports.AuthorizationError = AuthorizationError;
class NotFoundError extends AppError {
    constructor(message = 'Resource not found', errorCode) {
        super(message, 404, errorCode);
    }
}
exports.NotFoundError = NotFoundError;
class ConflictError extends AppError {
    constructor(message = 'Resource conflict', errorCode) {
        super(message, 409, errorCode);
    }
}
exports.ConflictError = ConflictError;
class DatabaseError extends AppError {
    constructor(message = 'Database operation failed', errorCode) {
        super(message, 500, errorCode);
    }
}
exports.DatabaseError = DatabaseError;
class ExternalServiceError extends AppError {
    constructor(message = 'External service error', errorCode) {
        super(message, 502, errorCode);
    }
}
exports.ExternalServiceError = ExternalServiceError;
class RateLimitError extends AppError {
    retryAfter;
    limit;
    remaining;
    resetTime;
    constructor(message = 'Rate limit exceeded', errorCode, rateLimit) {
        super(message, 429, errorCode);
        this.retryAfter = rateLimit?.retryAfter;
        this.limit = rateLimit?.limit;
        this.remaining = rateLimit?.remaining;
        this.resetTime = rateLimit?.resetTime;
    }
}
exports.RateLimitError = RateLimitError;
// Error codes for consistent error identification
exports.ErrorCodes = {
    // Authentication
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
    ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
    ACCOUNT_BANNED: 'ACCOUNT_BANNED',
    TOKEN_EXPIRED: 'TOKEN_EXPIRED',
    TOKEN_INVALID: 'TOKEN_INVALID',
    EMAIL_NOT_VERIFIED: 'EMAIL_NOT_VERIFIED',
    EMAIL_ALREADY_VERIFIED: 'EMAIL_ALREADY_VERIFIED',
    // Validation
    REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
    INVALID_EMAIL_FORMAT: 'INVALID_EMAIL_FORMAT',
    PASSWORD_TOO_WEAK: 'PASSWORD_TOO_WEAK',
    INVALID_INPUT_FORMAT: 'INVALID_INPUT_FORMAT',
    // Resource conflicts
    USER_ALREADY_EXISTS: 'USER_ALREADY_EXISTS',
    USERNAME_TAKEN: 'USERNAME_TAKEN',
    EMAIL_ALREADY_REGISTERED: 'EMAIL_ALREADY_REGISTERED',
    // Resource not found
    USER_NOT_FOUND: 'USER_NOT_FOUND',
    COURSE_NOT_FOUND: 'COURSE_NOT_FOUND',
    ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
    COUPON_NOT_FOUND: 'COUPON_NOT_FOUND',
    CATEGORY_NOT_FOUND: 'CATEGORY_NOT_FOUND',
    CHAPTER_NOT_FOUND: 'CHAPTER_NOT_FOUND',
    LESSON_NOT_FOUND: 'LESSON_NOT_FOUND',
    REVIEW_NOT_FOUND: 'REVIEW_NOT_FOUND',
    QUIZ_NOT_FOUND: 'QUIZ_NOT_FOUND',
    QUIZ_QUESTION_NOT_FOUND: 'QUIZ_QUESTION_NOT_FOUND',
    // Resource conflicts
    DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
    // Review specific errors
    REVIEW_ALREADY_EXISTS: 'REVIEW_ALREADY_EXISTS',
    UNAUTHORIZED_ACTION: 'UNAUTHORIZED_ACTION',
    INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
    // Coupon specific errors
    COUPON_CODE_EXISTS: 'COUPON_CODE_EXISTS',
    COUPON_EXPIRED: 'COUPON_EXPIRED',
    COUPON_NOT_ACTIVE: 'COUPON_NOT_ACTIVE',
    COUPON_USAGE_LIMIT_EXCEEDED: 'COUPON_USAGE_LIMIT_EXCEEDED',
    COUPON_NOT_APPLICABLE: 'COUPON_NOT_APPLICABLE',
    INVALID_COUPON_CODE: 'INVALID_COUPON_CODE',
    // Quiz Question specific errors
    INVALID_CORRECT_ANSWER_INDEX: 'INVALID_CORRECT_ANSWER_INDEX',
    INVALID_TRUE_FALSE_OPTIONS: 'INVALID_TRUE_FALSE_OPTIONS',
    INVALID_SINGLE_CHOICE_ANSWERS: 'INVALID_SINGLE_CHOICE_ANSWERS',
    // Database
    DB_CONNECTION_FAILED: 'DB_CONNECTION_FAILED',
    DB_OPERATION_FAILED: 'DB_OPERATION_FAILED',
    // Configuration
    CONFIG_MISSING: 'CONFIG_MISSING',
    DEFAULT_ROLE_NOT_CONFIGURED: 'DEFAULT_ROLE_NOT_CONFIGURED',
    // General
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};
