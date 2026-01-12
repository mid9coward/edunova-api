import { Request, Response, NextFunction } from 'express'
import { verifyToken } from '../utils/auth'
import { User, UserStatus } from '../models'
import { AuthenticationError, ErrorCodes } from '../utils/errors'

// Extend Express Request interface to include user

export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization

    const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null

    if (!token) {
      throw new AuthenticationError('Access token is required', ErrorCodes.TOKEN_INVALID)
    }

    // Verify token
    const decoded = verifyToken(token) as { userId: string }

    // Check if user exists and is active
    const user = await User.findById(decoded.userId).select('-password')

    if (!user) {
      throw new AuthenticationError('Invalid token - user not found', ErrorCodes.USER_NOT_FOUND)
    }

    if (user.status === UserStatus.INACTIVE) {
      throw new AuthenticationError('Account is not active', ErrorCodes.ACCOUNT_INACTIVE)
    }

    if (user.status === UserStatus.BANNED) {
      throw new AuthenticationError('Account is banned', ErrorCodes.ACCOUNT_BANNED)
    }

    // Attach user info to request
    req.user = {
      userId: user._id.toString(),
      roles: user.roles.map((role) => role.toString())
    }

    next()
  } catch (error) {
    // If it's already one of our custom errors, pass it to the error handler
    if (error instanceof AuthenticationError) {
      return next(error)
    }

    // For any other errors (like JWT verification errors), treat as authentication error
    console.error('Auth middleware error:', error)
    next(new AuthenticationError('Invalid token', ErrorCodes.TOKEN_INVALID))
  }
}
