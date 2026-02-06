"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const course_1 = require("../models/course");
const category_1 = require("../models/category");
const user_1 = require("../models/user");
const errors_1 = require("../utils/errors");
const enums_1 = require("../enums");
/**
 * Course Management Service
 * Handles CRUD operations and course-related business logic
 */
class CourseService {
    /**
     * Helper method to get course with aggregation lookup
     */
    static async getCourseWithLookup(courseId) {
        const courses = await course_1.Course.aggregate([
            { $match: { _id: new mongoose_1.default.Types.ObjectId(courseId) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'authorId',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [{ $project: { name: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'chapters',
                    localField: 'chapterIds',
                    foreignField: '_id',
                    as: 'chapters',
                    pipeline: [{ $project: { title: 1, description: 1, order: 1, isPublished: 1 } }]
                }
            },
            {
                $addFields: {
                    authorId: '$authorId',
                    author: { $arrayElemAt: ['$author', 0] },
                    category: { $arrayElemAt: ['$category', 0] }
                }
            }
        ]);
        return courses[0];
    }
    /**
     * Create a new course
     */
    static async createCourse(courseData) {
        // Check if slug already exists
        const existingCourse = await course_1.Course.findOne({ slug: courseData.slug });
        if (existingCourse) {
            throw new errors_1.ConflictError('Course with this slug already exists', errors_1.ErrorCodes.DUPLICATE_ENTRY);
        }
        // Validate category exists
        const category = await category_1.Category.findById(courseData.categoryId);
        if (!category) {
            throw new errors_1.NotFoundError('Category not found', errors_1.ErrorCodes.CATEGORY_NOT_FOUND);
        }
        const course = new course_1.Course({
            ...courseData,
            chapterIds: [],
            view: 0,
            sold: 0
        });
        await course.save();
        return course;
    }
    /**
     * Get all courses with filtering, sorting, and pagination
     */
    static async getCourses(options = {}) {
        const { page = 1, limit = 10, search, level, status, type, authorId, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query
        const filter = {};
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }
        if (level) {
            if (Array.isArray(level)) {
                // Multiple level values
                filter.level = { $in: level };
            }
            else {
                // Single level value
                filter.level = level;
            }
        }
        if (status) {
            if (Array.isArray(status)) {
                // Multiple status values
                filter.status = { $in: status };
            }
            else {
                // Single status value
                filter.status = status;
            }
        }
        if (type) {
            if (Array.isArray(type)) {
                // Multiple type values - handle both 'free' and 'paid'
                const typeConditions = type
                    .map((t) => {
                    if (t === 'free') {
                        return { isFree: true };
                    }
                    else if (t === 'paid') {
                        return { isFree: false };
                    }
                    return null;
                })
                    .filter((condition) => condition !== null);
                if (typeConditions.length > 0) {
                    if (filter.$or) {
                        filter.$or = [...filter.$or, ...typeConditions];
                    }
                    else {
                        filter.$or = typeConditions;
                    }
                }
            }
            else {
                // Single type value
                if (type === 'free') {
                    filter.isFree = true;
                }
                else if (type === 'paid') {
                    filter.isFree = false;
                }
            }
        }
        if (authorId) {
            filter.authorId = authorId;
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries in parallel
        const [courses, total] = await Promise.all([
            course_1.Course.aggregate([
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
                        pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                    }
                },
                {
                    $lookup: {
                        from: 'categories',
                        localField: 'categoryId',
                        foreignField: '_id',
                        as: 'category',
                        pipeline: [{ $project: { name: 1 } }]
                    }
                },
                {
                    $lookup: {
                        from: 'chapters',
                        localField: 'chapterIds',
                        foreignField: '_id',
                        as: 'chapters',
                        pipeline: [{ $project: { title: 1, description: 1, order: 1, isPublished: 1 } }]
                    }
                },
                {
                    $addFields: {
                        authorId: '$authorId',
                        author: { $arrayElemAt: ['$author', 0] },
                        category: { $arrayElemAt: ['$category', 0] }
                    }
                }
            ]),
            course_1.Course.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(total / limitNum);
        return {
            courses,
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
     * Get public courses (only published courses with advanced filtering)
     */
    static async getPublicCourses(options = {}) {
        const { page = 1, limit = 10, search, categoryId, level, minPrice, maxPrice, minRating, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build aggregation pipeline
        const pipeline = [];
        // Step 1: Match published courses only
        const matchStage = {
            status: enums_1.CourseStatus.PUBLISHED
        };
        // Search filter - search in title and description
        if (search) {
            matchStage.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }
        // Category filter
        if (categoryId && categoryId !== 'all') {
            matchStage.categoryId = new mongoose_1.default.Types.ObjectId(categoryId);
        }
        // Level filter - support multiple levels
        if (level && level.length > 0) {
            if (Array.isArray(level)) {
                matchStage.level = { $in: level };
            }
            else if (typeof level === 'string' && level.includes(',')) {
                const levelArray = level.split(',').map((l) => l.trim());
                matchStage.level = { $in: levelArray };
            }
            else {
                matchStage.level = level;
            }
        }
        // Price range filter
        if (minPrice !== undefined || maxPrice !== undefined) {
            const priceFilter = {};
            if (minPrice !== undefined)
                priceFilter.$gte = +minPrice;
            if (maxPrice !== undefined)
                priceFilter.$lte = +maxPrice;
            matchStage.price = priceFilter;
        }
        pipeline.push({ $match: matchStage });
        // Step 2: Lookup related data
        pipeline.push(
        // Lookup author
        {
            $lookup: {
                from: 'users',
                localField: 'authorId',
                foreignField: '_id',
                as: 'author',
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            email: 1,
                            avatar: 1,
                            firstName: 1,
                            lastName: 1
                        }
                    }
                ]
            }
        }, 
        // Lookup category
        {
            $lookup: {
                from: 'categories',
                localField: 'categoryId',
                foreignField: '_id',
                as: 'category',
                pipeline: [{ $project: { name: 1, slug: 1 } }]
            }
        }, 
        // Lookup published lessons
        {
            $lookup: {
                from: 'lessons',
                localField: '_id',
                foreignField: 'courseId',
                as: 'lessons',
                pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
            }
        }, 
        // Lookup reviews
        {
            $lookup: {
                from: 'reviews',
                localField: '_id',
                foreignField: 'courseId',
                as: 'reviews',
                pipeline: [
                    {
                        $project: {
                            star: 1,
                            userId: 1,
                            createdAt: 1
                        }
                    }
                ]
            }
        }, 
        // Lookup enrolled users
        {
            $lookup: {
                from: 'users',
                let: { courseId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $in: ['$$courseId', '$courses']
                            }
                        }
                    },
                    { $project: { _id: 1 } }
                ],
                as: 'enrolledUsers'
            }
        });
        // Step 3: Add computed fields
        pipeline.push({
            $addFields: {
                author: { $arrayElemAt: ['$author', 0] },
                category: { $arrayElemAt: ['$category', 0] },
                // Calculate total duration from all published lessons
                totalDuration: {
                    $sum: '$lessons.duration'
                },
                // Calculate lesson count from all published lessons
                totalLessons: {
                    $size: '$lessons'
                },
                // Calculate average rating
                averageRating: {
                    $cond: {
                        if: { $gt: [{ $size: '$reviews' }, 0] },
                        then: { $round: [{ $avg: '$reviews.star' }, 2] },
                        else: 0
                    }
                },
                // Count total reviews
                totalReviews: { $size: '$reviews' },
                // Count enrolled students
                enrolledStudents: { $size: '$enrolledUsers' }
            }
        });
        // Step 4: Filter by rating if specified
        if (minRating && +minRating > 0) {
            pipeline.push({
                $match: {
                    averageRating: { $gte: +minRating }
                }
            });
        }
        // Step 5: Build sort object based on sortBy parameter
        const getSortObject = (sortBy, sortOrder) => {
            const order = sortOrder === 'desc' ? -1 : 1;
            switch (sortBy) {
                case 'newest':
                    return { createdAt: -1 };
                case 'popular':
                    return { enrolledStudents: -1, view: -1 };
                case 'rating':
                    return { averageRating: -1, totalReviews: -1 };
                case 'price':
                    return { price: order };
                case 'alphabetical':
                    return { title: 1 };
                case 'createdAt':
                default:
                    return { createdAt: order };
            }
        };
        pipeline.push({ $sort: getSortObject(sortBy, sortOrder) });
        // Step 6: Project final fields
        pipeline.push({
            $project: {
                // Course basic info
                _id: 1,
                title: 1,
                description: 1,
                excerpt: 1,
                slug: 1,
                image: 1,
                level: 1,
                price: 1,
                isFree: 1,
                oldPrice: 1,
                originalPrice: 1,
                status: 1,
                createdAt: 1,
                updatedAt: 1,
                view: 1,
                sold: 1,
                // Computed fields
                totalDuration: 1,
                totalLessons: 1,
                averageRating: 1,
                totalReviews: 1,
                enrolledStudents: 1,
                // Related data
                author: 1,
                authorId: 1,
                category: 1
            }
        });
        // Execute count pipeline (without pagination)
        const countPipeline = [...pipeline];
        countPipeline.push({ $count: 'total' });
        // Add pagination to main pipeline
        pipeline.push({ $skip: skip }, { $limit: limitNum });
        // Execute both pipelines in parallel
        const [coursesResult, countResult] = await Promise.all([
            course_1.Course.aggregate(pipeline),
            course_1.Course.aggregate(countPipeline)
        ]);
        const total = countResult[0]?.total || 0;
        const totalPages = Math.ceil(total / limitNum);
        return {
            courses: coursesResult,
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
     * Get free courses (only published free courses)
     */
    static async getFreeCourses(options = {}) {
        const { page = 1, limit = 10, search, categoryId, level, sortBy = 'createdAt', sortOrder = 'desc' } = options;
        // Convert string to number using + operator
        const pageNum = +page;
        const limitNum = +limit;
        const skip = (pageNum - 1) * limitNum;
        // Build filter query - always force published and free courses
        const filter = {
            status: enums_1.CourseStatus.PUBLISHED,
            isFree: true
        };
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } },
                { excerpt: { $regex: search, $options: 'i' } }
            ];
        }
        if (categoryId && categoryId !== 'all') {
            filter.categoryId = categoryId;
        }
        if (level && level.length > 0) {
            if (Array.isArray(level)) {
                filter.level = { $in: level };
            }
            else {
                filter.level = level;
            }
        }
        // Build sort object
        const sort = {};
        sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
        // Execute queries in parallel
        const [courses, total] = await Promise.all([
            course_1.Course.aggregate([
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
                        pipeline: [
                            {
                                $project: {
                                    username: 1,
                                    email: 1,
                                    avatar: 1,
                                    firstName: 1,
                                    lastName: 1
                                }
                            }
                        ]
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
                    $lookup: {
                        from: 'chapters',
                        localField: 'chapterIds',
                        foreignField: '_id',
                        as: 'chapters',
                        pipeline: [
                            { $match: { isPublished: true } },
                            {
                                $project: {
                                    title: 1,
                                    description: 1,
                                    order: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'lessons',
                        localField: '_id',
                        foreignField: 'courseId',
                        as: 'lessons',
                        pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
                    }
                },
                {
                    $lookup: {
                        from: 'reviews',
                        localField: '_id',
                        foreignField: 'courseId',
                        as: 'reviews',
                        pipeline: [
                            {
                                $project: {
                                    star: 1,
                                    userId: 1,
                                    createdAt: 1
                                }
                            }
                        ]
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id',
                        foreignField: 'courses',
                        as: 'enrolledUsers'
                    }
                },
                {
                    $addFields: {
                        author: { $arrayElemAt: ['$author', 0] },
                        category: { $arrayElemAt: ['$category', 0] },
                        // Calculate total duration
                        totalDuration: { $sum: '$lessons.duration' },
                        // Count total lessons
                        totalLessons: { $size: '$lessons' },
                        // Calculate average rating
                        averageRating: {
                            $cond: {
                                if: { $gt: [{ $size: '$reviews' }, 0] },
                                then: { $avg: '$reviews.star' },
                                else: 0
                            }
                        },
                        // Count total reviews
                        totalReviews: { $size: '$reviews' },
                        // Count enrolled students
                        enrolledStudents: { $size: '$enrolledUsers' }
                    }
                },
                {
                    $project: {
                        title: 1,
                        slug: 1,
                        image: 1,
                        description: 1,
                        excerpt: 1,
                        introUrl: 1,
                        price: 1,
                        oldPrice: 1,
                        originalPrice: 1,
                        isFree: 1,
                        status: 1,
                        level: 1,
                        createdAt: 1,
                        updatedAt: 1,
                        view: 1,
                        sold: 1,
                        // Computed fields
                        totalDuration: 1,
                        totalLessons: 1,
                        averageRating: 1,
                        totalReviews: 1,
                        enrolledStudents: 1,
                        // Related data
                        author: 1,
                        authorId: 1,
                        category: 1
                    }
                }
            ]),
            course_1.Course.countDocuments(filter)
        ]);
        const totalPages = Math.ceil(total / limitNum);
        return {
            courses,
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
    static async getCourseBySlug(slug) {
        const filter = { slug, status: enums_1.CourseStatus.PUBLISHED };
        const [course] = await course_1.Course.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'authorId',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
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
                $lookup: {
                    from: 'lessons',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'lessons',
                    pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'reviews',
                    pipeline: [
                        {
                            $project: {
                                star: 1,
                                comment: 1,
                                userId: 1,
                                createdAt: 1
                            }
                        }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { courseId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$$courseId', '$courses']
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: 'enrolledUsers'
                }
            },
            {
                $addFields: {
                    author: { $arrayElemAt: ['$author', 0] },
                    category: { $arrayElemAt: ['$category', 0] },
                    // Calculate total duration from all published lessons
                    totalDuration: {
                        $sum: '$lessons.duration'
                    },
                    // Calculate lesson count from all published lessons
                    totalLessons: {
                        $size: '$lessons'
                    },
                    // Calculate average rating
                    averageRating: {
                        $cond: {
                            if: { $gt: [{ $size: '$reviews' }, 0] },
                            then: { $round: [{ $avg: '$reviews.star' }, 2] },
                            else: 0
                        }
                    },
                    // Count total reviews
                    totalReviews: { $size: '$reviews' },
                    // Count enrolled students
                    enrolledStudents: { $size: '$enrolledUsers' }
                }
            },
            {
                $project: {
                    // Course basic info
                    _id: 1,
                    title: 1,
                    description: 1,
                    excerpt: 1,
                    slug: 1,
                    image: 1,
                    level: 1,
                    price: 1,
                    isFree: 1,
                    oldPrice: 1,
                    originalPrice: 1,
                    status: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    view: 1,
                    sold: 1,
                    info: 1,
                    introUrl: 1,
                    // Computed fields
                    totalDuration: 1,
                    totalLessons: 1,
                    averageRating: 1,
                    totalReviews: 1,
                    enrolledStudents: 1,
                    // Related data
                    author: 1,
                    authorId: 1,
                    category: 1
                }
            }
        ]);
        if (!course) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        return course;
    }
    /**
     * Get course by ID
     */
    static async getCourseById(courseId, includeUnpublished = false) {
        const filter = { _id: courseId };
        if (!includeUnpublished) {
            filter.status = enums_1.CourseStatus.PUBLISHED;
        }
        const courses = await course_1.Course.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'authorId',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [{ $project: { name: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'chapters',
                    localField: 'chapterIds',
                    foreignField: '_id',
                    as: 'chapters',
                    pipeline: [{ $project: { title: 1, description: 1, order: 1, isPublished: 1, duration: 1 } }]
                }
            },
            {
                $addFields: {
                    author: { $arrayElemAt: ['$author', 0] },
                    category: { $arrayElemAt: ['$category', 0] }
                }
            }
        ]);
        if (!courses.length) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        return courses[0];
    }
    /**
     * Update course
     */
    static async updateCourse(courseId, updateData) {
        const course = await course_1.Course.findById(courseId);
        if (!course) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        // Check if slug is being updated and already exists
        if (updateData.slug && updateData.slug !== course.slug) {
            const existingCourse = await course_1.Course.findOne({ slug: updateData.slug });
            if (existingCourse) {
                throw new errors_1.ConflictError('Course with this slug already exists', errors_1.ErrorCodes.DUPLICATE_ENTRY);
            }
        }
        // Validate author if being updated
        if (updateData.authorId) {
            const author = await user_1.User.findById(updateData.authorId);
            if (!author) {
                throw new errors_1.NotFoundError('Author not found', errors_1.ErrorCodes.USER_NOT_FOUND);
            }
        }
        // Validate category if being updated
        if (updateData.categoryId) {
            const category = await category_1.Category.findById(updateData.categoryId);
            if (!category) {
                throw new errors_1.NotFoundError('Category not found', errors_1.ErrorCodes.CATEGORY_NOT_FOUND);
            }
        }
        // Update the course
        Object.assign(course, updateData);
        await course.save();
        // Get course with lookup data
        return await this.getCourseWithLookup(courseId);
    }
    /**
     * Delete course
     */
    static async deleteCourse(courseId) {
        const course = await course_1.Course.findById(courseId);
        if (!course) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        // Check if course is enrolled by any users
        const enrolledUsers = await user_1.User.countDocuments({ courses: courseId });
        if (enrolledUsers > 0) {
            throw new errors_1.ConflictError(`Cannot delete course. It has ${enrolledUsers} enrolled user(s)`, errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        // Remove course from any user's course arrays (just in case)
        await user_1.User.updateMany({ courses: courseId }, { $pull: { courses: courseId } });
        // Delete the course
        await course_1.Course.findByIdAndDelete(courseId);
    }
    /**
     * Increment course view count
     */
    static async incrementView(courseId) {
        await course_1.Course.findByIdAndUpdate(courseId, { $inc: { view: 1 } });
    }
    /**
     * Increment course sold count
     */
    static async incrementSold(courseId) {
        await course_1.Course.findByIdAndUpdate(courseId, { $inc: { sold: 1 } });
    }
    /**
     * Enroll user in free course
     */
    static async enrollInFreeCourse(courseId, userId) {
        // Check if course exists and is free
        const course = await course_1.Course.findById(courseId);
        if (!course) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        if (!course.isFree) {
            throw new errors_1.ValidationError('This course is not free', errors_1.ErrorCodes.COUPON_NOT_APPLICABLE);
        }
        if (course.status !== enums_1.CourseStatus.PUBLISHED) {
            throw new errors_1.ValidationError('Course is not published', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        // Check if user is already enrolled
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // Check if already enrolled
        const courseObjectId = new mongoose_1.default.Types.ObjectId(courseId);
        if (user.courses && user.courses.some((c) => c.toString() === courseId)) {
            throw new errors_1.ConflictError('Already enrolled in this course', errors_1.ErrorCodes.DUPLICATE_ENTRY);
        }
        // Add course to user's enrolled courses and increment sold count
        await user_1.User.findByIdAndUpdate(userId, { $addToSet: { courses: courseObjectId } });
        await course_1.Course.findByIdAndUpdate(courseId, { $inc: { sold: 1 } });
    }
    /**
     * Bulk delete courses
     */
    static async bulkDelete(courseIds) {
        const validIds = courseIds.filter((id) => mongoose_1.default.Types.ObjectId.isValid(id));
        if (validIds.length !== courseIds.length) {
            throw new errors_1.ValidationError('Some course IDs are invalid', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        // Check if any courses have enrolled users
        const enrolledUsersCount = await user_1.User.countDocuments({ courses: { $in: validIds } });
        if (enrolledUsersCount > 0) {
            throw new errors_1.ConflictError('Cannot delete courses that have enrolled users', errors_1.ErrorCodes.UNAUTHORIZED_ACTION);
        }
        // Remove courses from user arrays
        await user_1.User.updateMany({ courses: { $in: validIds } }, { $pull: { courses: { $in: validIds } } });
        // Delete courses
        await course_1.Course.deleteMany({ _id: { $in: validIds } });
    }
    /**
     * Get related courses based on category, level, and tags
     */
    static async getRelatedCourses(courseId, limit = 10) {
        // First get the source course to find related courses
        const sourceCourse = await course_1.Course.findById(courseId);
        if (!sourceCourse) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        // Build aggregation pipeline for related courses
        const pipeline = [
            {
                $match: {
                    _id: { $ne: new mongoose_1.default.Types.ObjectId(courseId) }, // Exclude the source course
                    status: enums_1.CourseStatus.PUBLISHED, // Only published courses
                    $or: [
                        { categoryId: sourceCourse.categoryId }, // Same category
                        { level: sourceCourse.level }, // Same level
                        { authorId: sourceCourse.authorId } // Same author
                    ]
                }
            },
            {
                $addFields: {
                    // Calculate relevance score
                    relevanceScore: {
                        $add: [
                            { $cond: [{ $eq: ['$categoryId', sourceCourse.categoryId] }, 3, 0] }, // Category match = 3 points
                            { $cond: [{ $eq: ['$level', sourceCourse.level] }, 2, 0] }, // Level match = 2 points
                            { $cond: [{ $eq: ['$authorId', sourceCourse.authorId] }, 1, 0] } // Author match = 1 point
                        ]
                    }
                }
            },
            { $sort: { relevanceScore: -1, sold: -1, view: -1 } }, // Sort by relevance, then popularity
            { $limit: limit },
            // Lookup related data
            {
                $lookup: {
                    from: 'users',
                    localField: 'authorId',
                    foreignField: '_id',
                    as: 'author',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'categoryId',
                    foreignField: '_id',
                    as: 'category',
                    pipeline: [{ $project: { name: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'lessons',
                    pipeline: [{ $match: { isPublished: true } }, { $project: { duration: 1, _id: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    let: { courseId: '$_id' },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $in: ['$$courseId', '$courses']
                                }
                            }
                        },
                        { $project: { _id: 1 } }
                    ],
                    as: 'enrolledUsers'
                }
            },
            {
                $addFields: {
                    // Calculate total duration from all published lessons
                    totalDuration: {
                        $sum: '$lessons.duration'
                    },
                    // Count enrolled students
                    enrolledStudents: { $size: '$enrolledUsers' }
                }
            },
            {
                $unwind: { path: '$author', preserveNullAndEmptyArrays: true }
            },
            {
                $unwind: { path: '$category', preserveNullAndEmptyArrays: true }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    image: 1,
                    description: 1,
                    excerpt: 1,
                    price: 1,
                    oldPrice: 1,
                    originalPrice: 1,
                    isFree: 1,
                    status: 1,
                    view: 1,
                    sold: 1,
                    level: 1,
                    totalDuration: 1,
                    enrolledStudents: 1,
                    author: 1,
                    category: 1,
                    createdAt: 1,
                    updatedAt: 1,
                    relevanceScore: 1
                }
            }
        ];
        const courses = await course_1.Course.aggregate(pipeline);
        return courses;
    }
    /**
     * Get courses that a user is enrolled in
     */
    static async getMyCourses(userId) {
        // Validate user exists
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.NotFoundError('User not found', errors_1.ErrorCodes.USER_NOT_FOUND);
        }
        // If user has no enrolled courses, return empty array
        if (!user.courses || user.courses.length === 0) {
            return [];
        }
        // Get enrolled courses with only needed information
        const courses = await course_1.Course.aggregate([
            {
                $match: {
                    _id: { $in: user.courses }
                }
            },
            // Lookup lessons for count
            {
                $lookup: {
                    from: 'lessons',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'lessons',
                    pipeline: [{ $match: { isPublished: true } }, { $project: { _id: 1 } }]
                }
            },
            // Lookup user's lesson progress from tracks
            {
                $lookup: {
                    from: 'tracks',
                    let: { courseId: '$_id', userId: new mongoose_1.default.Types.ObjectId(userId) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$courseId', '$$courseId'] }]
                                }
                            }
                        },
                        {
                            $project: {
                                lessonId: 1
                            }
                        }
                    ],
                    as: 'completedTracks'
                }
            },
            // Lookup course completion records
            {
                $lookup: {
                    from: 'coursecompletions',
                    let: { courseId: '$_id', userId: new mongoose_1.default.Types.ObjectId(userId) },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [{ $eq: ['$userId', '$$userId'] }, { $eq: ['$courseId', '$$courseId'] }]
                                }
                            }
                        },
                        {
                            $project: {
                                completedAt: 1
                            }
                        }
                    ],
                    as: 'completionRecords'
                }
            },
            // Lookup reviews for rating
            {
                $lookup: {
                    from: 'reviews',
                    localField: '_id',
                    foreignField: 'courseId',
                    as: 'reviews',
                    pipeline: [{ $project: { star: 1 } }]
                }
            },
            // Add computed fields
            {
                $addFields: {
                    // Calculate lesson count from all published lessons
                    totalLessons: {
                        $size: '$lessons'
                    },
                    // Calculate completed lessons from tracks
                    completedLessons: {
                        $size: '$completedTracks'
                    },
                    // Calculate average rating
                    averageRating: {
                        $cond: {
                            if: { $gt: [{ $size: '$reviews' }, 0] },
                            then: { $round: [{ $avg: '$reviews.star' }, 2] },
                            else: 0
                        }
                    },
                    // Count total reviews
                    totalReviews: { $size: '$reviews' },
                    completedAt: { $arrayElemAt: ['$completionRecords.completedAt', 0] }
                }
            },
            // Compute completion flag based on counts
            {
                $addFields: {
                    isCompleted: {
                        $cond: {
                            if: { $gt: ['$totalLessons', 0] },
                            then: { $eq: ['$completedLessons', '$totalLessons'] },
                            else: false
                        }
                    },
                    progressPercent: {
                        $cond: {
                            if: { $gt: ['$totalLessons', 0] },
                            then: { $round: [{ $multiply: [{ $divide: ['$completedLessons', '$totalLessons'] }, 100] }, 0] },
                            else: 0
                        }
                    }
                }
            },
            // Sort by creation date
            {
                $sort: { createdAt: -1 }
            },
            // Project only needed fields
            {
                $project: {
                    _id: 1,
                    title: 1,
                    slug: 1,
                    description: 1,
                    excerpt: 1,
                    image: 1,
                    level: 1,
                    totalLessons: 1,
                    completedLessons: 1,
                    isCompleted: 1,
                    completedAt: 1,
                    progressPercent: 1,
                    averageRating: 1,
                    totalReviews: 1
                }
            }
        ]);
        return courses;
    }
}
exports.CourseService = CourseService;
