"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("../services/auth.service");
const errors_1 = require("../utils/errors");
const success_1 = require("../utils/success");
class AuthController {
    // Register a new user
    static async register(req, res) {
        // Validation is now handled by Zod middleware
        const { username, email, password, userType } = req.body;
        const result = await auth_service_1.AuthService.register({
            username,
            email,
            password,
            userType
        });
        success_1.sendSuccess.created(res, result.message);
    }
    // Login user
    static async login(req, res) {
        // Validation is now handled by Zod middleware
        const { email, password } = req.body;
        const result = await auth_service_1.AuthService.login({ email, password });
        success_1.sendSuccess.ok(res, 'Login successful', result);
    }
    // Get user profile
    static async getAuthMe(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const user = await auth_service_1.AuthService.getAuthMe(userId);
        success_1.sendSuccess.ok(res, 'Profile retrieved successfully', user);
    }
    // Update user profile
    static async updateProfile(req, res) {
        const userId = req.user?.userId;
        // Validation is now handled by Zod middleware
        const { username, avatar } = req.body;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        const updatedUser = await auth_service_1.AuthService.updateProfile(userId, {
            username,
            avatar
        });
        success_1.sendSuccess.ok(res, 'Profile updated successfully', { user: updatedUser });
    }
    // Change password
    static async changePassword(req, res) {
        const userId = req.user?.userId;
        // Validation is now handled by Zod middleware
        const { currentPassword, newPassword } = req.body;
        if (!userId) {
            throw new errors_1.ValidationError('User ID is required');
        }
        await auth_service_1.AuthService.changePassword(userId, {
            currentPassword,
            newPassword
        });
        success_1.sendSuccess.ok(res, 'Password changed successfully');
    }
    // Verify email
    static async verifyEmail(req, res) {
        const { token } = req.body;
        const result = await auth_service_1.AuthService.verifyEmail(token);
        success_1.sendSuccess.ok(res, 'Email verified successfully', result.message);
    }
    // Forgot password
    static async forgotPassword(req, res) {
        const { email } = req.body;
        const result = await auth_service_1.AuthService.forgotPassword({ email });
        success_1.sendSuccess.ok(res, 'Password reset email sent successfully', result.message);
    }
    // Reset password
    static async resetPassword(req, res) {
        const { token, newPassword } = req.body;
        const result = await auth_service_1.AuthService.resetPassword({ token, newPassword });
        success_1.sendSuccess.ok(res, result.message);
    }
    // Google Register
    static async googleRegister(req, res) {
        const { idToken } = req.body;
        const result = await auth_service_1.AuthService.googleRegister({ idToken });
        success_1.sendSuccess.created(res, 'Google registration successful', result);
    }
    // Google Login
    static async googleLogin(req, res) {
        const { idToken } = req.body;
        const result = await auth_service_1.AuthService.googleLogin({ idToken });
        success_1.sendSuccess.ok(res, 'Google login successful', result);
    }
    // Facebook Register
    static async facebookRegister(req, res) {
        const { accessToken } = req.body;
        const result = await auth_service_1.AuthService.facebookRegister({ accessToken });
        success_1.sendSuccess.created(res, 'Facebook registration successful', result);
    }
    // Facebook Login
    static async facebookLogin(req, res) {
        const { accessToken } = req.body;
        const result = await auth_service_1.AuthService.facebookLogin({ accessToken });
        success_1.sendSuccess.ok(res, 'Facebook login successful', result);
    }
}
exports.AuthController = AuthController;
