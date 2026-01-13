"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchQuerySchema = void 0;
const zod_1 = require("zod");
/**
 * Search Validation Schemas
 */
// Search query schema
exports.searchQuerySchema = zod_1.z.object({
    query: zod_1.z.object({
        q: zod_1.z.string().min(1, 'Search query is required').max(100, 'Search query must be less than 100 characters').trim()
    })
});
