import { Category, ICategory } from '../models/category'
import { Course } from '../models/course'
import { AppError } from '../utils/errors'
import { CategoryStatus, CourseStatus } from '../enums'
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  GetCategoriesQuery,
  BulkDeleteCategoriesInput
} from '../schemas/category.schema'

/**
 * Category Management Service
 * Simple CRUD operations for categories
 */

interface GetCategoriesResult {
  categories: ICategory[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export class CategoryService {
  /**
   * Create a new category
   */
  static async createCategory(categoryData: CreateCategoryInput): Promise<ICategory> {
    // Check if name already exists
    const existingCategoryByName = await Category.findOne({ name: categoryData.name })
    if (existingCategoryByName) {
      throw new AppError('Category with this name already exists', 400)
    }

    // Check if slug already exists
    const existingCategoryBySlug = await Category.findOne({ slug: categoryData.slug })
    if (existingCategoryBySlug) {
      throw new AppError('Category with this slug already exists', 400)
    }

    const category = new Category(categoryData)
    await category.save()

    return category
  }

  /**
   * Get all categories with pagination
   */
  static async getCategories(options: Partial<GetCategoriesQuery> = {}): Promise<GetCategoriesResult> {
    const { page = 1, limit = 10, search, status, sortBy = 'createdAt', sortOrder = 'desc' } = options
    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: Record<string, unknown> = {}

    if (search) {
      filter.$or = [{ name: { $regex: search, $options: 'i' } }]
    }

    if (status) {
      if (Array.isArray(status)) {
        // Multiple status values
        filter.status = { $in: status }
      } else if (typeof status === 'string' && status.includes(',')) {
        // Comma-separated string
        const statusArray = status.split(',').map((s) => s.trim())
        filter.status = { $in: statusArray }
      } else {
        // Single status value
        filter.status = status
      }
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [categories, total] = await Promise.all([
      Category.find(filter).sort(sort).skip(skip).limit(limitNum).lean(),
      Category.countDocuments(filter)
    ])

    const totalPages = Math.ceil(total / limitNum)

    return {
      categories: categories as ICategory[],
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    }
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(categoryId: string): Promise<ICategory> {
    const category = await Category.findById(categoryId)

    if (!category) {
      throw new AppError('Category not found', 404)
    }

    return category
  }

  /**
   * Update category
   */
  static async updateCategory(categoryId: string, updateData: UpdateCategoryInput): Promise<ICategory> {
    const category = await Category.findById(categoryId)
    if (!category) {
      throw new AppError('Category not found', 404)
    }

    // Check if name is being updated and already exists
    if (updateData.name && updateData.name !== category.name) {
      const existingCategory = await Category.findOne({ name: updateData.name })
      if (existingCategory) {
        throw new AppError('Category with this name already exists', 400)
      }
    }

    // Check if slug is being updated and already exists
    if (updateData.slug && updateData.slug !== category.slug) {
      const existingCategory = await Category.findOne({ slug: updateData.slug })
      if (existingCategory) {
        throw new AppError('Category with this slug already exists', 400)
      }
    }

    // Update the category
    Object.assign(category, updateData)
    await category.save()

    return category
  }

  /**
   * Delete category
   */
  static async deleteCategory(categoryId: string): Promise<void> {
    const category = await Category.findById(categoryId)
    if (!category) {
      throw new AppError('Category not found', 404)
    }

    // Check if category is used by any courses
    const coursesCount = await Course.countDocuments({ categoryId: categoryId })
    if (coursesCount > 0) {
      throw new AppError(`Cannot delete category. It is used by ${coursesCount} course(s)`, 400)
    }

    await Category.findByIdAndDelete(categoryId)
  }

  /**
   * Bulk delete categories
   */
  static async bulkDeleteCategories(data: BulkDeleteCategoriesInput): Promise<{
    deletedCount: number
    skippedCategories: { id: string; name: string; reason: string }[]
  }> {
    const { categoryIds } = data

    // Remove duplicates
    const uniqueCategoryIds = [...new Set(categoryIds)]

    // Validate all categories exist
    const categories = await Category.find({ _id: { $in: uniqueCategoryIds } })
    const foundCategoryIds = categories.map((cat) => cat._id.toString())
    const notFoundIds = uniqueCategoryIds.filter((id) => !foundCategoryIds.includes(id))

    if (notFoundIds.length > 0) {
      throw new AppError(`Categories not found: ${notFoundIds.join(', ')}`, 404)
    }

    // Check which categories are used by courses
    const courseCounts = await Promise.all(
      uniqueCategoryIds.map(async (categoryId) => {
        const count = await Course.countDocuments({ categoryId })
        return { categoryId, count }
      })
    )

    const categoriesInUse = courseCounts.filter((item) => item.count > 0)

    if (categoriesInUse.length > 0) {
      const categoryNames = await Category.find({
        _id: { $in: categoriesInUse.map((item) => item.categoryId) }
      }).select('name')

      const inUseDetails = categoriesInUse
        .map((item) => {
          const category = categoryNames.find((cat) => cat._id.toString() === item.categoryId)
          return `${category?.name || item.categoryId} (${item.count} course(s))`
        })
        .join(', ')

      throw new AppError(`Cannot delete categories that are in use: ${inUseDetails}`, 400)
    }

    // Delete all categories
    const result = await Category.deleteMany({ _id: { $in: uniqueCategoryIds } })

    return {
      deletedCount: result.deletedCount || 0,
      skippedCategories: []
    }
  }

  /**
   * Get all active categories with course counts
   */
  static async getAllCategories(): Promise<Array<{ name: string; courseCount: number }>> {
    // Fetch only active categories (only name field needed)
    const categories = await Category.find({ status: CategoryStatus.ACTIVE }).select('name').sort({ name: 1 }).lean()

    // Get course counts for each category
    const categoriesWithCounts = await Promise.all(
      categories.map(async (category) => {
        const courseCount = await Course.countDocuments({
          categoryId: category._id,
          status: CourseStatus.PUBLISHED // Only count published courses
        })

        return {
          ...category,
          courseCount
        }
      })
    )

    return categoriesWithCounts
  }
}
