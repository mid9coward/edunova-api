import { Request, Response } from 'express'
import { TrackService } from '../services/track.service'
import { AppError } from '../utils/errors'
import { sendSuccess } from '../utils/success'

/**
 * Track Controller
 * Handles lesson tracking operations
 */
export class TrackController {
  /**
   * Toggle track record - create if doesn't exist, remove if exists
   */
  static async toggleTrack(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const track = await TrackService.toggleTrack(req.body, userId)

    const message = track ? 'Track created successfully' : 'Track removed successfully'

    if (track) {
      sendSuccess.created(res, message, { track })
    } else {
      sendSuccess.ok(res, message)
    }
  }

  /**
   * @deprecated Use toggleTrack instead
   * Create a new track record (legacy method)
   */
  static async createTrack(req: Request, res: Response): Promise<void> {
    return TrackController.toggleTrack(req, res)
  }

  /**
   * Get user's tracks
   */
  static async getTracks(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const result = await TrackService.getTracks(userId, req.query)

    sendSuccess.ok(res, 'Tracks retrieved successfully', result)
  }

  /**
   * Get tracks for a specific course
   */
  static async getCourseTrack(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const tracks = await TrackService.getCourseTrack(userId, req.query as { courseId: string })

    sendSuccess.ok(res, 'Course tracks retrieved successfully', { tracks })
  }

  /**
   * Get user tracks for multiple courses
   */
  static async getUserTracks(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const result = await TrackService.getUserTracks(userId, req.query)

    sendSuccess.ok(res, 'User tracks retrieved successfully', result)
  }

  /**
   * Get track by ID
   */
  static async getTrackById(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { trackId } = req.params
    const track = await TrackService.getTrackById(trackId as string, userId)

    sendSuccess.ok(res, 'Track retrieved successfully', { track })
  }

  /**
   * Delete track
   */
  static async deleteTrack(req: Request, res: Response): Promise<void> {
    const userId = req.user?.userId
    if (!userId) {
      throw new AppError('User not authenticated', 401)
    }

    const { trackId } = req.params
    await TrackService.deleteTrack(trackId as string, userId)

    sendSuccess.ok(res, 'Track deleted successfully')
  }
}
