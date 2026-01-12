import { Router } from 'express'
import { AuthController } from '../controllers/auth.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { authRateLimit, createAccountRateLimit, passwordResetRateLimit } from '../middlewares/rate-limit.middleware'
import { loadUserPermissions } from '../middlewares/rbac.middleware'
import { validate } from '../middlewares/validation.middleware'
import {
  changePasswordSchema,
  facebookLoginSchema,
  facebookRegisterSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  googleRegisterSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  updateProfileSchema
} from '../schemas/auth.schema'

const router = Router()

/**
 * Public Routes
 */

// User registration
router.post('/register', createAccountRateLimit, validate(registerSchema), asyncHandler(AuthController.register))

// User login
router.post('/login', authRateLimit, validate(loginSchema), asyncHandler(AuthController.login))

// Email verification
router.post('/verify-email', authRateLimit, asyncHandler(AuthController.verifyEmail))

// Password reset request
router.post(
  '/forgot-password',
  passwordResetRateLimit,
  validate(forgotPasswordSchema),
  asyncHandler(AuthController.forgotPassword)
)

// Password reset confirmation
router.post(
  '/reset-password',
  passwordResetRateLimit,
  validate(resetPasswordSchema),
  asyncHandler(AuthController.resetPassword)
)

// Google authentication routes
router.post(
  '/register-google',
  createAccountRateLimit,
  validate(googleRegisterSchema),
  asyncHandler(AuthController.googleRegister)
)
router.post('/login-google', authRateLimit, validate(googleLoginSchema), asyncHandler(AuthController.googleLogin))

// Facebook authentication routes
router.post(
  '/register-facebook',
  createAccountRateLimit,
  validate(facebookRegisterSchema),
  asyncHandler(AuthController.facebookRegister)
)
router.post('/login-facebook', authRateLimit, validate(facebookLoginSchema), asyncHandler(AuthController.facebookLogin))

/**
 * Protected Routes (require authentication and admin permissions)
 */
router.use(authMiddleware)
router.use(loadUserPermissions)

// Get current user profile
router.get('/me', asyncHandler(AuthController.getAuthMe))

// Update user profile
router.put('/profile', validate(updateProfileSchema), asyncHandler(AuthController.updateProfile))

// Change password
router.put('/change-password', validate(changePasswordSchema), asyncHandler(AuthController.changePassword))

export default router
