"use strict";
/**
 * Simplified RBAC Permission Constants
 * Uses standard CRUD operations for easier UI management
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALL_PERMISSIONS = exports.getResourcePermissions = exports.generatePermission = exports.SYSTEM_ROLE_NAMES = exports.OPERATIONS = exports.RESOURCES = exports.PERMISSIONS = void 0;
// Resource-based CRUD permissions
exports.PERMISSIONS = {
    // User Management
    USER_CREATE: 'user:create',
    USER_READ: 'user:read',
    USER_UPDATE: 'user:update',
    USER_DELETE: 'user:delete',
    // Course Management
    COURSE_CREATE: 'course:create',
    COURSE_READ: 'course:read',
    COURSE_UPDATE: 'course:update',
    COURSE_DELETE: 'course:delete',
    // Chapter Management
    CHAPTER_CREATE: 'chapter:create',
    CHAPTER_READ: 'chapter:read',
    CHAPTER_UPDATE: 'chapter:update',
    CHAPTER_DELETE: 'chapter:delete',
    // Lesson Management
    LESSON_CREATE: 'lesson:create',
    LESSON_READ: 'lesson:read',
    LESSON_UPDATE: 'lesson:update',
    LESSON_DELETE: 'lesson:delete',
    // Category Management
    CATEGORY_CREATE: 'category:create',
    CATEGORY_READ: 'category:read',
    CATEGORY_UPDATE: 'category:update',
    CATEGORY_DELETE: 'category:delete',
    // Coupon Management
    COUPON_CREATE: 'coupon:create',
    COUPON_READ: 'coupon:read',
    COUPON_UPDATE: 'coupon:update',
    COUPON_DELETE: 'coupon:delete',
    // Review Management
    REVIEW_CREATE: 'review:create',
    REVIEW_READ: 'review:read',
    REVIEW_UPDATE: 'review:update',
    REVIEW_DELETE: 'review:delete',
    // Comment Management
    COMMENT_CREATE: 'comment:create',
    COMMENT_READ: 'comment:read',
    COMMENT_UPDATE: 'comment:update',
    COMMENT_DELETE: 'comment:delete',
    // Blog Management
    BLOG_CREATE: 'blog:create',
    BLOG_READ: 'blog:read',
    BLOG_UPDATE: 'blog:update',
    BLOG_DELETE: 'blog:delete',
    // Role Management
    ROLE_CREATE: 'role:create',
    ROLE_READ: 'role:read',
    ROLE_UPDATE: 'role:update',
    ROLE_DELETE: 'role:delete',
    // Quiz Question Management
    QUIZ_QUESTION_CREATE: 'quiz_question:create',
    QUIZ_QUESTION_READ: 'quiz_question:read',
    QUIZ_QUESTION_UPDATE: 'quiz_question:update',
    QUIZ_QUESTION_DELETE: 'quiz_question:delete',
    // Order Management
    ORDER_CREATE: 'order:create',
    ORDER_READ: 'order:read',
    ORDER_UPDATE: 'order:update',
    ORDER_DELETE: 'order:delete',
    ORDER_MODERATE: 'order:moderate',
    // Statistics
    STATS_READ: 'stats:read'
};
// Resource definitions for UI generation
exports.RESOURCES = {
    USER: 'user',
    COURSE: 'course',
    CHAPTER: 'chapter',
    LESSON: 'lesson',
    COUPON: 'coupon',
    CATEGORY: 'category',
    REVIEW: 'review',
    COMMENT: 'comment',
    BLOG: 'blog',
    ROLE: 'role',
    QUIZ_QUESTION: 'quiz_question',
    ORDER: 'order'
};
// CRUD operations
exports.OPERATIONS = {
    CREATE: 'create',
    READ: 'read',
    UPDATE: 'update',
    DELETE: 'delete'
};
// Common system role names (for reference)
exports.SYSTEM_ROLE_NAMES = {
    SUPER_ADMIN: 'Super Admin',
    ADMIN: 'Admin',
    STUDENT: 'Student',
    GUEST: 'Guest'
};
// Helper function to generate permission strings
const generatePermission = (resource, operation) => {
    return `${resource}:${operation}`;
};
exports.generatePermission = generatePermission;
// Helper function to get all permissions for a resource
const getResourcePermissions = (resource) => {
    const resourceName = exports.RESOURCES[resource];
    return Object.values(exports.OPERATIONS).map((op) => (0, exports.generatePermission)(resourceName, op));
};
exports.getResourcePermissions = getResourcePermissions;
// All permissions as an array
exports.ALL_PERMISSIONS = Object.values(exports.PERMISSIONS);
