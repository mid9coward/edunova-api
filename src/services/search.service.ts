import { Course, ICourse } from '../models/course'
import { Blog, IBlog } from '../models/blog'
import { CourseStatus } from '../enums'

export interface SearchResult {
  courses: ICourse[]
  blogs: IBlog[]
}

/**
 * Search Service
 * Handles searching across courses and blogs
 */
export class SearchService {
  /**
   * Search for courses and blogs based on query string
   * Returns 5 latest courses and 5 latest blogs matching the query
   */
  static async search(query: string): Promise<SearchResult> {
    // Build search regex for case-insensitive search
    const searchRegex = new RegExp(query, 'i')

    // Search courses
    const courses = await Course.aggregate([
      {
        $match: {
          $or: [
            { title: { $regex: searchRegex } },
            { description: { $regex: searchRegex } },
            { excerpt: { $regex: searchRegex } }
          ],
          status: CourseStatus.PUBLISHED
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          image: 1,
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } },
      { $limit: 5 }
    ])

    // Search blogs
    const blogs = await Blog.aggregate([
      {
        $match: {
          $or: [{ title: { $regex: searchRegex } }, { excerpt: { $regex: searchRegex } }],
          status: 'published'
        }
      },
      {
        $project: {
          _id: 1,
          title: 1,
          slug: 1,
          thumbnail: 1,
          publishedAt: 1
        }
      },
      { $sort: { publishedAt: -1 } },
      { $limit: 5 }
    ])

    return {
      courses,
      blogs
    }
  }
}
