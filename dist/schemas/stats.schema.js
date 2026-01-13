"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserRegistrationTrendSchema = exports.getMonthlyRevenueTrendSchema = void 0;
const zod_1 = require("zod");
/**
 * Statistics Validation Schemas
 */
// Get monthly revenue trend schema
exports.getMonthlyRevenueTrendSchema = zod_1.z.object({
    query: zod_1.z.object({
        months: zod_1.z
            .string()
            .optional()
            .refine((val) => {
            if (!val)
                return true;
            const num = parseInt(val);
            return !isNaN(num) && num > 0 && num <= 24;
        }, 'Months must be a number between 1 and 24')
            .transform((val) => (val ? parseInt(val) : undefined))
    })
});
// Get user registration trend schema
exports.getUserRegistrationTrendSchema = zod_1.z.object({
    query: zod_1.z.object({
        days: zod_1.z
            .string()
            .optional()
            .refine((val) => {
            if (!val)
                return true;
            const num = parseInt(val);
            return !isNaN(num) && num > 0 && num <= 365;
        }, 'Days must be a number between 1 and 365')
            .transform((val) => (val ? parseInt(val) : undefined))
    })
});
