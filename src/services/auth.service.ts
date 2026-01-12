import th from 'zod/v4/locales/th.js'
import { UserStatus, UserType } from '../enums'
import { User, Role } from '../models'
import {
  comparePassword,
  generateToken,
  generateVerificationToken,
  generatePasswordResetToken,
  hashPassword,
  verifyToken
} from '../utils/auth'
import { EmailService } from '../utils/email'
import { AuthenticationError, ConflictError, ErrorCodes, NotFoundError, ValidationError } from '../utils/errors'
import { verifyFacebookAccessToken } from '../utils/facebook-auth'
import { verifyGoogleIdToken } from '../utils/google-auth'
import { RoleService } from './role.service'

export interface RegisterData {
  username: string
  email: string
  password: string
  userType?: UserType
}

export interface LoginData {
  email: string
  password: string
}

export interface UpdateProfileData {
  username?: string
  avatar?: string
}

export interface ChangePasswordData {
  currentPassword: string
  newPassword: string
}

export interface ForgotPasswordData {
  email: string
}

export interface ResetPasswordData {
  token: string
  newPassword: string
}

export interface GoogleRegisterData {
  idToken: string
}

export interface GoogleLoginData {
  idToken: string
}

export interface FacebookRegisterData {
  accessToken: string
}

export interface FacebookLoginData {
  accessToken: string
}

export class AuthService {
  static async register(data: RegisterData) {
    const { username, email, password, userType = UserType.DEFAULT } = data

    // Check if user already exists
    const existingUser = await User.findOne({ email })

    if (existingUser) {
      throw new ConflictError('User with this email already exists', ErrorCodes.USER_ALREADY_EXISTS)
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Get default role (Guest) - find by name or create a default
    const defaultRole = await Role.findOne({ name: 'Guest' })

    // Create new user with INACTIVE status
    const newUser = new User({
      username,
      email,
      password: hashedPassword,
      userType,
      status: UserStatus.INACTIVE, // User starts as inactive until email is verified
      roles: [defaultRole?._id],
      courses: []
    })

    await newUser.save()

    // Generate verification token
    const verificationToken = generateVerificationToken(newUser._id.toString())

    // Send verification email
    await EmailService.sendVerificationEmail({
      email: newUser.email,
      token: verificationToken,
      userName: newUser.username
    })

    return {
      message: 'Registration successful. Please check your email to verify your account.'
    }
  }

  static async verifyEmail(token: string) {
    try {
      // Verify the token and get user ID
      const decoded = verifyToken(token) as { userId: string }

      // Find the user
      const user = await User.findById(decoded.userId)

      if (!user) {
        throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
      }

      // Check if user is already active
      if (user.status === UserStatus.ACTIVE) {
        throw new ValidationError('Email is already verified', ErrorCodes.EMAIL_ALREADY_VERIFIED)
      }

      // Update user status to active
      user.status = UserStatus.ACTIVE
      await user.save()

      return {
        message: 'Email verified successfully. You can now log in to your account.'
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new ValidationError(
            'Verification token has expired. Please request a new verification email.',
            ErrorCodes.TOKEN_EXPIRED
          )
        }
        if (error.name === 'JsonWebTokenError') {
          throw new ValidationError(
            'Invalid verification token. Please check your verification link.',
            ErrorCodes.TOKEN_INVALID
          )
        }
      }

      // Re-throw any other errors (including our custom errors)
      throw error
    }
  }

  static async login(data: LoginData) {
    const { email, password } = data

    // Find user by email
    const user = await User.findOne({ email }).populate('roles')

    if (!user) {
      throw new AuthenticationError('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS)
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('Account is not active', ErrorCodes.ACCOUNT_INACTIVE)
    }

    // Compare password
    const isPasswordValid = await comparePassword(password, user.password)

    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password', ErrorCodes.INVALID_CREDENTIALS)
    }

    // Generate JWT token
    const token = generateToken(user._id.toString())

    // Return user without password

    return { token }
  }

  static async getAuthMe(userId: string) {
    const user = await User.findById(userId).populate('roles').select('-password')

    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    // Get all permissions including inherited permissions
    const roleService = new RoleService()
    const permissions = await roleService.getUserPermissions(userId)

    // Return user with permissions included and courses as array of IDs
    return {
      ...user.toObject(),
      userPermissions: permissions
    }
  }

  static async updateProfile(userId: string, data: UpdateProfileData) {
    const { username, avatar } = data

    const updateData: Partial<UpdateProfileData> = {}
    if (username) updateData.username = username
    updateData.avatar = avatar

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select(
      '-password'
    )

    return updatedUser
  }

  static async changePassword(userId: string, data: ChangePasswordData) {
    const { currentPassword, newPassword } = data

    const user = await User.findById(userId)

    if (!user) {
      throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
    }

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password)

    if (!isCurrentPasswordValid) {
      throw new AuthenticationError('Current password is incorrect', ErrorCodes.INVALID_CREDENTIALS)
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword)

    // Update password
    await User.findByIdAndUpdate(userId, {
      password: hashedNewPassword
    })

