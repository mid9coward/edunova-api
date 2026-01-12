import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { ValidationError } from '../utils/errors'
import { sendSuccess } from '../utils/success'

export class AuthController {
  // Register a new user
  static async register(req: Request, res: Response): Promise<void> {
    // Validation is now handled by Zod middleware
    const { username, email, password, userType } = req.body

    const result = await AuthService.register({
      username,
      email,
      password,
      userType
    })

    sendSuccess.created(res, result.message)
  }

  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    // Validation is now handled by Zod middleware
    const { email, password } = req.body

    const result = await AuthService.login({ email, password })

    sendSuccess.ok(res, 'Login successful', result)
  }

  // Get user profile
  static async getAuthMe(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const user = await AuthService.getAuthMe(userId)

    sendSuccess.ok(res, 'Profile retrieved successfully', user)
  }

  // Update user profile
  static async updateProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    // Validation is now handled by Zod middleware
    const { username, avatar } = req.body

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    const updatedUser = await AuthService.updateProfile(userId, {
      username,
      avatar
    })

    sendSuccess.ok(res, 'Profile updated successfully', { user: updatedUser })
  }

  // Change password
  static async changePassword(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    // Validation is now handled by Zod middleware
    const { currentPassword, newPassword } = req.body

    if (!userId) {
      throw new ValidationError('User ID is required')
    }

    await AuthService.changePassword(userId, {
      currentPassword,
      newPassword
    })

    sendSuccess.ok(res, 'Password changed successfully')
  }

  // Verify email
  static async verifyEmail(req: Request, res: Response): Promise<void> {
    const { token } = req.body

    const result = await AuthService.verifyEmail(token)

    sendSuccess.ok(res, 'Email verified successfully', result.message)
  }

  // Forgot password
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body

    const result = await AuthService.forgotPassword({ email })

    sendSuccess.ok(res, 'Password reset email sent successfully', result.message)
  }

  // Reset password
  static async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body

    const result = await AuthService.resetPassword({ token, newPassword })

    sendSuccess.ok(res, result.message)
  }

  // Google Register
  static async googleRegister(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body

    const result = await AuthService.googleRegister({ idToken })

    sendSuccess.created(res, 'Google registration successful', result)
  }

  // Google Login
  static async googleLogin(req: Request, res: Response): Promise<void> {
    const { idToken } = req.body

    const result = await AuthService.googleLogin({ idToken })

    sendSuccess.ok(res, 'Google login successful', result)
  }

  // Facebook Register
  static async facebookRegister(req: Request, res: Response): Promise<void> {
    const { accessToken } = req.body
    const result = await AuthService.facebookRegister({ accessToken })
    sendSuccess.created(res, 'Facebook registration successful', result)
  }

  // Facebook Login
  static async facebookLogin(req: Request, res: Response): Promise<void> {
    const { accessToken } = req.body
    const result = await AuthService.facebookLogin({ accessToken })
    sendSuccess.ok(res, 'Facebook login successful', result)
  }
}
