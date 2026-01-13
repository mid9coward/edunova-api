"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewController = void 0;
const services_1 = require("../services");
const success_1 = require("../utils/success");
class ReviewController {
    /**
     * Create a new review
     */
    static async createReview(req, res) {
        const userId = req.user.userId;
        const reviewData = req.body;
        const review = await services_1.ReviewService.createReview(userId, reviewData);
        success_1.sendSuccess.created(res, 'Review created successfully', { review });
    }
    /**
     * Get all reviews with pagination and filtering
     */
    static async getReviews(req, res) {
        const query = req.query;
        const result = await services_1.ReviewService.getReviews(query);
        success_1.sendSuccess.ok(res, 'Reviews retrieved successfully', result);
    }
    /**
     * Get review by ID
     */
    static async getReviewById(req, res) {
        const { id } = req.params;
        const review = await services_1.ReviewService.getReviewById(id);
        success_1.sendSuccess.ok(res, 'Review retrieved successfully', { review });
    }
    /**
     * Update review
     */
    static async updateReview(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const updateData = req.body;
        const review = await services_1.ReviewService.updateReview(id, userId, updateData);
        success_1.sendSuccess.ok(res, 'Review updated successfully', { review });
    }
    /**
     * Delete review
     */
    static async deleteReview(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        await services_1.ReviewService.deleteReview(id, userId);
        success_1.sendSuccess.ok(res, 'Review deleted successfully');
    }
    /**
     * Get reviews for a specific course
     */
    static async getCourseReviews(req, res) {
        const { courseId } = req.params;
        const query = req.query;
        const result = await services_1.ReviewService.getCourseReviews(courseId, query);
        success_1.sendSuccess.ok(res, 'Course reviews retrieved successfully', result);
    }
    /**
     * Get reviews by a specific user
     */
    static async getUserReviews(req, res) {
        const { userId } = req.params;
        const query = req.query;
        const result = await services_1.ReviewService.getUserReviews(userId, query);
        success_1.sendSuccess.ok(res, 'User reviews retrieved successfully', result);
    }
    /**
     * Get course rating statistics
     */
    static async getCourseRatingStats(req, res) {
        const { courseId } = req.params;
        const stats = await services_1.ReviewService.getCourseRatingStats(courseId);
        success_1.sendSuccess.ok(res, 'Course rating statistics retrieved successfully', stats);
    }
    /**
     * Admin: Update review status
     */
    static async updateReviewStatus(req, res) {
        const { id } = req.params;
        const { status } = req.body;
        const review = await services_1.ReviewService.updateReviewStatus(id, status);
        success_1.sendSuccess.ok(res, 'Review status updated successfully', { review });
    }
}
exports.ReviewController = ReviewController;
