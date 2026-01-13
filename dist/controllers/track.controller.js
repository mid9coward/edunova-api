"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TrackController = void 0;
const track_service_1 = require("../services/track.service");
const errors_1 = require("../utils/errors");
const success_1 = require("../utils/success");
/**
 * Track Controller
 * Handles lesson tracking operations
 */
class TrackController {
    /**
     * Toggle track record - create if doesn't exist, remove if exists
     */
    static async toggleTrack(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const track = await track_service_1.TrackService.toggleTrack(req.body, userId);
        const message = track ? 'Track created successfully' : 'Track removed successfully';
        if (track) {
            success_1.sendSuccess.created(res, message, { track });
        }
        else {
            success_1.sendSuccess.ok(res, message);
        }
    }
    /**
     * @deprecated Use toggleTrack instead
     * Create a new track record (legacy method)
     */
    static async createTrack(req, res) {
        return TrackController.toggleTrack(req, res);
    }
    /**
     * Get user's tracks
     */
    static async getTracks(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const result = await track_service_1.TrackService.getTracks(userId, req.query);
        success_1.sendSuccess.ok(res, 'Tracks retrieved successfully', result);
    }
    /**
     * Get tracks for a specific course
     */
    static async getCourseTrack(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const tracks = await track_service_1.TrackService.getCourseTrack(userId, req.query);
        success_1.sendSuccess.ok(res, 'Course tracks retrieved successfully', { tracks });
    }
    /**
     * Get user tracks for multiple courses
     */
    static async getUserTracks(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const result = await track_service_1.TrackService.getUserTracks(userId, req.query);
        success_1.sendSuccess.ok(res, 'User tracks retrieved successfully', result);
    }
    /**
     * Get track by ID
     */
    static async getTrackById(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { trackId } = req.params;
        const track = await track_service_1.TrackService.getTrackById(trackId, userId);
        success_1.sendSuccess.ok(res, 'Track retrieved successfully', { track });
    }
    /**
     * Delete track
     */
    static async deleteTrack(req, res) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new errors_1.AppError('User not authenticated', 401);
        }
        const { trackId } = req.params;
        await track_service_1.TrackService.deleteTrack(trackId, userId);
        success_1.sendSuccess.ok(res, 'Track deleted successfully');
    }
}
exports.TrackController = TrackController;
