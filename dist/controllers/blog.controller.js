"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BlogController = void 0;
const blog_service_1 = require("../services/blog.service");
const success_1 = require("../utils/success");
/**
 * Blog Controller
 * CRUD operations for blog posts
 */
class BlogController {
    /**
     * Create new blog post
     */
    static async createBlog(req, res) {
        const blogData = req.body;
        const authorId = req.user.userId;
        const blog = await blog_service_1.BlogService.createBlog(blogData, authorId);
        success_1.sendSuccess.created(res, 'Blog created successfully', blog);
    }
    /**
     * Get all blogs with pagination and filtering
     */
    static async getBlogs(req, res) {
        const query = req.query;
        const result = await blog_service_1.BlogService.getBlogs(query);
        success_1.sendSuccess.ok(res, 'Blogs fetched successfully', result);
    }
    /**
     * Get published blogs only (public endpoint)
     */
    static async getPublishedBlogs(req, res) {
        const query = req.query;
        const result = await blog_service_1.BlogService.getPublishedBlogs(query);
        success_1.sendSuccess.ok(res, 'Published blogs fetched successfully', result);
    }
    /**
     * Get current user's blogs
     */
    static async getUserBlogs(req, res) {
        const query = req.query;
        const authorId = req.user.userId;
        const result = await blog_service_1.BlogService.getUserBlogs(authorId, query);
        success_1.sendSuccess.ok(res, 'User blogs fetched successfully', result);
    }
    /**
     * Get blog by ID
     */
    static async getBlogById(req, res) {
        const { blogId } = req.params;
        const blog = await blog_service_1.BlogService.getBlogById(blogId);
        success_1.sendSuccess.ok(res, 'Blog fetched successfully', { blog });
    }
    /**
     * Get blog by slug (public endpoint)
     */
    static async getBlogBySlug(req, res) {
        const { slug } = req.params;
        const blog = await blog_service_1.BlogService.getBlogBySlug(slug);
        success_1.sendSuccess.ok(res, 'Blog fetched successfully', { blog });
    }
    /**
     * Update blog post
     */
    static async updateBlog(req, res) {
        const { blogId } = req.params;
        const updateData = req.body;
        const isAdmin = req.user.roles?.includes('admin') || false;
        const authorId = isAdmin ? undefined : req.user.userId;
        const blog = await blog_service_1.BlogService.updateBlog(blogId, updateData, authorId);
        success_1.sendSuccess.ok(res, 'Blog updated successfully', { blog });
    }
    /**
     * Delete blog post
     */
    static async deleteBlog(req, res) {
        const { blogId } = req.params;
        const isAdmin = req.user.roles?.includes('admin') || false;
        const authorId = isAdmin ? undefined : req.user.userId;
        await blog_service_1.BlogService.deleteBlog(blogId, authorId);
        success_1.sendSuccess.ok(res, 'Blog deleted successfully');
    }
    /**
     * Bulk delete blogs
     */
    static async bulkDeleteBlogs(req, res) {
        const bulkDeleteData = req.body;
        const isAdmin = req.user.roles?.includes('admin') || false;
        const authorId = isAdmin ? undefined : req.user.userId;
        const result = await blog_service_1.BlogService.bulkDeleteBlogs(bulkDeleteData, authorId);
        success_1.sendSuccess.ok(res, 'Blogs deleted successfully', result);
    }
}
exports.BlogController = BlogController;
