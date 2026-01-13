"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.asyncHandler = exports.notFoundHandler = exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const errorHandler = (error, req, res, _next) => {
    // Log error for monitoring
    logError(error, req);
    // Handle operational errors
    if (error instanceof errors_1.AppError) {
        const errorResponse = {
            success: false,
            message: error.message,
            errorCode: error.errorCode,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        };
        // Add rate limit specific metadata for RateLimitError
        if (error instanceof errors_1.RateLimitError) {
            errorResponse.meta = {
                retryAfter: error.retryAfter,
                limit: error.limit,
                remaining: error.remaining,
                resetTime: error.resetTime?.toISOString()
            };
        }
        // Include stack trace in development
        if (process.env.NODE_ENV === 'development') {
            errorResponse.stack = error.stack;
        }
        res.status(error.statusCode).json(errorResponse);
        return;
    }
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
        const errorResponse = {
            success: false,
            message: 'Validation failed',
            errorCode: errors_1.ErrorCodes.INVALID_INPUT_FORMAT,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        };
        if (process.env.NODE_ENV === 'development') {
            errorResponse.message = error.message;
            errorResponse.stack = error.stack;
        }
        res.status(400).json(errorResponse);
        return;
    }
    // Handle Mongoose cast errors
    if (error.name === 'CastError') {
        const errorResponse = {
            success: false,
            message: 'Invalid resource ID',
            errorCode: errors_1.ErrorCodes.INVALID_INPUT_FORMAT,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        };
        res.status(400).json(errorResponse);
        return;
    }
    // Handle Mongoose duplicate key errors
    if (error.name === 'MongoServerError' && error.code === 11000) {
        const errorResponse = {
            success: false,
            message: 'Duplicate field value',
            errorCode: errors_1.ErrorCodes.USER_ALREADY_EXISTS,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        };
        res.status(409).json(errorResponse);
        return;
    }
    // Handle JWT errors
    if (error.name === 'JsonWebTokenError') {
        const errorResponse = {
            success: false,
            message: 'Invalid token',
            errorCode: errors_1.ErrorCodes.TOKEN_INVALID,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        };
        res.status(401).json(errorResponse);
        return;
    }
    if (error.name === 'TokenExpiredError') {
        const errorResponse = {
            success: false,
            message: 'Token expired',
            errorCode: errors_1.ErrorCodes.TOKEN_EXPIRED,
            timestamp: new Date().toISOString(),
            path: req.path,
            method: req.method
        };
        res.status(401).json(errorResponse);
        return;
    }
    // Handle unhandled errors
    const errorResponse = {
        success: false,
        message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
        errorCode: errors_1.ErrorCodes.INTERNAL_SERVER_ERROR,
        timestamp: new Date().toISOString(),
        path: req.path,
        method: req.method
    };
    if (process.env.NODE_ENV === 'development') {
        errorResponse.stack = error.stack;
    }
    res.status(500).json(errorResponse);
};
exports.errorHandler = errorHandler;
// 404 handler for routes that don't exist
const notFoundHandler = (req, res, next) => {
    const error = new errors_1.AppError(`Route ${req.method} ${req.path} not found`, 404, 'ROUTE_NOT_FOUND');
    next(error);
};
exports.notFoundHandler = notFoundHandler;
// Async error wrapper to catch async errors
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
exports.asyncHandler = asyncHandler;
function logError(error, req) {
    const logData = {
        timestamp: new Date().toISOString(),
        error: {
            name: error.name,
            message: error.message,
            stack: error.stack
        },
        request: {
            method: req.method,
            path: req.path,
            query: req.query,
            params: req.params,
            userAgent: req.get('User-Agent'),
            ip: req.ip || req.connection.remoteAddress
        },
        user: req.user?.userId || 'anonymous'
    };
    // In production, you might want to use a proper logging service
    // like Winston, Bunyan, or send to external services like LogRocket, Sentry
    if (process.env.NODE_ENV === 'production') {
        // Log to external service
        console.error('ERROR:', JSON.stringify(logData, null, 2));
    }
    else {
        console.error('ERROR:', logData);
    }
}
