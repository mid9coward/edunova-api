"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackService = void 0;
const track_1 = require("../models/track");
const user_1 = require("../models/user");
const course_1 = require("../models/course");
const lesson_1 = require("../models/lesson");
const errors_1 = require("../utils/errors");
const course_completion_service_1 = require("./course-completion.service");
/**
 * Track Management Service
 * CRUD operations for lesson tracking
 */
class TrackService {
    /**
     * Toggle track record - create if doesn't exist, remove if exists
     */
    static async toggleTrack(trackData, userId) {
        // Validate user exists
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Validate course exists
        const course = await course_1.Course.findById(trackData.courseId);
        if (!course) {
            throw new errors_1.AppError('Course not found', 404);
        }
        // Validate lesson exists and belongs to the course
        const lesson = await lesson_1.Lesson.findOne({
            _id: trackData.lessonId,
            courseId: trackData.courseId
        });
        if (!lesson) {
            throw new errors_1.AppError('Lesson not found or does not belong to this course', 404);
        }
        // Check if track already exists
        const existingTrack = await track_1.Track.findOne({
            userId,
            courseId: trackData.courseId,
            lessonId: trackData.lessonId
        });
        if (existingTrack) {
            // Track exists, remove it
            await track_1.Track.findByIdAndDelete(existingTrack._id);
            await course_completion_service_1.CourseCompletionService.syncCompletionForUserCourse(userId, trackData.courseId);
            return null;
        }
        else {
            // Track doesn't exist, create it
            const track = new track_1.Track({
                userId,
                courseId: trackData.courseId,
                lessonId: trackData.lessonId
            });
            await track.save();
            await course_completion_service_1.CourseCompletionService.syncCompletionForUserCourse(userId, trackData.courseId);
            return track;
        }
    }
    /**
     * Get all tracks with filtering
     */
    static async getTracks(userId, options = {}) {
        const { courseId, lessonId, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Build filter query
        const filter = { userId };
        if (courseId) {
            filter.courseId = courseId;
        }
        if (lessonId) {
            filter.lessonId = lessonId;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute query
        const tracks = await track_1.Track.find(filter).sort(sort).lean();
        return tracks;
    }
    /**
     * Get tracks for a specific course
     */
    static async getCourseTrack(userId, options) {
        const { courseId } = options;
        // Validate course exists
        const course = await course_1.Course.findById(courseId);
        if (!course) {
            throw new errors_1.AppError('Course not found', 404);
        }
        const tracks = await track_1.Track.find({ userId, courseId })
            .populate('lessonId', 'title contentType duration order')
            .sort({ createdAt: -1 });
        return tracks;
    }
    /**
     * Get user tracks for multiple courses
     */
    static async getUserTracks(userId, options = {}) {
        const { courseIds } = options;
        // Build filter query
        const filter = { userId };
        if (courseIds) {
            const courseIdArray = courseIds.split(',').map((id) => id.trim());
            filter.courseId = { $in: courseIdArray };
        }
        // Execute query
        const tracks = await track_1.Track.find(filter).sort({ createdAt: -1 }).lean();
        return tracks;
    }
    /**
     * Get track by ID
     */
    static async getTrackById(trackId, userId) {
        const track = await track_1.Track.findOne({ _id: trackId, userId })
            .populate('courseId', 'title slug')
            .populate('lessonId', 'title contentType duration')
            .populate('userId', 'username email');
        if (!track) {
            throw new errors_1.AppError('Track not found', 404);
        }
        return track;
    }
    /**
     * Delete track
     */
    static async deleteTrack(trackId, userId) {
        const track = await track_1.Track.findOne({ _id: trackId, userId });
        if (!track) {
            throw new errors_1.AppError('Track not found', 404);
        }
        await track_1.Track.findByIdAndDelete(trackId);
    }
}
exports.TrackService = TrackService;
