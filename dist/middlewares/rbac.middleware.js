"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasPermission = exports.requireOwnershipOrPermission = exports.requirePermission = exports.loadUserPermissions = void 0;
const role_1 = require("../models/role");
const errors_1 = require("../utils/errors");
/**
 * RBAC (Role-Based Access Control) Middleware
 * Handles permission checking and authorization
 */
/**
 * Middleware to load user permissions from their role
 */
const loadUserPermissions = async (req, res, next) => {
    try {
        // Skip if no user (for public routes)
        if (!req.user?.userId) {
            return next();
        }
        // Get user's roles from the user object (assuming it's populated)
        const roleIds = req.user.roles;
        if (!roleIds || roleIds.length === 0) {
            throw new errors_1.AuthorizationError('User has no assigned roles', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        // Fetch roles with permissions
        const roles = await role_1.Role.find({ _id: { $in: roleIds } }).lean();
        if (!roles || roles.length === 0) {
            throw new errors_1.AuthorizationError('Invalid user roles', errors_1.ErrorCodes.ROLE_NOT_FOUND);
        }
        // Collect all permissions from all roles (merge and deduplicate)
        const allPermissions = new Set();
        const roleNames = [];
        roles.forEach((role) => {
            roleNames.push(role.name);
            if (role.permissions) {
                role.permissions.forEach((permission) => allPermissions.add(permission));
            }
        });
        // Add permissions and roles to request
        req.userPermissions = Array.from(allPermissions);
        req.userRoles = roleNames;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.loadUserPermissions = loadUserPermissions;
/**
 * Creates a middleware to check if user has required permission(s)
 * @param requiredPermissions - Single permission or array of permissions
 * @param requireAll - If true, user must have ALL permissions. If false, user needs ANY permission
 */
const requirePermission = (requiredPermissions, requireAll = true) => {
    return (req, res, next) => {
        try {
            // Convert single permission to array
            const permissions = Array.isArray(requiredPermissions) ? requiredPermissions : [requiredPermissions];
            // Check if user permissions are loaded
            if (!req.userPermissions) {
                throw new errors_1.AuthorizationError('User permissions not loaded', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
            }
            // Check permissions
            const hasPermission = requireAll
                ? permissions.every((permission) => req.userPermissions.includes(permission))
                : permissions.some((permission) => req.userPermissions.includes(permission));
            if (!hasPermission) {
                const permissionList = permissions.join(', ');
                const operator = requireAll ? 'all' : 'any';
                throw new errors_1.AuthorizationError(`Access denied. Required ${operator} of: ${permissionList}`, errors_1.ErrorCodes.INSUFFICIENT_PERMISSIONS);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requirePermission = requirePermission;
/**
 * Combines ownership check with permission check
 * User can access if they own the resource OR have the required permission
 */
const requireOwnershipOrPermission = (permission, resourceUserIdField = 'userId') => {
    return (req, res, next) => {
        try {
            const requestUserId = req.user?.userId;
            const resourceUserId = req.params[resourceUserIdField] || req.body[resourceUserIdField];
            if (!requestUserId) {
                throw new errors_1.AuthenticationError('User not authenticated', errors_1.ErrorCodes.TOKEN_INVALID);
            }
            // Check ownership first
            if (requestUserId === resourceUserId) {
                return next();
            }
            // Check permission
            if (!req.userPermissions?.includes(permission)) {
                throw new errors_1.AuthorizationError(`Access denied. Required permission: ${permission} or resource ownership`, errors_1.ErrorCodes.INSUFFICIENT_PERMISSIONS);
            }
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireOwnershipOrPermission = requireOwnershipOrPermission;
/**
 * Utility function to check if user has permission (for use in controllers)
 */
const hasPermission = (userPermissions, permission) => {
    return userPermissions.includes(permission);
};
exports.hasPermission = hasPermission;
