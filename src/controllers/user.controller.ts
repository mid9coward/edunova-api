import { Request, Response } from 'express'
import { UserService } from '../services/user.service'
import { AppError } from '../utils/errors'
import { sendSuccess } from '../utils/success'

export class UserController {
  /**
   * Get all users with pagination and filtering
   */
  static async getUsers(req: Request, res: Response) {
    const result = await UserService.getUsers(req.query)

    sendSuccess.ok(res, 'Users retrieved successfully', result)
  }

  /**
   * Get user by ID
   */
  static async getUserById(req: Request, res: Response) {
    const result = await UserService.getUserById(req.params.userId)

    sendSuccess.ok(res, 'User retrieved successfully', result)
  }

  /**
   * Update user (admin-level updates)
   */
  static async updateUser(req: Request, res: Response) {
    const result = await UserService.updateUser(req.params.userId, req.body)

    sendSuccess.ok(res, 'User updated successfully', result)
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(req: Request, res: Response) {
    await UserService.deleteUser(req.params.userId)

    sendSuccess.ok(res, 'User deleted successfully')
  }

  /**
   * Get current user profile (from token)
   */
  static async getCurrentUser(req: Request, res: Response) {
    // Get user ID from request (set by auth middleware)
    const userId = req.user?.userId

    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const result = await UserService.getUserById(userId)

    sendSuccess.ok(res, 'Current user profile retrieved successfully', result)
  }

  /**
   * Update current user profile (from token)
   */
  static async updateProfile(req: Request, res: Response) {
    // Get user ID from request (set by auth middleware)
    const userId = req.user?.userId

    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const result = await UserService.updateProfile(userId, req.body)

    sendSuccess.ok(res, 'Profile updated successfully', result)
  }
}
