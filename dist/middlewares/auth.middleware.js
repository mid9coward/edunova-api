"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = void 0;
const auth_1 = require("../utils/auth");
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
// Extend Express Request interface to include user
const authMiddleware = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.substring(7) : null;
        if (!token) {
            throw new errors_1.AuthenticationError('Access token is required', errors_1.ErrorCodes.TOKEN_INVALID);
        }
        // Verify token
        const decoded = (0, auth_1.verifyToken)(token);
        // Check if user exists and is active
        const user = await models_1.User.findById(decoded.userId).select('-password');
        if (!user) {
            throw new errors_1.AuthenticationError('Invalid token - user not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        if (user.status === models_1.UserStatus.INACTIVE) {
            throw new errors_1.AuthenticationError('Account is not active', errors_1.ErrorCodes.ACCOUNT_INACTIVE);
        }
        if (user.status === models_1.UserStatus.BANNED) {
            throw new errors_1.AuthenticationError('Account is banned', errors_1.ErrorCodes.ACCOUNT_BANNED);
        }
        // Attach user info to request
        req.user = {
            userId: user._id.toString(),
            roles: user.roles.map((role) => role.toString())
        };
        next();
    }
    catch (error) {
        // If it's already one of our custom errors, pass it to the error handler
        if (error instanceof errors_1.AuthenticationError) {
            return next(error);
        }
        // For any other errors (like JWT verification errors), treat as authentication error
        console.error('Auth middleware error:', error);
        next(new errors_1.AuthenticationError('Invalid token', errors_1.ErrorCodes.TOKEN_INVALID));
    }
};
exports.authMiddleware = authMiddleware;
