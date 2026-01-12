import { Request, Response, NextFunction } from 'express'
import { z } from 'zod'
import { ValidationError, ErrorCodes } from '../utils/errors'

// Generic Zod validation middleware
export const validate = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      }) as { body?: unknown; query?: unknown; params?: unknown }

      // Replace req properties with validated data
      if (result.body) req.body = result.body
      if (result.query) {
        // Instead of directly assigning to req.query, we need to replace its properties
        Object.keys(req.query).forEach((key) => delete (req.query as Record<string, unknown>)[key])
        Object.assign(req.query, result.query)
      }
      if (result.params) Object.assign(req.params, result.params)

      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        // Transform Zod errors into our ValidationError format
        const errorMessages = error.issues.map((err) => {
          const path = err.path.join('.')
          return `${path}: ${err.message}`
        })

        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`, ErrorCodes.INVALID_INPUT_FORMAT)
      }

      // Re-throw other errors
      throw error
    }
  }
}

// Validate only request body
export const validateBody = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.body)
      req.body = result
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err) => {
          const path = err.path.join('.')
          return `${path}: ${err.message}`
        })

        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`, ErrorCodes.INVALID_INPUT_FORMAT)
      }

      throw error
    }
  }
}

// Validate only query parameters
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.query)
      // Clear existing query properties and assign new ones
      Object.keys(req.query).forEach((key) => delete (req.query as Record<string, unknown>)[key])
      Object.assign(req.query, result)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err) => {
          const path = err.path.join('.')
          return `${path}: ${err.message}`
        })

        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`, ErrorCodes.INVALID_INPUT_FORMAT)
      }

      throw error
    }
  }
}

// Validate only route parameters
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const result = schema.parse(req.params)
      Object.assign(req.params, result)
      next()
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessages = error.issues.map((err) => {
          const path = err.path.join('.')
          return `${path}: ${err.message}`
        })

        throw new ValidationError(`Validation failed: ${errorMessages.join(', ')}`, ErrorCodes.INVALID_INPUT_FORMAT)
      }

      throw error
    }
  }
}

// Legacy validation functions (deprecated - use Zod schemas instead)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/

export const validateEmail = (email: string): boolean => {
  return emailRegex.test(email)
}

export const validatePassword = (password: string): boolean => {
  return passwordRegex.test(password)
}

// Legacy middleware functions (deprecated - use validate() with schemas instead)
export const validateRegistration = (req: Request, res: Response, next: NextFunction): void => {
  const { username, email, password } = req.body

  if (!username || !email || !password) {
    throw new ValidationError('Username, email, and password are required', ErrorCodes.REQUIRED_FIELD_MISSING)
  }

  if (!validateEmail(email)) {
    throw new ValidationError('Please provide a valid email address', ErrorCodes.INVALID_EMAIL_FORMAT)
  }

  if (!validatePassword(password)) {
    throw new ValidationError(
      'Password must be at least 8 characters long and contain at least one letter and one number',
      ErrorCodes.PASSWORD_TOO_WEAK
    )
  }

  if (username.length < 3 || username.length > 50) {
    throw new ValidationError('Username must be between 3 and 50 characters', ErrorCodes.INVALID_INPUT_FORMAT)
  }

  next()
}

export const validateLogin = (req: Request, res: Response, next: NextFunction): void => {
  const { email, password } = req.body

  if (!email || !password) {
    throw new ValidationError('Email and password are required', ErrorCodes.REQUIRED_FIELD_MISSING)
  }

  if (!validateEmail(email)) {
    throw new ValidationError('Please provide a valid email address', ErrorCodes.INVALID_EMAIL_FORMAT)
  }

  next()
}

export const validatePasswordChange = (req: Request, res: Response, next: NextFunction): void => {
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    throw new ValidationError('Current password and new password are required', ErrorCodes.REQUIRED_FIELD_MISSING)
  }

  if (!validatePassword(newPassword)) {
    throw new ValidationError(
      'New password must be at least 8 characters long and contain at least one letter and one number',
      ErrorCodes.PASSWORD_TOO_WEAK
    )
  }

  if (currentPassword === newPassword) {
    throw new ValidationError('New password must be different from current password', ErrorCodes.INVALID_INPUT_FORMAT)
  }

  next()
}
