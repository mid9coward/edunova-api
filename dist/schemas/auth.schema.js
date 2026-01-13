"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.facebookLoginSchema = exports.facebookRegisterSchema = exports.googleLoginSchema = exports.googleRegisterSchema = exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.changePasswordSchema = exports.updateProfileSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
// Auth request schemas
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: common_schema_1.usernameSchema,
        email: common_schema_1.emailSchema,
        password: common_schema_1.passwordSchema
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: common_schema_1.emailSchema,
        password: zod_1.z.string().min(1, 'Password is required')
    })
});
exports.updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: common_schema_1.usernameSchema.optional(),
        avatar: zod_1.z.string().optional()
    })
});
exports.changePasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        currentPassword: zod_1.z.string().min(1, 'Current password is required'),
        newPassword: common_schema_1.passwordSchema
    })
});
exports.forgotPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: common_schema_1.emailSchema
    })
});
exports.resetPasswordSchema = zod_1.z.object({
    body: zod_1.z.object({
        token: zod_1.z.string().min(1, 'Token is required'),
        newPassword: common_schema_1.passwordSchema
    })
});
exports.googleRegisterSchema = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string().min(1, 'Google ID token is required')
    })
});
exports.googleLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        idToken: zod_1.z.string().min(1, 'Google ID token is required')
    })
});
exports.facebookRegisterSchema = zod_1.z.object({
    body: zod_1.z.object({
        accessToken: zod_1.z.string().min(1, 'Facebook access token is required')
    })
});
exports.facebookLoginSchema = zod_1.z.object({
    body: zod_1.z.object({
        accessToken: zod_1.z.string().min(1, 'Facebook access token is required')
    })
});
