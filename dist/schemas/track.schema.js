"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTrackSchema = exports.getUserTrackQuery = exports.getCourseTrackQuery = exports.getTrackQuery = exports.createTrackSchema = exports.toggleTrackSchema = void 0;
const zod_1 = require("zod");
const common_schema_1 = require("./common.schema");
/**
 * Track Schemas
 */
// Toggle track
exports.toggleTrackSchema = zod_1.z.object({
    body: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema,
        lessonId: common_schema_1.objectIdSchema
    })
});
// Keep for backward compatibility
exports.createTrackSchema = exports.toggleTrackSchema;
// Get track queries
exports.getTrackQuery = zod_1.z.object({
    query: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema.optional(),
        lessonId: common_schema_1.objectIdSchema.optional(),
        sortBy: zod_1.z.enum(['createdAt', 'updatedAt']).optional().default('createdAt'),
        sortOrder: zod_1.z.enum(['asc', 'desc']).optional().default('desc')
    })
});
// Get course track query
exports.getCourseTrackQuery = zod_1.z.object({
    query: zod_1.z.object({
        courseId: common_schema_1.objectIdSchema
    })
});
// Get user tracks for multiple courses
exports.getUserTrackQuery = zod_1.z.object({
    query: zod_1.z.object({
        courseIds: zod_1.z.string().optional() // comma-separated course IDs
    })
});
// Delete track
exports.deleteTrackSchema = zod_1.z.object({
    params: zod_1.z.object({
        trackId: common_schema_1.objectIdSchema
    })
});
