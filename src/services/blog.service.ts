import { Blog, IBlog } from '../models/blog'
import { Category } from '../models/category'
import { User } from '../models/user'
import { AppError } from '../utils/errors'
import { CreateBlogInput, UpdateBlogInput, GetBlogsQuery, BulkDeleteBlogsInput } from '../schemas/blog.schema'
import { Types } from 'mongoose'

/**
 * Blog Management Service
 * CRUD operations for blog posts
 */

interface GetBlogsResult {
  blogs: IBlog[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
}

export class BlogService {
  /**
   * Create a new blog post
   */
  static async createBlog(blogData: CreateBlogInput, authorId: string): Promise<IBlog> {
    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug: blogData.slug })
    if (existingBlog) {
      throw new AppError('Blog with this slug already exists', 400)
    }

    // Validate author exists
    const author = await User.findById(authorId)
    if (!author) {
      throw new AppError('Author not found', 404)
    }

    // Validate categories exist (if provided)
    if (blogData.categoryId) {
      const category = await Category.findById(blogData.categoryId)
      if (!category) {
        throw new AppError('Category not found', 400)
      }
    }

    const blog = new Blog({
      ...blogData,
      authorId
    })

    await blog.save()
    return blog
  }

  /**
   * Get all blogs with pagination and filtering
   */
  static async getBlogs(options: Partial<GetBlogsQuery> = {}): Promise<GetBlogsResult> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      authorId,
      categoryId,
      sortBy = 'publishedAt',
      sortOrder = 'desc'
    } = options
    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query
    const filter: Record<string, unknown> = {}

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ]
    }

    if (status) {
      if (Array.isArray(status)) {
        filter.status = { $in: status }
      } else if (typeof status === 'string' && status.includes(',')) {
        const statusArray = status.split(',').map((s) => s.trim())
        filter.status = { $in: statusArray }
      } else {
        filter.status = status
      }
    }

    if (authorId) {
      filter.authorId = authorId
    }

    if (categoryId) {
      filter.categoryId = categoryId
    }

    // Build sort object
    const sort: Record<string, 1 | -1> = {}
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Execute queries in parallel
    const [blogsResult, total] = await Promise.all([
      Blog.aggregate([
        { $match: filter },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { name: 1, email: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
            pipeline: [{ $project: { name: 1, slug: 1 } }]
          }
        },
        {
          $addFields: {
            author: { $arrayElemAt: ['$author', 0] },
            category: { $arrayElemAt: ['$category', 0] }
          }
        },
        {
          $unset: ['authorId', 'categoryId']
        }
      ]),
      Blog.countDocuments(filter)
    ])

    const blogs = blogsResult as IBlog[]

    const totalPages = Math.ceil(total / limitNum)

    return {
      blogs: blogs as IBlog[],
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
   * Get blog by ID
   */
  static async getBlogById(blogId: string): Promise<IBlog> {
    const blogResult = await Blog.aggregate([
      { $match: { _id: new Types.ObjectId(blogId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, slug: 1 } }]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      },
      {
        $unset: ['authorId', 'categoryId']
      }
    ])

    const blog = blogResult[0] as IBlog

    if (!blog) {
      throw new AppError('Blog not found', 404)
    }

    return blog
  }

  /**
   * Get blog by slug
   */
  static async getBlogBySlug(slug: string): Promise<IBlog> {
    const blogResult = await Blog.aggregate([
      { $match: { slug: slug } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { username: 1, avatar: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, slug: 1 } }]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      },
      {
        $unset: ['authorId', 'categoryId']
      }
    ])

    const blog = blogResult[0] as IBlog

    if (!blog) {
      throw new AppError('Blog not found', 404)
    }

    return blog
  }

  /**
   * Update blog
   */
  static async updateBlog(blogId: string, updateData: UpdateBlogInput, authorId?: string): Promise<IBlog> {
    const blog = await Blog.findById(blogId)
    if (!blog) {
      throw new AppError('Blog not found', 404)
    }

    // Check ownership (if authorId provided - for non-admin users)
    if (authorId && blog.authorId.toString() !== authorId) {
      throw new AppError('Not authorized to update this blog', 403)
    }

    // Check if slug is being updated and already exists
    if (updateData.slug && updateData.slug !== blog.slug) {
      const existingBlog = await Blog.findOne({ slug: updateData.slug })
      if (existingBlog) {
        throw new AppError('Blog with this slug already exists', 400)
      }
    }

    // Validate categories exist (if provided)
    if (updateData.categoryId) {
      const category = await Category.findById(updateData.categoryId)
      if (!category) {
        throw new AppError('Category not found', 400)
      }
    }

    // Update the blog
    Object.assign(blog, updateData)
    await blog.save()

    const updatedBlogResult = await Blog.aggregate([
      { $match: { _id: new Types.ObjectId(blogId) } },
      {
        $lookup: {
          from: 'users',
          localField: 'authorId',
          foreignField: '_id',
          as: 'author',
          pipeline: [{ $project: { name: 1, email: 1 } }]
        }
      },
      {
        $lookup: {
          from: 'categories',
          localField: 'categoryId',
          foreignField: '_id',
          as: 'category',
          pipeline: [{ $project: { name: 1, slug: 1 } }]
        }
      },
      {
        $addFields: {
          author: { $arrayElemAt: ['$author', 0] },
          category: { $arrayElemAt: ['$category', 0] }
        }
      },
      {
        $unset: ['authorId', 'categoryId']
      }
    ])

    return updatedBlogResult[0] as IBlog
  }

  /**
   * Delete blog
   */
  static async deleteBlog(blogId: string, authorId?: string): Promise<void> {
    const blog = await Blog.findById(blogId)
    if (!blog) {
      throw new AppError('Blog not found', 404)
    }

    // Check ownership (if authorId provided - for non-admin users)
    if (authorId && blog.authorId.toString() !== authorId) {
      throw new AppError('Not authorized to delete this blog', 403)
    }

    await Blog.findByIdAndDelete(blogId)
  }

  /**
   * Bulk delete blogs
   */
  static async bulkDeleteBlogs(
    data: BulkDeleteBlogsInput,
    authorId?: string
  ): Promise<{
    deletedCount: number
    skippedBlogs: { id: string; title: string; reason: string }[]
  }> {
    const { blogIds } = data

    // Remove duplicates
    const uniqueBlogIds = [...new Set(blogIds)]

    // Validate all blogs exist
    const blogs = await Blog.find({ _id: { $in: uniqueBlogIds } })
    const foundBlogIds = blogs.map((blog) => blog._id.toString())
    const notFoundIds = uniqueBlogIds.filter((id) => !foundBlogIds.includes(id))

    if (notFoundIds.length > 0) {
      throw new AppError(`Blogs not found: ${notFoundIds.join(', ')}`, 404)
    }

    let deletedCount = 0
    const skippedBlogs: { id: string; title: string; reason: string }[] = []

    // Check ownership for each blog (if authorId provided)
    if (authorId) {
      for (const blog of blogs) {
        if (blog.authorId.toString() !== authorId) {
          skippedBlogs.push({
            id: blog._id.toString(),
            title: blog.title,
            reason: 'Not authorized to delete this blog'
          })
        }
      }

      // Only delete blogs owned by the user
      const ownedBlogIds = blogs.filter((blog) => blog.authorId.toString() === authorId).map((blog) => blog._id)

      const result = await Blog.deleteMany({ _id: { $in: ownedBlogIds } })
      deletedCount = result.deletedCount || 0
    } else {
      // Admin can delete all blogs
      const result = await Blog.deleteMany({ _id: { $in: uniqueBlogIds } })
      deletedCount = result.deletedCount || 0
    }

    return {
      deletedCount,
      skippedBlogs
    }
  }

  /**
   * Get published blogs only (public endpoint)
   */
  static async getPublishedBlogs(options: Partial<GetBlogsQuery> = {}): Promise<GetBlogsResult> {
    const { page = 1, limit = 10, search } = options
    // Convert string to number using + operator
    const pageNum = +page
    const limitNum = +limit
    const skip = (pageNum - 1) * limitNum

    // Build filter query for published blogs
    const filter: Record<string, unknown> = {
      status: 'published',
      publishedAt: { $lte: new Date() } // Only show blogs published on or before current date
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } },
        { excerpt: { $regex: search, $options: 'i' } }
      ]
    }

    // Execute queries in parallel
    const [blogsResult, total] = await Promise.all([
      Blog.aggregate([
        { $match: filter },
        { $skip: skip },
        { $limit: limitNum },
        {
          $lookup: {
            from: 'users',
            localField: 'authorId',
            foreignField: '_id',
            as: 'author',
            pipeline: [{ $project: { username: 1, avatar: 1 } }]
          }
        },
        {
          $lookup: {
            from: 'categories',
            localField: 'categoryId',
            foreignField: '_id',
            as: 'category',
            pipeline: [{ $project: { name: 1, slug: 1 } }]
          }
        },
        {
          $addFields: {
            author: { $arrayElemAt: ['$author', 0] },
            category: { $arrayElemAt: ['$category', 0] }
          }
        },
        {
          $unset: ['authorId', 'categoryId']
        }
      ]),
      Blog.countDocuments(filter)
    ])

    const blogs = blogsResult as IBlog[]

    const totalPages = Math.ceil(total / limitNum)

    return {
      blogs: blogs as IBlog[],
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
   * Get user's own blogs
   */
  static async getUserBlogs(authorId: string, options: Partial<GetBlogsQuery> = {}): Promise<GetBlogsResult> {
    return this.getBlogs({
      ...options,
      authorId
    })
  }
}
