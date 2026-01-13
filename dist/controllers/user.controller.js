"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("../services/user.service");
const errors_1 = require("../utils/errors");
const success_1 = require("../utils/success");
class UserController {
    /**
     * Get all users with pagination and filtering
     */
    static async getUsers(req, res) {
        const result = await user_service_1.UserService.getUsers(req.query);
        success_1.sendSuccess.ok(res, 'Users retrieved successfully', result);
    }
    /**
     * Get user by ID
     */
    static async getUserById(req, res) {
        const result = await user_service_1.UserService.getUserById(req.params.userId);
        success_1.sendSuccess.ok(res, 'User retrieved successfully', result);
    }
    /**
     * Update user (admin-level updates)
     */
    static async updateUser(req, res) {
        const result = await user_service_1.UserService.updateUser(req.params.userId, req.body);
        success_1.sendSuccess.ok(res, 'User updated successfully', result);
    }
    /**
     * Delete user (soft delete)
     */
    static async deleteUser(req, res) {
        await user_service_1.UserService.deleteUser(req.params.userId);
        success_1.sendSuccess.ok(res, 'User deleted successfully');
    }
    /**
     * Get current user profile (from token)
     */
    static async getCurrentUser(req, res) {
        // Get user ID from request (set by auth middleware)
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const result = await user_service_1.UserService.getUserById(userId);
        success_1.sendSuccess.ok(res, 'Current user profile retrieved successfully', result);
    }
    /**
     * Update current user profile (from token)
     */
    static async updateProfile(req, res) {
        // Get user ID from request (set by auth middleware)
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const result = await user_service_1.UserService.updateProfile(userId, req.body);
        success_1.sendSuccess.ok(res, 'Profile updated successfully', result);
    }
}
exports.UserController = UserController;
