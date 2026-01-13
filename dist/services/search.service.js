"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchService = void 0;
const course_1 = require("../models/course");
const blog_1 = require("../models/blog");
const enums_1 = require("../enums");
/**
 * Search Service
 * Handles searching across courses and blogs
 */
class SearchService {
    /**
     * Search for courses and blogs based on query string
     * Returns 5 latest courses and 5 latest blogs matching the query
     */
    static async search(query) {
        // Build search regex for case-insensitive search
        const searchRegex = new RegExp(query, 'i');
        // Search courses
        const courses = await course_1.Course.aggregate([
            {
                $match: {
                    $or: [
                        { title: { $regex: searchRegex } },
                        { description: { $regex: searchRegex } },
                        { excerpt: { $regex: searchRegex } }
                    ],
                    status: enums_1.CourseStatus.PUBLISHED
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
        ]);
        // Search blogs
        const blogs = await blog_1.Blog.aggregate([
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
        ]);
        return {
            courses,
            blogs
        };
    }
}
exports.SearchService = SearchService;