    return { message: 'Password changed successfully' }
  }

  static async forgotPassword(data: ForgotPasswordData) {
    const { email } = data

    // Find user by email
    const user = await User.findOne({ email })

    if (!user) {
      // Don't reveal if user exists or not for security reasons
      throw new NotFoundError('User with this email address not found.', ErrorCodes.USER_NOT_FOUND)
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError(
        'Account is not active. Please verify your email first.',
        ErrorCodes.ACCOUNT_INACTIVE
      )
    }

    // Generate password reset token
    const resetToken = generatePasswordResetToken(user._id.toString())

    // TODO: Implement email service to send reset password email
    // await EmailService.sendResetPasswordEmail({
    //   email: user.email,
    //   token: resetToken,
    //   userName: user.username
    // })

    // For now, we just return success message since email service is commented out
    console.log(`Password reset token generated: ${resetToken.substring(0, 10)}...`) // Log part of token for debugging

    return {
      message: 'If an account with that email exists, a password reset link has been sent.'
    }
  }

  static async resetPassword(data: ResetPasswordData) {
    const { token, newPassword } = data

    try {
      // Verify the token and get user ID
      const decoded = verifyToken(token) as { userId: string; type: string }

      // Ensure this is a password reset token
      if (decoded.type !== 'password_reset') {
        throw new ValidationError('Invalid password reset token', ErrorCodes.TOKEN_INVALID)
      }

      // Find the user
      const user = await User.findById(decoded.userId)

      if (!user) {
        throw new NotFoundError('User not found', ErrorCodes.USER_NOT_FOUND)
      }

      // Hash new password
      const hashedNewPassword = await hashPassword(newPassword)

      // Update password
      await User.findByIdAndUpdate(user._id, {
        password: hashedNewPassword
      })

      return {
        message: 'Password has been reset successfully. You can now log in with your new password.'
      }
    } catch (error) {
      if (error instanceof Error) {
        if (error.name === 'TokenExpiredError') {
          throw new ValidationError(
            'Password reset token has expired. Please request a new password reset.',
            ErrorCodes.TOKEN_EXPIRED
          )
        }
        if (error.name === 'JsonWebTokenError') {
          throw new ValidationError(
            'Invalid password reset token. Please check your reset link.',
            ErrorCodes.TOKEN_INVALID
          )
        }
      }

      // Re-throw any other errors (including our custom errors)
      throw error
    }
  }

  static async googleRegister(data: GoogleRegisterData) {
    const { idToken } = data

    // Verify Google ID token
    const googlePayload = await verifyGoogleIdToken(idToken)

    if (!googlePayload.email_verified) {
      throw new ValidationError('Google email is not verified', ErrorCodes.EMAIL_NOT_VERIFIED)
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: googlePayload.email })

    if (existingUser) {
      throw new ConflictError('User with this email already exists', ErrorCodes.USER_ALREADY_EXISTS)
    }

    // Get default role (Guest)
    const defaultRole = await Role.findOne({ name: 'Guest' })

    // Create new user with ACTIVE status (Google email is already verified)
    const newUser = new User({
      username: googlePayload.name,
      email: googlePayload.email,
      password: '', // No password for Google users
      userType: UserType.GOOGLE, // Set userType to GOOGLE
      status: UserStatus.ACTIVE, // Google users are immediately active
      roles: [defaultRole?._id],
      courses: [],
      avatar: googlePayload.picture
    })

    await newUser.save()

    return newUser
  }

  static async googleLogin(data: GoogleLoginData) {
    const { idToken } = data

    // Verify Google ID token
    const googlePayload = await verifyGoogleIdToken(idToken)

    if (!googlePayload.email_verified) {
      throw new ValidationError('Google email is not verified', ErrorCodes.EMAIL_NOT_VERIFIED)
    }

    // Find user by email
    const user = await User.findOne({ email: googlePayload.email }).populate('roles')

    if (!user) {
      throw new NotFoundError('User not found. Please register first.', ErrorCodes.USER_NOT_FOUND)
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('Account is not active', ErrorCodes.ACCOUNT_INACTIVE)
    }

    // Generate JWT token
    const token = generateToken(user._id.toString())

    return {
      token
    }
  }

  static async facebookLogin(data: FacebookLoginData) {
    const { accessToken } = data

    // Verify Facebook access token
    const facebookPayload = await verifyFacebookAccessToken(accessToken)

    if (!facebookPayload.email) {
      throw new ValidationError('Facebook email is required', ErrorCodes.EMAIL_NOT_VERIFIED)
    }

    // Find user by email
    const user = await User.findOne({ email: facebookPayload.email }).populate('roles')

    if (!user) {
      throw new NotFoundError('User not found. Please register first.', ErrorCodes.USER_NOT_FOUND)
    }

    // Check if user is active
    if (user.status !== UserStatus.ACTIVE) {
      throw new AuthenticationError('Account is not active', ErrorCodes.ACCOUNT_INACTIVE)
    }

    // Generate JWT token
    const token = generateToken(user._id.toString())

    return {
      token
    }
  }

  static async facebookRegister(data: FacebookRegisterData) {
    const { accessToken } = data
    // Verify Facebook access token
    const facebookPayload = await verifyFacebookAccessToken(accessToken)
    if (!facebookPayload.email) {
      throw new ValidationError('Facebook email is required', ErrorCodes.EMAIL_NOT_VERIFIED)
    }
    // Check if user already exists
    const existingUser = await User.findOne({ email: facebookPayload.email })
    if (existingUser) {
      throw new ConflictError('User with this email already exists', ErrorCodes.USER_ALREADY_EXISTS)
    }
    // Get default role (Guest) - find by name or create a default
    const defaultRole = await Role.findOne({ name: 'Guest' })
    // Create new user with ACTIVE status (Facebook email is already verified)
    const newUser = new User({
      username: facebookPayload.name,
      email: facebookPayload.email,
      password: '', // No password for Facebook users
      userType: UserType.FACEBOOK, // Set userType to FACEBOOK
      status: UserStatus.ACTIVE, // Facebook users are immediately active
      roles: [defaultRole?._id],
      courses: [],
      avatar: facebookPayload.picture
    })
    await newUser.save()
    return newUser
  }
}
