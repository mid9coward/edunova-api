"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const role_1 = require("../models/role");
const user_1 = require("../models/user");
const errors_1 = require("../utils/errors");
class UserService {
    /**
     * Get all users with pagination and filtering
     */
    static async getUsers(options = {}) {
        const { page = 1, limit = 10, search, status, userType, roles } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter object
        const filter = {};
        if (search) {
            filter.$or = [{ username: { $regex: search, $options: 'i' } }, { email: { $regex: search, $options: 'i' } }];
        }
        if (status) {
            if (Array.isArray(status)) {
                // Multiple status values
                filter.status = { $in: status };
            }
            else if (typeof status === 'string' && status.includes(',')) {
                // Comma-separated string
                const statusArray = status.split(',').map((s) => s.trim());
                filter.status = { $in: statusArray };
            }
            else {
                // Single status value
                filter.status = status;
            }
        }
        if (userType) {
            if (Array.isArray(userType)) {
                // Multiple userType values
                filter.userType = { $in: userType };
            }
            else if (typeof userType === 'string' && userType.includes(',')) {
                // Comma-separated string
                const userTypeArray = userType.split(',').map((s) => s.trim());
                filter.userType = { $in: userTypeArray };
            }
            else {
                // Single userType value
                filter.userType = userType;
            }
        }
        if (roles && roles.length > 0) {
            // Find roles by ID or name
            const roleIds = [];
            for (const roleData of roles) {
                let role;
                if (mongoose_1.default.Types.ObjectId.isValid(roleData)) {
                    role = await role_1.Role.findById(roleData);
                }
                else {
                    role = await role_1.Role.findOne({ name: roleData });
                }
                if (role) {
                    roleIds.push(role._id);
                }
            }
            if (roleIds.length > 0) {
                filter.roles = { $in: roleIds };
            }
        }
        // Build sort object - default to createdAt desc
        const sort = { createdAt: -1 };
        // Execute queries in parallel
        const [users, total] = await Promise.all([
            user_1.User.find(filter)
                .populate('roles', 'name description')
                .sort(sort)
                .skip(skip)
                .limit(limitNum)
                .select('-password')
                .lean(),
            user_1.User.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(total / limitNum);
        return {
            users: users,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get user by ID
     */
    static async getUserById(userId) {
        const user = await user_1.User.findById(userId)
            .populate('roles', 'name description permissions')
            .populate('courses', 'title description')
            .select('-password');
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        return user;
    }
    /**
     * Update user profile (for user-owned updates)
     */
    static async updateProfile(userId, updateData) {
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Check if username is being updated and is unique
        if (updateData.username && updateData.username !== user.username) {
            const existingUsername = await user_1.User.findOne({
                username: updateData.username,
                _id: { $ne: userId }
            });
            if (existingUsername) {
                throw new errors_1.ConflictError('Username already exists', errors_1.ErrorCodes.USERNAME_TAKEN);
            }
            user.username = updateData.username;
        }
        // Check if email is being updated and is unique
        if (updateData.email && updateData.email !== user.email) {
            const existingEmail = await user_1.User.findOne({
                email: updateData.email,
                _id: { $ne: userId }
            });
            if (existingEmail) {
                throw new errors_1.ConflictError('Email already exists', errors_1.ErrorCodes.EMAIL_ALREADY_REGISTERED);
            }
            user.email = updateData.email;
        }
        // Update avatar if provided
        if (updateData.avatar !== undefined) {
            user.avatar = updateData.avatar;
        }
        await user.save();
        return user;
    }
    /**
     * Update user (for admin-level updates)
     */
    static async updateUser(userId, updateData) {
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Update roles if provided
        if (updateData.roles && updateData.roles.length > 0) {
            const roles = [];
            for (const roleData of updateData.roles) {
                let role;
                if (mongoose_1.default.Types.ObjectId.isValid(roleData)) {
                    role = await role_1.Role.findById(roleData);
                }
                else {
                    role = await role_1.Role.findOne({ name: roleData });
                }
                if (!role) {
                    throw new errors_1.NotFoundError(`Role not found: ${roleData}`, errors_1.ErrorCodes.ROLE_NOT_FOUND);
                }
                roles.push(role._id);
            }
            user.roles = roles;
        }
        // Update status if provided
        if (updateData.status) {
            user.status = updateData.status;
        }
        await user.save();
        return user;
    }
    /**
     * Delete user (soft delete by setting status to DELETED)
     */
    static async deleteUser(userId) {
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        await user_1.User.findByIdAndDelete(userId);
    }
}
exports.UserService = UserService;
