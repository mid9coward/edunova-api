"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const rbac_middleware_1 = require("../middlewares/rbac.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const auth_schema_1 = require("../schemas/auth.schema");
const router = (0, express_1.Router)();
/**
 * Public Routes
 */
// User registration
router.post('/register', rate_limit_middleware_1.createAccountRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.registerSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.register));
// User login
router.post('/login', rate_limit_middleware_1.authRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.loginSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.login));
// Email verification
router.post('/verify-email', rate_limit_middleware_1.authRateLimit, (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.verifyEmail));
// Password reset request
router.post('/forgot-password', rate_limit_middleware_1.passwordResetRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.forgotPasswordSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.forgotPassword));
// Password reset confirmation
router.post('/reset-password', rate_limit_middleware_1.passwordResetRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.resetPasswordSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.resetPassword));
// Google authentication routes
router.post('/register-google', rate_limit_middleware_1.createAccountRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.googleRegisterSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.googleRegister));
router.post('/login-google', rate_limit_middleware_1.authRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.googleLoginSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.googleLogin));
// Facebook authentication routes
router.post('/register-facebook', rate_limit_middleware_1.createAccountRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.facebookRegisterSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.facebookRegister));
router.post('/login-facebook', rate_limit_middleware_1.authRateLimit, (0, validation_middleware_1.validate)(auth_schema_1.facebookLoginSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.facebookLogin));
/**
 * Protected Routes (require authentication and admin permissions)
 */
router.use(auth_middleware_1.authMiddleware);
router.use(rbac_middleware_1.loadUserPermissions);
// Get current user profile
router.get('/me', (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.getAuthMe));
// Update user profile
router.put('/profile', (0, validation_middleware_1.validate)(auth_schema_1.updateProfileSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.updateProfile));
// Change password
router.put('/change-password', (0, validation_middleware_1.validate)(auth_schema_1.changePasswordSchema), (0, error_middleware_1.asyncHandler)(auth_controller_1.AuthController.changePassword));
exports.default = router;
