import { Router } from 'express'
import { TrackController } from '../controllers/track.controller'
import { authMiddleware } from '../middlewares/auth.middleware'
import { validate } from '../middlewares/validation.middleware'
import {
  toggleTrackSchema,
  createTrackSchema, // Keep for backward compatibility
  getTrackQuery,
  getCourseTrackQuery,
  getUserTrackQuery,
  deleteTrackSchema
} from '../schemas/track.schema'

const router = Router()

// All routes require authentication
router.use(authMiddleware)

/**
 * @route   POST /api/tracks/toggle
 * @desc    Toggle track record (create if doesn't exist, remove if exists)
 * @access  Private
 */
router.post('/toggle', validate(toggleTrackSchema), TrackController.toggleTrack)

/**
 * @route   POST /api/tracks
 * @desc    Create a new track record (legacy - use /toggle instead)
 * @access  Private
 */
router.post('/', validate(createTrackSchema), TrackController.createTrack)

/**
 * @route   GET /api/tracks
 * @desc    Get user's tracks with pagination and filtering
 * @access  Private
 */
router.get('/', validate(getTrackQuery), TrackController.getTracks)

/**
 * @route   GET /api/tracks/course
 * @desc    Get tracks for a specific course
 * @access  Private
 */
router.get('/course', validate(getCourseTrackQuery), TrackController.getCourseTrack)

/**
 * @route   GET /api/tracks/user
 * @desc    Get user tracks for multiple courses
 * @access  Private
 */
router.get('/user', validate(getUserTrackQuery), TrackController.getUserTracks)

/**
 * @route   GET /api/tracks/:trackId
 * @desc    Get track by ID
 * @access  Private
 */
router.get('/:trackId', TrackController.getTrackById)

/**
 * @route   DELETE /api/tracks/:trackId
 * @desc    Delete track
 * @access  Private
 */
router.delete('/:trackId', validate(deleteTrackSchema), TrackController.deleteTrack)

export default router
