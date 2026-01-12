import { Request, Response, NextFunction } from 'express'
import { AppError, ErrorCodes, RateLimitError } from '../utils/errors'

interface ErrorResponse {
  success: false
  message: string
  errorCode?: string
  stack?: string
  timestamp: string
  path: string
  method: string
  meta?: {
    retryAfter?: number
    limit?: number
    remaining?: number
    resetTime?: string
    [key: string]: unknown
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (error: Error, req: Request, res: Response, _next: NextFunction): void => {
  // Log error for monitoring
  logError(error, req)

  // Handle operational errors
  if (error instanceof AppError) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: error.message,
      errorCode: error.errorCode,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }

    // Add rate limit specific metadata for RateLimitError
    if (error instanceof RateLimitError) {
      errorResponse.meta = {
        retryAfter: error.retryAfter,
        limit: error.limit,
        remaining: error.remaining,
        resetTime: error.resetTime?.toISOString()
      }
    }

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
      errorResponse.stack = error.stack
    }

    res.status(error.statusCode).json(errorResponse)
    return
  }

  // Handle Mongoose validation errors
  if (error.name === 'ValidationError') {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Validation failed',
      errorCode: ErrorCodes.INVALID_INPUT_FORMAT,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }

    if (process.env.NODE_ENV === 'development') {
      errorResponse.message = error.message
      errorResponse.stack = error.stack
    }

    res.status(400).json(errorResponse)
    return
  }

  // Handle Mongoose cast errors
  if (error.name === 'CastError') {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Invalid resource ID',
      errorCode: ErrorCodes.INVALID_INPUT_FORMAT,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }

    res.status(400).json(errorResponse)
    return
  }

  // Handle Mongoose duplicate key errors
  if (error.name === 'MongoServerError' && (error as unknown as { code: number }).code === 11000) {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Duplicate field value',
      errorCode: ErrorCodes.USER_ALREADY_EXISTS,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }

    res.status(409).json(errorResponse)
    return
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Invalid token',
      errorCode: ErrorCodes.TOKEN_INVALID,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }

    res.status(401).json(errorResponse)
    return
  }

  if (error.name === 'TokenExpiredError') {
    const errorResponse: ErrorResponse = {
      success: false,
      message: 'Token expired',
      errorCode: ErrorCodes.TOKEN_EXPIRED,
      timestamp: new Date().toISOString(),
      path: req.path,
      method: req.method
    }

    res.status(401).json(errorResponse)
    return
  }

  // Handle unhandled errors
  const errorResponse: ErrorResponse = {
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Something went wrong' : error.message,
    errorCode: ErrorCodes.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  }

  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = error.stack
  }

  res.status(500).json(errorResponse)
}

// 404 handler for routes that don't exist
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Route ${req.method} ${req.path} not found`, 404, 'ROUTE_NOT_FOUND')
  next(error)
}

// Async error wrapper to catch async errors
export const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown> | void) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

function logError(error: Error, req: Request): void {
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
  }

  // In production, you might want to use a proper logging service
  // like Winston, Bunyan, or send to external services like LogRocket, Sentry
  if (process.env.NODE_ENV === 'production') {
    // Log to external service
    console.error('ERROR:', JSON.stringify(logData, null, 2))
  } else {
    console.error('ERROR:', logData)
  }
}
