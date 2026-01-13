"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogService = void 0;
const blog_1 = require("../models/blog");
const category_1 = require("../models/category");
const user_1 = require("../models/user");
const errors_1 = require("../utils/errors");
const mongoose_1 = require("mongoose");
class BlogService {
    /**
     * Create a new blog post
     */
    static async createBlog(blogData, authorId) {
        // Check if slug already exists
        const existingBlog = await blog_1.Blog.findOne({ slug: blogData.slug });
        if (existingBlog) {
            throw new errors_1.AppError('Blog with this slug already exists', 400);
        }
        // Validate author exists
        const author = await user_1.User.findById(authorId);
        if (!author) {
            throw new errors_1.AppError('Author not found', 404);
        }
        // Validate categories exist (if provided)
        if (blogData.categoryId) {
            const category = await category_1.Category.findById(blogData.categoryId);
            if (!category) {
                throw new errors_1.AppError('Category not found', 400);
            }
        }
        const blog = new blog_1.Blog({
            ...blogData,
            authorId
        });
        await blog.save();
        return blog;
    }
    /**
     * Get all blogs with pagination and filtering
     */
    static async getBlogs(options = {}) {
        const { page = 1, limit = 10, search, status, authorId, categoryId, sortBy = 'publishedAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }
        if (status) {
            if (Array.isArray(status)) {
                filter.status = { $in: status };
            }
            else if (typeof status === 'string' && status.includes(',')) {
                const statusArray = status.split(',').map((s) => s.trim());
                filter.status = { $in: statusArray };
            }
            else {
                filter.status = status;
            }
        }
        if (authorId) {
            filter.authorId = authorId;
        }
        if (categoryId) {
            filter.categoryId = categoryId;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries in parallel
        const [blogsResult, total] = await Promise.all([
            blog_1.Blog.aggregate([
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
            blog_1.Blog.countDocuments(filter)
        ]);
        const blogs = blogsResult;
        const totalPages = Math.ceil(total / limitNum);
        return {
            blogs: blogs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get blog by ID
     */
    static async getBlogById(blogId) {
        const blogResult = await blog_1.Blog.aggregate([
            { $match: { _id: new mongoose_1.Types.ObjectId(blogId) } },
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
        ]);
        const blog = blogResult[0];
        if (!blog) {
            throw new errors_1.AppError('Blog not found', 404);
        }
        return blog;
    }
    /**
     * Get blog by slug
     */
    static async getBlogBySlug(slug) {
        const blogResult = await blog_1.Blog.aggregate([
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
        ]);
        const blog = blogResult[0];
        if (!blog) {
            throw new errors_1.AppError('Blog not found', 404);
        }
        return blog;
    }
    /**
     * Update blog
     */
    static async updateBlog(blogId, updateData, authorId) {
        const blog = await blog_1.Blog.findById(blogId);
        if (!blog) {
            throw new errors_1.AppError('Blog not found', 404);
        }
        // Check ownership (if authorId provided - for non-admin users)
        if (authorId && blog.authorId.toString() !== authorId) {
            throw new errors_1.AppError('Not authorized to update this blog', 403);
        }
        // Check if slug is being updated and already exists
        if (updateData.slug && updateData.slug !== blog.slug) {
            const existingBlog = await blog_1.Blog.findOne({ slug: updateData.slug });
            if (existingBlog) {
                throw new errors_1.AppError('Blog with this slug already exists', 400);
            }
        }
        // Validate categories exist (if provided)
        if (updateData.categoryId) {
            const category = await category_1.Category.findById(updateData.categoryId);
            if (!category) {
                throw new errors_1.AppError('Category not found', 400);
            }
        }
        // Update the blog
        Object.assign(blog, updateData);
        await blog.save();
        const updatedBlogResult = await blog_1.Blog.aggregate([
            { $match: { _id: new mongoose_1.Types.ObjectId(blogId) } },
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
        ]);
        return updatedBlogResult[0];
    }
    /**
     * Delete blog
     */
    static async deleteBlog(blogId, authorId) {
        const blog = await blog_1.Blog.findById(blogId);
        if (!blog) {
            throw new errors_1.AppError('Blog not found', 404);
        }
        // Check ownership (if authorId provided - for non-admin users)
        if (authorId && blog.authorId.toString() !== authorId) {
            throw new errors_1.AppError('Not authorized to delete this blog', 403);
        }
        await blog_1.Blog.findByIdAndDelete(blogId);
    }
    /**
     * Bulk delete blogs
     */
    static async bulkDeleteBlogs(data, authorId) {
        const { blogIds } = data;
        // Remove duplicates
        const uniqueBlogIds = [...new Set(blogIds)];
        // Validate all blogs exist
        const blogs = await blog_1.Blog.find({ _id: { $in: uniqueBlogIds } });
        const foundBlogIds = blogs.map((blog) => blog._id.toString());
        const notFoundIds = uniqueBlogIds.filter((id) => !foundBlogIds.includes(id));
        if (notFoundIds.length > 0) {
            throw new errors_1.AppError(`Blogs not found: ${notFoundIds.join(', ')}`, 404);
        }
        let deletedCount = 0;
        const skippedBlogs = [];
        // Check ownership for each blog (if authorId provided)
        if (authorId) {
            for (const blog of blogs) {
                if (blog.authorId.toString() !== authorId) {
                    skippedBlogs.push({
                        id: blog._id.toString(),
                        title: blog.title,
                        reason: 'Not authorized to delete this blog'
                    });
                }
            }
            // Only delete blogs owned by the user
            const ownedBlogIds = blogs.filter((blog) => blog.authorId.toString() === authorId).map((blog) => blog._id);
            const result = await blog_1.Blog.deleteMany({ _id: { $in: ownedBlogIds } });
            deletedCount = result.deletedCount || 0;
        }
        else {
            // Admin can delete all blogs
            const result = await blog_1.Blog.deleteMany({ _id: { $in: uniqueBlogIds } });
            deletedCount = result.deletedCount || 0;
        }
        return {
            deletedCount,
            skippedBlogs
        };
    }
    /**
     * Get published blogs only (public endpoint)
     */
    static async getPublishedBlogs(options = {}) {
        const { page = 1, limit = 10, search } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query for published blogs
        const filter = {
            status: 'published',
            publishedAt: { $lte: new Date() } // Only show blogs published on or before current date
        };
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { content: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }
        // Execute queries in parallel
        const [blogsResult, total] = await Promise.all([
            blog_1.Blog.aggregate([
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
            blog_1.Blog.countDocuments(filter)
        ]);
        const blogs = blogsResult;
        const totalPages = Math.ceil(total / limitNum);
        return {
            blogs: blogs,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get user's own blogs
     */
    static async getUserBlogs(authorId, options = {}) {
        return this.getBlogs({
            ...options,
            authorId
        });
    }
}
exports.BlogService = BlogService;
