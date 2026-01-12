import { Track, ITrack } from '../models/track'
import { User } from '../models/user'
import { Course } from '../models/course'
import { Lesson } from '../models/lesson'
import { AppError } from '../utils/errors'
import { CreateTrackInput, GetTrackQuery, GetCourseTrackQuery, GetUserTrackQuery } from '../schemas/track.schema'

/**
 * Track Management Service
 * CRUD operations for lesson tracking
 */

export class TrackService {
  /**
   * Toggle track record - create if doesn't exist, remove if exists
   */
  static async toggleTrack(trackData: CreateTrackInput, userId: string): Promise<ITrack | null> {
    // Validate user exists
    const user = await User.findById(userId)
    if (!user) {
      throw new AppError('User not found', 404)
    }

    // Validate course exists
    const course = await Course.findById(trackData.courseId)
    if (!course) {
      throw new AppError('Course not found', 404)
    }

    // Validate lesson exists and belongs to the course
    const lesson = await Lesson.findOne({
      _id: trackData.lessonId,
      courseId: trackData.courseId
    })
    if (!lesson) {
      throw new AppError('Lesson not found or does not belong to this course', 404)
    }

    // Check if track already exists
    const existingTrack = await Track.findOne({
      userId,
      courseId: trackData.courseId,
      lessonId: trackData.lessonId
    })

    if (existingTrack) {
      // Track exists, remove it
      await Track.findByIdAndDelete(existingTrack._id)
      return null
    } else {
      // Track doesn't exist, create it
      const track = new Track({
        userId,
        courseId: trackData.courseId,
        lessonId: trackData.lessonId
      })

      await track.save()
      return track
    }
  }

  /**
   * Get all tracks with filtering
   */
  static async getTracks(userId: string, options: Partial<GetTrackQuery> = {}) {
    const { courseId, lessonId, sortBy = 'createdAt', sortOrder = 'desc' } = options

    // Build filter query
    const filter: Record<string, unknown> = { userId }

    if (courseId) {
      filter.courseId = courseId
    }

    if (lessonId) {
      filter.lessonId = lessonId
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute query
    const tracks = await Track.find(filter).sort(sort).lean()

    return tracks
  }

  /**
   * Get tracks for a specific course
   */
  static async getCourseTrack(userId: string, options: GetCourseTrackQuery): Promise<ITrack[]> {
    const { courseId } = options

    // Validate course exists
    const course = await Course.findById(courseId)
    if (!course) {
      throw new AppError('Course not found', 404)
    }

    const tracks = await Track.find({ userId, courseId })
      .populate('lessonId', 'title contentType duration order')
      .sort({ createdAt: -1 })

    return tracks
  }

  /**
   * Get user tracks for multiple courses
   */
  static async getUserTracks(userId: string, options: Partial<GetUserTrackQuery> = {}) {
    const { courseIds } = options

    // Build filter query
    const filter: Record<string, unknown> = { userId }

    if (courseIds) {
      const courseIdArray = courseIds.split(',').map((id) => id.trim())
      filter.courseId = { $in: courseIdArray }
    }

    // Execute query
    const tracks = await Track.find(filter).sort({ createdAt: -1 }).lean()

    return tracks
  }

  /**
   * Get track by ID
   */
  static async getTrackById(trackId: string, userId: string): Promise<ITrack> {
    const track = await Track.findOne({ _id: trackId, userId })
      .populate('courseId', 'title slug')
      .populate('lessonId', 'title contentType duration')
      .populate('userId', 'username email')

    if (!track) {
      throw new AppError('Track not found', 404)
    }

    return track
  }

  /**
   * Delete track
   */
  static async deleteTrack(trackId: string, userId: string): Promise<void> {
    const track = await Track.findOne({ _id: trackId, userId })
    if (!track) {
      throw new AppError('Track not found', 404)
    }

    await Track.findByIdAndDelete(trackId)
  }
}
