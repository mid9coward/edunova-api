"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewService = void 0;
const mongoose_1 = require("mongoose");
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
class ReviewService {
    /**
     * Create a new review
     */
    static async createReview(userId, reviewData) {
        // Check if course exists
        const courseExists = await models_1.Course.exists({ _id: reviewData.courseId });
        if (!courseExists) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        const review = await models_1.Review.create({
            userId: userId,
            courseId: reviewData.courseId,
            star: reviewData.star,
            content: reviewData.content
        });
        return review;
    }
    /**
     * Get all reviews with pagination and filtering
     */
    static async getReviews(options = {}) {
        const { page = 1, limit = 10, search, courseId, userId, status, star, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = {};
        if (search) {
            filter.content = { $regex: search, $options: 'i' };
        }
        if (courseId) {
            filter.courseId = courseId;
        }
        if (userId) {
            filter.userId = userId;
        }
        if (status) {
            filter.status = status;
        }
        if (star) {
            filter.star = star;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries in parallel
        const [reviews, total] = await Promise.all([
            models_1.Review.find(filter).populate('userDetails', 'username email avatar').sort(sort).skip(skip).limit(limitNum).lean(),
            models_1.Review.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(total / limitNum);
        return {
            reviews: reviews,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        };
    }
    /**
     * Get review by ID
     */
    static async getReviewById(reviewId) {
        const review = await models_1.Review.findById(reviewId).populate('userDetails', 'username email avatar');
        if (!review) {
            throw new errors_1.NotFoundError('Review not found', errors_1.ErrorCodes.REVIEW_NOT_FOUND);
        }
        return review;
    }
    /**
     * Update review
     */
    static async updateReview(reviewId, userId, updateData) {
        const review = await models_1.Review.findById(reviewId);
        if (!review) {
            throw new errors_1.NotFoundError('Review not found', errors_1.ErrorCodes.REVIEW_NOT_FOUND);
        }
        // Check if user owns this review or is admin
        if (review.userId.toString() !== userId) {
            throw new errors_1.ValidationError('You can only update your own reviews', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        // Update fields
        if (updateData.star !== undefined) {
            review.star = updateData.star;
        }
        if (updateData.content !== undefined) {
            review.content = updateData.content;
        }
        if (updateData.status !== undefined) {
            review.status = updateData.status;
        }
        await review.save();
        return review;
    }
    /**
     * Delete review
     */
    static async deleteReview(reviewId, userId) {
        const review = await models_1.Review.findById(reviewId);
        if (!review) {
            throw new errors_1.NotFoundError('Review not found', errors_1.ErrorCodes.REVIEW_NOT_FOUND);
        }
        // Check if user owns this review
        if (review.userId.toString() !== userId) {
            throw new errors_1.ValidationError('You can only delete your own reviews', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        await models_1.Review.findByIdAndDelete(reviewId);
    }
    /**
     * Get reviews for a specific course
     */
    static async getCourseReviews(courseId, options = {}) {
        // Check if course exists
        const courseExists = await models_1.Course.exists({ _id: courseId });
        if (!courseExists) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        const { page = 1, limit = 10, status, minStar, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = { courseId: courseId };
        if (status) {
            filter.status = status;
        }
        if (minStar) {
            filter.star = { $gte: minStar };
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries in parallel
        const [reviews, total, ratingStats, ratingDistribution] = await Promise.all([
            models_1.Review.find(filter).populate('user', 'username email avatar').sort(sort).skip(skip).limit(limitNum).lean(),
            models_1.Review.countDocuments(filter),
            models_1.Review.getAverageRating(new mongoose_1.Types.ObjectId(courseId)),
            models_1.Review.getRatingDistribution(new mongoose_1.Types.ObjectId(courseId))
        ]);
        const totalPages = Math.ceil(total / limitNum);
        return {
            reviews: reviews,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1,
            averageRating: ratingStats.averageRating || 0,
            ratingDistribution
        };
    }
    /**
     * Get reviews by a specific user
     */
    static async getUserReviews(userId, options = {}) {
        // Check if user exists
        const userExists = await models_1.User.exists({ _id: userId });
        if (!userExists) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        const { page = 1, limit = 10, status, star, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = { userId: userId };
        if (status) {
            filter.status = status;
        }
        if (star) {
            filter.star = star;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries in parallel
        const [reviews, total] = await Promise.all([
            models_1.Review.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
            models_1.Review.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(total / limitNum);
        return {
            reviews: reviews,
            total,
            page: pageNum,
            limit: limitNum,
            totalPages,
            hasNextPage: pageNum < totalPages,
            hasPrevPage: pageNum > 1
        };
    }
    /**
     * Get course rating statistics
     */
    static async getCourseRatingStats(courseId) {
        // Check if course exists
        const courseExists = await models_1.Course.exists({ _id: courseId });
        if (!courseExists) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        const [ratingStats, ratingDistribution] = await Promise.all([
            models_1.Review.getAverageRating(new mongoose_1.Types.ObjectId(courseId)),
            models_1.Review.getRatingDistribution(new mongoose_1.Types.ObjectId(courseId))
        ]);
        return {
            averageRating: ratingStats.averageRating || 0,
            totalReviews: ratingStats.totalReviews || 0,
            ratingDistribution
        };
    }
    /**
     * Admin: Update review status
     */
    static async updateReviewStatus(reviewId, status) {
        const review = await models_1.Review.findByIdAndUpdate(reviewId, { status }, { new: true, runValidators: true });
        if (!review) {
            throw new errors_1.NotFoundError('Review not found', errors_1.ErrorCodes.REVIEW_NOT_FOUND);
        }
        return review;
    }
}
exports.ReviewService = ReviewService;
