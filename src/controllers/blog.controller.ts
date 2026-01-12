import { Request, Response } from 'express'
import { BlogService } from '../services/blog.service'
import { sendSuccess } from '../utils/success'
import { CreateBlogInput, UpdateBlogInput, GetBlogsQuery, BulkDeleteBlogsInput } from '../schemas/blog.schema'

/**
 * Blog Controller
 * CRUD operations for blog posts
 */
export class BlogController {
  /**
   * Create new blog post
   */
  static async createBlog(req: Request, res: Response): Promise<void> {
    const blogData: CreateBlogInput = req.body
    const authorId = req.user!.userId
    const blog = await BlogService.createBlog(blogData, authorId)

    sendSuccess.created(res, 'Blog created successfully', blog)
  }

  /**
   * Get all blogs with pagination and filtering
   */
  static async getBlogs(req: Request, res: Response): Promise<void> {
    const query: Partial<GetBlogsQuery> = req.query
    const result = await BlogService.getBlogs(query)

    sendSuccess.ok(res, 'Blogs fetched successfully', result)
  }

  /**
   * Get published blogs only (public endpoint)
   */
  static async getPublishedBlogs(req: Request, res: Response): Promise<void> {
    const query: Partial<GetBlogsQuery> = req.query
    const result = await BlogService.getPublishedBlogs(query)

    sendSuccess.ok(res, 'Published blogs fetched successfully', result)
  }

  /**
   * Get current user's blogs
   */
  static async getUserBlogs(req: Request, res: Response): Promise<void> {
    const query: Partial<GetBlogsQuery> = req.query
    const authorId = req.user!.userId
    const result = await BlogService.getUserBlogs(authorId, query)

    sendSuccess.ok(res, 'User blogs fetched successfully', result)
  }

  /**
   * Get blog by ID
   */
  static async getBlogById(req: Request, res: Response): Promise<void> {
    const { blogId } = req.params
    const blog = await BlogService.getBlogById(blogId)

    sendSuccess.ok(res, 'Blog fetched successfully', { blog })
  }

  /**
   * Get blog by slug (public endpoint)
   */
  static async getBlogBySlug(req: Request, res: Response): Promise<void> {
    const { slug } = req.params
    const blog = await BlogService.getBlogBySlug(slug)

    sendSuccess.ok(res, 'Blog fetched successfully', { blog })
  }

  /**
   * Update blog post
   */
  static async updateBlog(req: Request, res: Response): Promise<void> {
    const { blogId } = req.params
    const updateData: UpdateBlogInput = req.body
    const isAdmin = req.user!.roles?.includes('admin') || false
    const authorId = isAdmin ? undefined : req.user!.userId
    const blog = await BlogService.updateBlog(blogId, updateData, authorId)

    sendSuccess.ok(res, 'Blog updated successfully', { blog })
  }

  /**
   * Delete blog post
   */
  static async deleteBlog(req: Request, res: Response): Promise<void> {
    const { blogId } = req.params
    const isAdmin = req.user!.roles?.includes('admin') || false
    const authorId = isAdmin ? undefined : req.user!.userId
    await BlogService.deleteBlog(blogId, authorId)

    sendSuccess.ok(res, 'Blog deleted successfully')
  }

  /**
   * Bulk delete blogs
   */
  static async bulkDeleteBlogs(req: Request, res: Response): Promise<void> {
    const bulkDeleteData: BulkDeleteBlogsInput = req.body
    const isAdmin = req.user!.roles?.includes('admin') || false
    const authorId = isAdmin ? undefined : req.user!.userId
    const result = await BlogService.bulkDeleteBlogs(bulkDeleteData, authorId)

    sendSuccess.ok(res, 'Blogs deleted successfully', result)
  }
}
