"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapterService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const models_1 = require("../models");
const errors_1 = require("../utils/errors");
class ChapterService {
    /**
     * Create a new chapter
     */
    static async createChapter(chapterData) {
        // Check if course exists
        const courseExists = await models_1.Course.exists({ _id: chapterData.courseId });
        if (!courseExists) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        // Get the highest order number for this course and increment by 1
        const lastChapter = await models_1.Chapter.findOne({ courseId: chapterData.courseId }).sort({ order: -1 });
        const nextOrder = lastChapter ? lastChapter.order + 1 : 1;
        const chapter = await models_1.Chapter.create({
            title: chapterData.title,
            description: chapterData.description,
            courseId: chapterData.courseId,
            order: nextOrder,
            isPublished: chapterData.isPublished ?? false,
            lessonIds: []
        });
        // Add the new chapter ID to the course's chapterIds array
        await models_1.Course.updateOne({ _id: chapterData.courseId }, { $push: { chapterIds: chapter._id } });
        return chapter;
    }
    /**
     * Get chapters for a specific course with populated course and lessons data
     */
    static async getChapters(options) {
        const { courseId } = options;
        // Check if course exists
        const courseExists = await models_1.Course.exists({ _id: courseId });
        if (!courseExists) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        // Use aggregation pipeline to get chapters with populated lessons
        const chapters = await models_1.Chapter.aggregate([
            {
                $match: { courseId: new mongoose_1.default.Types.ObjectId(courseId) }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'lessonIds',
                    foreignField: '_id',
                    as: 'lessons',
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                contentType: 1,
                                resourceId: 1,
                                order: 1,
                                preview: 1,
                                isPublished: 1,
                                duration: 1
                            }
                        },
                        {
                            $sort: { order: 1 }
                        }
                    ]
                }
            },
            {
                $sort: { order: 1 }
            }
        ]);
        return chapters;
    }
    /**
     * Get chapter by ID
     */
    static async getChapterById(chapterId) {
        const chapters = await models_1.Chapter.aggregate([
            {
                $match: { _id: new mongoose_1.default.Types.ObjectId(chapterId) }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'lessonIds',
                    foreignField: '_id',
                    as: 'lessons',
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                contentType: 1,
                                order: 1,
                                preview: 1,
                                isPublished: 1,
                                duration: 1,
                                resourceId: 1
                            }
                        },
                        {
                            $sort: { order: 1 }
                        }
                    ]
                }
            }
        ]);
        if (!chapters || chapters.length === 0) {
            throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
        }
        return chapters[0];
    }
    /**
     * Update chapter
     */
    static async updateChapter(chapterId, updateData) {
        const updatedChapter = await models_1.Chapter.findByIdAndUpdate(chapterId, updateData, {
            new: true, // Return updated document
            runValidators: true // Run schema validations
        });
        if (!updatedChapter) {
            throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
        }
        return updatedChapter;
    }
    /**
     * Delete chapter
     */
    static async deleteChapter(chapterId) {
        const chapter = await models_1.Chapter.findById(chapterId);
        if (!chapter) {
            throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
        }
        // Remove chapter from course's chapterIds array
        await models_1.Course.updateOne({ _id: chapter.courseId }, { $pull: { chapterIds: chapterId } });
        await models_1.Chapter.findByIdAndDelete(chapterId);
    }
    /**
     * Get chapters for a specific course
     */
    static async getPublicChaptersForCourse(courseId) {
        // Check if course exists
        const courseExists = await models_1.Course.exists({ _id: courseId });
        if (!courseExists) {
            throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
        }
        // Build filter query - only get published chapters
        const matchFilter = {
            courseId: new mongoose_1.default.Types.ObjectId(courseId),
            isPublished: true
        };
        // Execute aggregation pipeline
        const chapters = await models_1.Chapter.aggregate([
            { $match: matchFilter },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'lessonIds',
                    foreignField: '_id',
                    as: 'lessons',
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                contentType: 1,
                                preview: 1,
                                duration: 1,
                                order: 1
                            }
                        },
                        { $sort: { order: 1 } }
                    ]
                }
            },
            { $sort: { order: 1 } }
        ]);
        return chapters;
    }
    /**
     * Reorder chapters within a course
     */
    static async reorderChapters(reorderData) {
        const { chapters } = reorderData;
        // Get chapter IDs
        const chapterIds = chapters.map((ch) => ch.id);
        // Check if all chapters exist and belong to the same course
        const existingChapters = await models_1.Chapter.find({ _id: { $in: chapterIds } });
        if (existingChapters.length !== chapterIds.length) {
            throw new errors_1.NotFoundError('One or more chapters not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
        }
        // Ensure all chapters belong to the same course
        const courseIds = [...new Set(existingChapters.map((ch) => ch.courseId.toString()))];
        if (courseIds.length > 1) {
            throw new errors_1.ValidationError('All chapters must belong to the same course', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        // Update orders using bulkWrite (no transaction needed for this use case)
        const bulkOperations = chapters.map(({ id, order }) => ({
            updateOne: {
                filter: { _id: id },
                update: { $set: { order } }
            }
        }));
        // Execute bulk write operation
        await models_1.Chapter.bulkWrite(bulkOperations);
        // Return updated chapters
        const updatedChapters = await models_1.Chapter.find({ _id: { $in: chapterIds } }).sort({ order: 1 });
        return updatedChapters;
    }
    /**
     * Add lesson to chapter
     */
    static async addLessonToChapter(chapterId, lessonId) {
        const chapter = await models_1.Chapter.findById(chapterId);
        if (!chapter) {
            throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
        }
        // Check if lesson is already in the chapter
        if (chapter.lessonIds.includes(new mongoose_1.default.Types.ObjectId(lessonId))) {
            throw new errors_1.ConflictError('Lesson already added to chapter', errors_1.ErrorCodes.DUPLICATE_ENTRY);
        }
        // Add lesson to chapter
        chapter.lessonIds.push(new mongoose_1.default.Types.ObjectId(lessonId));
        await chapter.save();
        // Return chapter with populated lessons using aggregation
        const [updatedChapter] = await models_1.Chapter.aggregate([
            {
                $match: { _id: new mongoose_1.default.Types.ObjectId(chapterId) }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'lessonIds',
                    foreignField: '_id',
                    as: 'lessons',
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                contentType: 1,
                                order: 1,
                                preview: 1,
                                isPublished: 1,
                                duration: 1
                            }
                        },
                        { $sort: { order: 1 } }
                    ]
                }
            }
        ]);
        return updatedChapter;
    }
    /**
     * Remove lesson from chapter
     */
    static async removeLessonFromChapter(chapterId, lessonId) {
        const chapter = await models_1.Chapter.findById(chapterId);
        if (!chapter) {
            throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
        }
        // Remove lesson from chapter
        chapter.lessonIds = chapter.lessonIds.filter((lesson) => !lesson.equals(new mongoose_1.default.Types.ObjectId(lessonId)));
        await chapter.save();
        // Return chapter with populated lessons using aggregation
        const [updatedChapter] = await models_1.Chapter.aggregate([
            {
                $match: { _id: new mongoose_1.default.Types.ObjectId(chapterId) }
            },
            {
                $lookup: {
                    from: 'lessons',
                    localField: 'lessonIds',
                    foreignField: '_id',
                    as: 'lessons',
                    pipeline: [
                        {
                            $project: {
                                title: 1,
                                contentType: 1,
                                order: 1,
                                preview: 1,
                                isPublished: 1,
                                duration: 1
                            }
                        },
                        { $sort: { order: 1 } }
                    ]
                }
            }
        ]);
        return updatedChapter;
    }
}
exports.ChapterService = ChapterService;
