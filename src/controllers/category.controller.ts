import { Request, Response } from 'express'
import { CategoryService } from '../services/category.service'
import { sendSuccess } from '../utils/success'
import {
  CreateCategoryInput,
  UpdateCategoryInput,
  GetCategoriesQuery,
  BulkDeleteCategoriesInput
} from '../schemas/category.schema'

/**
 * Category Controller
 * Simple CRUD operations for categories
 */

export class CategoryController {
  /**
   * Create new category
   */
  static async createCategory(req: Request, res: Response): Promise<void> {
    const categoryData: CreateCategoryInput = req.body
    const category = await CategoryService.createCategory(categoryData)

    sendSuccess.created(res, 'Category created successfully', { category })
  }

  /**
   * Get all categories with pagination
   */
  static async getCategories(req: Request, res: Response): Promise<void> {
    const query: Partial<GetCategoriesQuery> = req.query
    const result = await CategoryService.getCategories(query)

    sendSuccess.ok(res, 'Categories fetched successfully', result)
  }

  /**
   * Get all categories (simple list)
   */
  static async getAllCategories(req: Request, res: Response): Promise<void> {
    const categories = await CategoryService.getAllCategories()

    sendSuccess.ok(res, 'Categories fetched successfully', { categories })
  }

  /**
   * Get category by ID
   */
  static async getCategoryById(req: Request, res: Response): Promise<void> {
    const { categoryId } = req.params
    const category = await CategoryService.getCategoryById(categoryId as string)

    sendSuccess.ok(res, 'Category fetched successfully', { category })
  }

  /**
   * Update category
   */
  static async updateCategory(req: Request, res: Response): Promise<void> {
    const { categoryId } = req.params
    const updateData: UpdateCategoryInput = req.body
    const category = await CategoryService.updateCategory(categoryId as string, updateData)

    sendSuccess.ok(res, 'Category updated successfully', { category })
  }

  /**
   * Delete category
   */
  static async deleteCategory(req: Request, res: Response): Promise<void> {
    const { categoryId } = req.params
    await CategoryService.deleteCategory(categoryId as string)

    sendSuccess.ok(res, 'Category deleted successfully')
  }

  /**
   * Bulk delete categories
   */
  static async bulkDeleteCategories(req: Request, res: Response): Promise<void> {
    const bulkDeleteData: BulkDeleteCategoriesInput = req.body
    const result = await CategoryService.bulkDeleteCategories(bulkDeleteData)

    sendSuccess.ok(res, 'Categories deleted successfully', result)
  }
}
