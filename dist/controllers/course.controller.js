"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseController = void 0;
const course_service_1 = require("../services/course.service");
const success_1 = require("../utils/success");
const errors_1 = require("../utils/errors");
const enums_1 = require("../enums");
/**
 * Course Management Controllers
 */
class CourseController {
    /**
     * Create a new course
     */
    static async createCourse(req, res) {
        const userId = req.user?.userId;
        const courseData = {
            ...req.body,
            authorId: userId
        };
        const course = await course_service_1.CourseService.createCourse(courseData);
        success_1.sendSuccess.created(res, 'Course created successfully', { course });
    }
    /**
     * Get all courses with pagination and filtering
     */
    static async getCourses(req, res) {
        const result = await course_service_1.CourseService.getCourses(req.query);
        success_1.sendSuccess.ok(res, 'Courses retrieved successfully', result);
    }
    /**
     * Get public courses (only published courses)
     */
    static async getPublicCourses(req, res) {
        const result = await course_service_1.CourseService.getPublicCourses(req.query);
        success_1.sendSuccess.ok(res, 'Public courses retrieved successfully', result);
    }
    /**
     * Get free courses (only published free courses)
     */
    static async getFreeCourses(req, res) {
        const result = await course_service_1.CourseService.getFreeCourses(req.query);
        success_1.sendSuccess.ok(res, 'Free courses retrieved successfully', result);
    }
    /**
     * Get course by ID
     */
    static async getCourseById(req, res) {
        const { courseId } = req.params;
        // Allow access to unpublished courses for authors and admins
        const canViewUnpublished = req.userPermissions?.includes('course:update') || req.userPermissions?.includes('admin:access');
        const course = await course_service_1.CourseService.getCourseById(courseId, canViewUnpublished);
        // Increment view count for published courses only
        if (course.status === enums_1.CourseStatus.PUBLISHED) {
            course_service_1.CourseService.incrementView(courseId);
        }
        success_1.sendSuccess.ok(res, 'Course retrieved successfully', { course });
    }
    /**
     * Get course by slug
     */
    static async getCourseBySlug(req, res) {
        const { slug } = req.params;
        const course = await course_service_1.CourseService.getCourseBySlug(slug);
        // Increment view count for published courses only
        if (course.status === enums_1.CourseStatus.PUBLISHED) {
            course_service_1.CourseService.incrementView(course._id.toString());
        }
        success_1.sendSuccess.ok(res, 'Course retrieved successfully', course);
    }
    /**
     * Update course
     */
    static async updateCourse(req, res) {
        const { courseId } = req.params;
        const course = await course_service_1.CourseService.updateCourse(courseId, req.body);
        success_1.sendSuccess.ok(res, 'Course updated successfully', { course });
    }
    /**
     * Delete course
     */
    static async deleteCourse(req, res) {
        const { courseId } = req.params;
        await course_service_1.CourseService.deleteCourse(courseId);
        success_1.sendSuccess.ok(res, 'Course deleted successfully');
    }
    /**
     * Get current user's courses
     */
    static async getMyCourses(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AuthenticationError('User not authenticated', errors_1.ErrorCodes.INVALID_CREDENTIALS);
        }
        const courses = await course_service_1.CourseService.getMyCourses(userId);
        success_1.sendSuccess.ok(res, 'Your courses retrieved successfully', courses);
    }
    /**
     * Search courses
     */
    static async searchCourses(req, res) {
        const { q: search } = req.query;
        if (!search || typeof search !== 'string') {
            throw new errors_1.ValidationError('Search query is required', errors_1.ErrorCodes.REQUIRED_FIELD_MISSING);
        }
        const result = await course_service_1.CourseService.getCourses({
            search,
            status: enums_1.CourseStatus.PUBLISHED, // Only search published courses for public
            page: '1',
            limit: '10',
            sortBy: 'createdAt',
            sortOrder: 'desc'
        });
        success_1.sendSuccess.ok(res, 'Course search completed', result);
    }
    /**
     * Get featured courses
     */
    static async getFeaturedCourses(req, res) {
        const result = await course_service_1.CourseService.getCourses({
            status: enums_1.CourseStatus.PUBLISHED,
            sortBy: 'popular',
            sortOrder: 'desc',
            limit: '10',
            page: '1'
        });
        success_1.sendSuccess.ok(res, 'Featured courses retrieved successfully', result);
    }
    /**
     * Get popular courses
     */
    static async getPopularCourses(req, res) {
        const result = await course_service_1.CourseService.getCourses({
            status: enums_1.CourseStatus.PUBLISHED,
            sortBy: 'popular',
            sortOrder: 'desc',
            limit: '10',
            page: '1'
        });
        success_1.sendSuccess.ok(res, 'Popular courses retrieved successfully', result);
    }
    /**
     * Get latest courses
     */
    static async getLatestCourses(req, res) {
        const result = await course_service_1.CourseService.getCourses({
            status: enums_1.CourseStatus.PUBLISHED,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            limit: '10',
            page: '1'
        });
        success_1.sendSuccess.ok(res, 'Latest courses retrieved successfully', result);
    }
    /**
     * Bulk delete courses
     */
    static async bulkDelete(req, res) {
        const { courseIds } = req.body;
        await course_service_1.CourseService.bulkDelete(courseIds);
        success_1.sendSuccess.ok(res, 'Courses deleted successfully');
    }
    /**
     * Enroll in course (increment sold count)
     */
    static async enrollInCourse(req, res) {
        const { courseId } = req.params;
        await course_service_1.CourseService.incrementSold(courseId);
        success_1.sendSuccess.ok(res, 'Successfully enrolled in course');
    }
    /**
     * Enroll in free course
     */
    static async enrollInFreeCourse(req, res) {
        const { courseId } = req.params;
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AuthenticationError('User authentication required', errors_1.ErrorCodes.INVALID_CREDENTIALS);
        }
        await course_service_1.CourseService.enrollInFreeCourse(courseId, userId);
        success_1.sendSuccess.ok(res, 'Successfully enrolled in free course');
    }
    /**
     * Get related courses for a specific course
     */
    static async getRelatedCourses(req, res) {
        const { courseId } = req.params;
        const limit = parseInt(req.query.limit) || 5;
        const result = await course_service_1.CourseService.getRelatedCourses(courseId, limit);
        success_1.sendSuccess.ok(res, 'Related courses retrieved successfully', result);
    }
}
exports.CourseController = CourseController;
