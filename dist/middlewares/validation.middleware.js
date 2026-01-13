"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatePasswordChange = exports.validateLogin = exports.validateRegistration = exports.validatePassword = exports.validateEmail = exports.validateParams = exports.validateQuery = exports.validateBody = exports.validate = void 0;
const zod_1 = require("zod");
const errors_1 = require("../utils/errors");
// Generic Zod validation middleware
const validate = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse({
                body: req.body,
                query: req.query,
                params: req.params
            });
            // Replace req properties with validated data
            if (result.body)
                req.body = result.body;
            if (result.query) {
                // Instead of directly assigning to req.query, we need to replace its properties
                Object.keys(req.query).forEach((key) => delete req.query[key]);
                Object.assign(req.query, result.query);
            }
            if (result.params)
                Object.assign(req.params, result.params);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                // Transform Zod errors into our ValidationError format
                const errorMessages = error.issues.map((err) => {
                    const path = err.path.join('.');
                    return `${path}: ${err.message}`;
                });
                throw new errors_1.ValidationError(`Validation failed: ${errorMessages.join(', ')}`, errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
            }
            // Re-throw other errors
            throw error;
        }
    };
};
exports.validate = validate;
// Validate only request body
const validateBody = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.body);
            req.body = result;
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessages = error.issues.map((err) => {
                    const path = err.path.join('.');
                    return `${path}: ${err.message}`;
                });
                throw new errors_1.ValidationError(`Validation failed: ${errorMessages.join(', ')}`, errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
            }
            throw error;
        }
    };
};
exports.validateBody = validateBody;
// Validate only query parameters
const validateQuery = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.query);
            // Clear existing query properties and assign new ones
            Object.keys(req.query).forEach((key) => delete req.query[key]);
            Object.assign(req.query, result);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessages = error.issues.map((err) => {
                    const path = err.path.join('.');
                    return `${path}: ${err.message}`;
                });
                throw new errors_1.ValidationError(`Validation failed: ${errorMessages.join(', ')}`, errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
            }
            throw error;
        }
    };
};
exports.validateQuery = validateQuery;
// Validate only route parameters
const validateParams = (schema) => {
    return (req, res, next) => {
        try {
            const result = schema.parse(req.params);
            Object.assign(req.params, result);
            next();
        }
        catch (error) {
            if (error instanceof zod_1.z.ZodError) {
                const errorMessages = error.issues.map((err) => {
                    const path = err.path.join('.');
                    return `${path}: ${err.message}`;
                });
                throw new errors_1.ValidationError(`Validation failed: ${errorMessages.join(', ')}`, errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
            }
            throw error;
        }
    };
};
exports.validateParams = validateParams;
// Legacy validation functions (deprecated - use Zod schemas instead)
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{8,}$/;
const validateEmail = (email) => {
    return emailRegex.test(email);
};
exports.validateEmail = validateEmail;
const validatePassword = (password) => {
    return passwordRegex.test(password);
};
exports.validatePassword = validatePassword;
// Legacy middleware functions (deprecated - use validate() with schemas instead)
const validateRegistration = (req, res, next) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
        throw new errors_1.ValidationError('Username, email, and password are required', errors_1.ErrorCodes.REQUIRED_FIELD_MISSING);
    }
    if (!(0, exports.validateEmail)(email)) {
        throw new errors_1.ValidationError('Please provide a valid email address', errors_1.ErrorCodes.INVALID_EMAIL_FORMAT);
    }
    if (!(0, exports.validatePassword)(password)) {
        throw new errors_1.ValidationError('Password must be at least 8 characters long and contain at least one letter and one number', errors_1.ErrorCodes.PASSWORD_TOO_WEAK);
    }
    if (username.length < 3 || username.length > 50) {
        throw new errors_1.ValidationError('Username must be between 3 and 50 characters', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
    }
    next();
};
exports.validateRegistration = validateRegistration;
const validateLogin = (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        throw new errors_1.ValidationError('Email and password are required', errors_1.ErrorCodes.REQUIRED_FIELD_MISSING);
    }
    if (!(0, exports.validateEmail)(email)) {
        throw new errors_1.ValidationError('Please provide a valid email address', errors_1.ErrorCodes.INVALID_EMAIL_FORMAT);
    }
    next();
};
exports.validateLogin = validateLogin;
const validatePasswordChange = (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        throw new errors_1.ValidationError('Current password and new password are required', errors_1.ErrorCodes.REQUIRED_FIELD_MISSING);
    }
    if (!(0, exports.validatePassword)(newPassword)) {
        throw new errors_1.ValidationError('New password must be at least 8 characters long and contain at least one letter and one number', errors_1.ErrorCodes.PASSWORD_TOO_WEAK);
    }
    if (currentPassword === newPassword) {
        throw new errors_1.ValidationError('New password must be different from current password', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
    }
    next();
};
exports.validatePasswordChange = validatePasswordChange;
