"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const track_controller_1 = require("../controllers/track.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const track_schema_1 = require("../schemas/track.schema");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authMiddleware);
/**
 * @route   POST /api/tracks/toggle
 * @desc    Toggle track record (create if doesn't exist, remove if exists)
 * @access  Private
 */
router.post('/toggle', (0, validation_middleware_1.validate)(track_schema_1.toggleTrackSchema), track_controller_1.TrackController.toggleTrack);
/**
 * @route   POST /api/tracks
 * @desc    Create a new track record (legacy - use /toggle instead)
 * @access  Private
 */
router.post('/', (0, validation_middleware_1.validate)(track_schema_1.createTrackSchema), track_controller_1.TrackController.createTrack);
/**
 * @route   GET /api/tracks
 * @desc    Get user's tracks with pagination and filtering
 * @access  Private
 */
router.get('/', (0, validation_middleware_1.validate)(track_schema_1.getTrackQuery), track_controller_1.TrackController.getTracks);
/**
 * @route   GET /api/tracks/course
 * @desc    Get tracks for a specific course
 * @access  Private
 */
router.get('/course', (0, validation_middleware_1.validate)(track_schema_1.getCourseTrackQuery), track_controller_1.TrackController.getCourseTrack);
/**
 * @route   GET /api/tracks/user
 * @desc    Get user tracks for multiple courses
 * @access  Private
 */
router.get('/user', (0, validation_middleware_1.validate)(track_schema_1.getUserTrackQuery), track_controller_1.TrackController.getUserTracks);
/**
 * @route   GET /api/tracks/:trackId
 * @desc    Get track by ID
 * @access  Private
 */
router.get('/:trackId', track_controller_1.TrackController.getTrackById);
/**
 * @route   DELETE /api/tracks/:trackId
 * @desc    Delete track
 * @access  Private
 */
router.delete('/:trackId', (0, validation_middleware_1.validate)(track_schema_1.deleteTrackSchema), track_controller_1.TrackController.deleteTrack);
exports.default = router;
