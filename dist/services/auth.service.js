"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const enums_1 = require("../enums");
const models_1 = require("../models");
const auth_1 = require("../utils/auth");
const email_1 = require("../utils/email");
const errors_1 = require("../utils/errors");
const facebook_auth_1 = require("../utils/facebook-auth");
const google_auth_1 = require("../utils/google-auth");
const role_service_1 = require("./role.service");
class AuthService {
    static async register(data) {
        const { username, email, password, userType = enums_1.UserType.DEFAULT } = data;
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email });
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists', errors_1.ErrorCodes.USER_ALREADY_EXISTS);
        }
        // Hash password
        const hashedPassword = await (0, auth_1.hashPassword)(password);
        // Get default role (Guest) - find by name or create a default
        const defaultRole = await models_1.Role.findOne({ name: 'Guest' });
        // Create new user with INACTIVE status
        const newUser = new models_1.User({
            username,
            email,
            password: hashedPassword,
            userType,
            status: enums_1.UserStatus.INACTIVE, // User starts as inactive until email is verified
            roles: [defaultRole?._id],
            courses: []
        });
        await newUser.save();
        // Generate verification token
        const verificationToken = (0, auth_1.generateVerificationToken)(newUser._id.toString());
        // Send verification email
        await email_1.EmailService.sendVerificationEmail({
            email: newUser.email,
            token: verificationToken,
            userName: newUser.username
        });
        return {
            message: 'Registration successful. Please check your email to verify your account.'
        };
    }
    static async verifyEmail(token) {
        try {
            // Verify the token and get user ID
            const decoded = (0, auth_1.verifyToken)(token);
            // Find the user
            const user = await models_1.User.findById(decoded.userId);
            if (!user) {
                throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
            }
            // Check if user is already active
            if (user.status === enums_1.UserStatus.ACTIVE) {
                throw new errors_1.ValidationError('Email is already verified', errors_1.ErrorCodes.EMAIL_ALREADY_VERIFIED);
            }
            // Update user status to active
            user.status = enums_1.UserStatus.ACTIVE;
            await user.save();
            return {
                message: 'Email verified successfully. You can now log in to your account.'
            };
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === 'TokenExpiredError') {
                    throw new errors_1.ValidationError('Verification token has expired. Please request a new verification email.', errors_1.ErrorCodes.TOKEN_EXPIRED);
                }
                if (error.name === 'JsonWebTokenError') {
                    throw new errors_1.ValidationError('Invalid verification token. Please check your verification link.', errors_1.ErrorCodes.TOKEN_INVALID);
                }
            }
            // Re-throw any other errors (including our custom errors)
            throw error;
        }
    }
    static async login(data) {
        const { email, password } = data;
        // Find user by email
        const user = await models_1.User.findOne({ email }).populate('roles');
        if (!user) {
            throw new errors_1.AuthenticationError('Invalid email or password', errors_1.ErrorCodes.INVALID_CREDENTIALS);
        }
        // Check if user is active
        if (user.status !== enums_1.UserStatus.ACTIVE) {
            throw new errors_1.AuthenticationError('Account is not active', errors_1.ErrorCodes.ACCOUNT_INACTIVE);
        }
        // Compare password
        const isPasswordValid = await (0, auth_1.comparePassword)(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.AuthenticationError('Invalid email or password', errors_1.ErrorCodes.INVALID_CREDENTIALS);
        }
        // Generate JWT token
        const token = (0, auth_1.generateToken)(user._id.toString());
        // Return user without password
        return { token };
    }
    static async getAuthMe(userId) {
        const user = await models_1.User.findById(userId).populate('roles').select('-password');
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Get all permissions including inherited permissions
        const roleService = new role_service_1.RoleService();
        const permissions = await roleService.getUserPermissions(userId);
        // Return user with permissions included and courses as array of IDs
        return {
            ...user.toObject(),
            userPermissions: permissions
        };
    }
    static async updateProfile(userId, data) {
        const { username, avatar } = data;
        const updateData = {};
        if (username)
            updateData.username = username;
        updateData.avatar = avatar;
        const updatedUser = await models_1.User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select('-password');
        return updatedUser;
    }
    static async changePassword(userId, data) {
        const { currentPassword, newPassword } = data;
        const user = await models_1.User.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Verify current password
        const isCurrentPasswordValid = await (0, auth_1.comparePassword)(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            throw new errors_1.AuthenticationError('Current password is incorrect', errors_1.ErrorCodes.INVALID_CREDENTIALS);
        }
        // Hash new password
        const hashedNewPassword = await (0, auth_1.hashPassword)(newPassword);
        // Update password
        await models_1.User.findByIdAndUpdate(userId, {
            password: hashedNewPassword
        });
        return { message: 'Password changed successfully' };
    }
    static async forgotPassword(data) {
        const { email } = data;
        // Find user by email
        const user = await models_1.User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not for security reasons
            throw new errors_1.NotFoundError('User with this email address not found.', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Check if user is active
        if (user.status !== enums_1.UserStatus.ACTIVE) {
            throw new errors_1.AuthenticationError('Account is not active. Please verify your email first.', errors_1.ErrorCodes.ACCOUNT_INACTIVE);
        }
        // Generate password reset token
        const resetToken = (0, auth_1.generatePasswordResetToken)(user._id.toString());
        // TODO: Implement email service to send reset password email
        // await EmailService.sendResetPasswordEmail({
        //   email: user.email,
        //   token: resetToken,
        //   userName: user.username
        // })
        // For now, we just return success message since email service is commented out
        console.log(`Password reset token generated: ${resetToken.substring(0, 10)}...`); // Log part of token for debugging
        return {
            message: 'If an account with that email exists, a password reset link has been sent.'
        };
    }
    static async resetPassword(data) {
        const { token, newPassword } = data;
        try {
            // Verify the token and get user ID
            const decoded = (0, auth_1.verifyToken)(token);
            // Ensure this is a password reset token
            if (decoded.type !== 'password_reset') {
                throw new errors_1.ValidationError('Invalid password reset token', errors_1.ErrorCodes.TOKEN_INVALID);
            }
            // Find the user
            const user = await models_1.User.findById(decoded.userId);
            if (!user) {
                throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
            }
            // Hash new password
            const hashedNewPassword = await (0, auth_1.hashPassword)(newPassword);
            // Update password
            await models_1.User.findByIdAndUpdate(user._id, {
                password: hashedNewPassword
            });
            return {
                message: 'Password has been reset successfully. You can now log in with your new password.'
            };
        }
        catch (error) {
            if (error instanceof Error) {
                if (error.name === 'TokenExpiredError') {
                    throw new errors_1.ValidationError('Password reset token has expired. Please request a new password reset.', errors_1.ErrorCodes.TOKEN_EXPIRED);
                }
                if (error.name === 'JsonWebTokenError') {
                    throw new errors_1.ValidationError('Invalid password reset token. Please check your reset link.', errors_1.ErrorCodes.TOKEN_INVALID);
                }
            }
            // Re-throw any other errors (including our custom errors)
            throw error;
        }
    }
    static async googleRegister(data) {
        const { idToken } = data;
        // Verify Google ID token
        const googlePayload = await (0, google_auth_1.verifyGoogleIdToken)(idToken);
        if (!googlePayload.email_verified) {
            throw new errors_1.ValidationError('Google email is not verified', errors_1.ErrorCodes.EMAIL_NOT_VERIFIED);
        }
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email: googlePayload.email });
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists', errors_1.ErrorCodes.USER_ALREADY_EXISTS);
        }
        // Get default role (Guest)
        const defaultRole = await models_1.Role.findOne({ name: 'Guest' });
        // Create new user with ACTIVE status (Google email is already verified)
        const newUser = new models_1.User({
            username: googlePayload.name,
            email: googlePayload.email,
            password: '', // No password for Google users
            userType: enums_1.UserType.GOOGLE, // Set userType to GOOGLE
            status: enums_1.UserStatus.ACTIVE, // Google users are immediately active
            roles: [defaultRole?._id],
            courses: [],
            avatar: googlePayload.picture
        });
        await newUser.save();
        return newUser;
    }
    static async googleLogin(data) {
        const { idToken } = data;
        // Verify Google ID token
        const googlePayload = await (0, google_auth_1.verifyGoogleIdToken)(idToken);
        if (!googlePayload.email_verified) {
            throw new errors_1.ValidationError('Google email is not verified', errors_1.ErrorCodes.EMAIL_NOT_VERIFIED);
        }
        // Find user by email
        const user = await models_1.User.findOne({ email: googlePayload.email }).populate('roles');
        if (!user) {
            throw new errors_1.NotFoundError('User not found. Please register first.', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Check if user is active
        if (user.status !== enums_1.UserStatus.ACTIVE) {
            throw new errors_1.AuthenticationError('Account is not active', errors_1.ErrorCodes.ACCOUNT_INACTIVE);
        }
        // Generate JWT token
        const token = (0, auth_1.generateToken)(user._id.toString());
        return {
            token
        };
    }
    static async facebookLogin(data) {
        const { accessToken } = data;
        // Verify Facebook access token
        const facebookPayload = await (0, facebook_auth_1.verifyFacebookAccessToken)(accessToken);
        if (!facebookPayload.email) {
            throw new errors_1.ValidationError('Facebook email is required', errors_1.ErrorCodes.EMAIL_NOT_VERIFIED);
        }
        // Find user by email
        const user = await models_1.User.findOne({ email: facebookPayload.email }).populate('roles');
        if (!user) {
            throw new errors_1.NotFoundError('User not found. Please register first.', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Check if user is active
        if (user.status !== enums_1.UserStatus.ACTIVE) {
            throw new errors_1.AuthenticationError('Account is not active', errors_1.ErrorCodes.ACCOUNT_INACTIVE);
        }
        // Generate JWT token
        const token = (0, auth_1.generateToken)(user._id.toString());
        return {
            token
        };
    }
    static async facebookRegister(data) {
        const { accessToken } = data;
        // Verify Facebook access token
        const facebookPayload = await (0, facebook_auth_1.verifyFacebookAccessToken)(accessToken);
        if (!facebookPayload.email) {
            throw new errors_1.ValidationError('Facebook email is required', errors_1.ErrorCodes.EMAIL_NOT_VERIFIED);
        }
        // Check if user already exists
        const existingUser = await models_1.User.findOne({ email: facebookPayload.email });
        if (existingUser) {
            throw new errors_1.ConflictError('User with this email already exists', errors_1.ErrorCodes.USER_ALREADY_EXISTS);
        }
        // Get default role (Guest) - find by name or create a default
        const defaultRole = await models_1.Role.findOne({ name: 'Guest' });
        // Create new user with ACTIVE status (Facebook email is already verified)
        const newUser = new models_1.User({
            username: facebookPayload.name,
            email: facebookPayload.email,
            password: '', // No password for Facebook users
            userType: enums_1.UserType.FACEBOOK, // Set userType to FACEBOOK
            status: enums_1.UserStatus.ACTIVE, // Facebook users are immediately active
            roles: [defaultRole?._id],
            courses: [],
            avatar: facebookPayload.picture
        });
        await newUser.save();
        return newUser;
    }
}
exports.AuthService = AuthService;
