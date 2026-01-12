import { Router } from 'express'
import { SearchController } from '../controllers/search.controller'
import { validate } from '../middlewares/validation.middleware'
import { asyncHandler } from '../middlewares/error.middleware'
import { searchRateLimit } from '../middlewares/rate-limit.middleware'
import { searchQuerySchema } from '../schemas/search.schema'

const router = Router()

/**
 * Public Routes
 */

/**
 * @route GET /search?q=query
 * @desc Search for courses and blogs
 * @access Public
 */
router.get('/', searchRateLimit, validate(searchQuerySchema), asyncHandler(SearchController.search))

export default router
