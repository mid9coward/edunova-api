import { Request, Response } from 'express'
import { SearchService } from '../services/search.service'
import { sendSuccess } from '../utils/success'

/**
 * Search Controller
 * Handles search requests for courses and blogs
 */
export class SearchController {
  /**
   * Search for courses and blogs
   * GET /api/v1/search?q=query
   */
  static async search(req: Request, res: Response): Promise<void> {
    const { q } = req.query

    // Perform search
    const results = await SearchService.search(q as string)

    sendSuccess.ok(res, 'Search completed successfully', results)
  }
}
