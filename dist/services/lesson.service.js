"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const lesson_1 = require("../models/lesson");
const quiz_question_1 = require("../models/quiz-question");
const chapter_1 = require("../models/chapter");
const course_1 = require("../models/course");
const errors_1 = require("../utils/errors");
/**
 * Lesson Service with unified CRUD operations
 */
// Helper function to convert select array to object
const getSelectData = (select) => {
    return Object.fromEntries(select.map((item) => [item, 1]));
};
class LessonService {
    /**
     * Create a new lesson with resource
     */
    static async createLesson(lessonData) {
        // Validate that resource is provided
        if (!lessonData.resource) {
            throw new errors_1.ValidationError('resource is required', errors_1.ErrorCodes.REQUIRED_FIELD_MISSING);
        }
        const session = await mongoose_1.default.startSession();
        try {
            const result = await session.withTransaction(async () => {
                const [chapter, course] = await Promise.all([
                    chapter_1.Chapter.findById(lessonData.chapterId).session(session),
                    course_1.Course.findById(lessonData.courseId).session(session)
                ]);
                if (!chapter) {
                    throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
                }
                if (!course) {
                    throw new errors_1.NotFoundError('Course not found', errors_1.ErrorCodes.COURSE_NOT_FOUND);
                }
                if (chapter.courseId.toString() !== lessonData.courseId.toString()) {
                    throw new errors_1.ValidationError('Chapter does not belong to the specified course', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
                }
                let createdResources;
                switch (lessonData.contentType) {
                    case 'video': {
                        const videoData = lessonData.resource;
                        createdResources = await lesson_1.Video.create([videoData], { session, ordered: true });
                        break;
                    }
                    case 'article': {
                        const articleData = lessonData.resource;
                        createdResources = await lesson_1.Article.create([articleData], { session, ordered: true });
                        break;
                    }
                    case 'quiz': {
                        const quizData = lessonData.resource;
                        // Create quiz without questions first
                        const { questions, ...quizCreateData } = quizData;
                        // Add duration from lessonData to quiz (default to 0 if not provided)
                        const quizDataWithDuration = {
                            ...quizCreateData,
                            duration: lessonData.duration || 0
                        };
                        createdResources = await lesson_1.Quiz.create([quizDataWithDuration], { session, ordered: true });
                        // If questions are provided, create them directly
                        if (questions && questions.length > 0) {
                            const quizId = createdResources[0]._id.toString();
                            const questionsWithQuizId = questions.map((question) => ({
                                ...question,
                                quizId: quizId
                            }));
                            // Create questions directly using QuizQuestion model
                            await quiz_question_1.QuizQuestion.insertMany(questionsWithQuizId, { session });
                        }
                        break;
                    }
                    default:
                        throw new errors_1.ValidationError('Invalid content type', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
                }
                const lastLesson = await lesson_1.Lesson.findOne({ chapterId: lessonData.chapterId })
                    .sort({ order: -1 })
                    .session(session);
                const order = lastLesson ? lastLesson.order + 1 : 1;
                // Create lesson with resourceId
                const createdLessons = await lesson_1.Lesson.create([
                    {
                        title: lessonData.title,
                        chapterId: lessonData.chapterId,
                        courseId: lessonData.courseId,
                        resourceId: createdResources[0]._id,
                        contentType: lessonData.contentType,
                        order: order,
                        preview: lessonData.preview || false,
                        isPublished: lessonData.isPublished || false,
                        duration: lessonData.duration
                    }
                ], { session, ordered: true });
                // Add lesson ID to chapter's lessonIds array
                await chapter_1.Chapter.findByIdAndUpdate(lessonData.chapterId, { $push: { lessonIds: createdLessons[0]._id } }, { session });
                return createdLessons[0];
            });
            return result;
        }
        catch (error) {
            throw new errors_1.DatabaseError(error instanceof Error ? error.message : 'Failed to create lesson', errors_1.ErrorCodes.DB_OPERATION_FAILED);
        }
        finally {
            await session.endSession();
        }
    }
    /**
     * Get lesson by ID
     */
    static async getLessonById(lessonId, includeQuestions = false) {
        const lesson = await lesson_1.Lesson.aggregate([
            { $match: { _id: new mongoose_1.default.Types.ObjectId(lessonId) } },
            {
                $lookup: {
                    from: 'chapters',
                    localField: 'chapterId',
                    foreignField: '_id',
                    as: 'chapter',
                    pipeline: [{ $project: { title: 1, courseId: 1 } }]
                }
            },
            {
                $lookup: {
                    from: 'courses',
                    localField: 'courseId',
                    foreignField: '_id',
                    as: 'course',
                    pipeline: [{ $project: { title: 1, slug: 1 } }]
                }
            },
            { $unwind: '$chapter' },
            { $unwind: '$course' }
        ]);
        if (!lesson || lesson.length === 0) {
            throw new errors_1.NotFoundError('Lesson not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
        }
        const lessonData = lesson[0];
        // Get resource data based on content type with direct logic
        let resource = null;
        switch (lessonData.contentType) {
            case 'video': {
                resource = (await lesson_1.Video.findById(lessonData.resourceId).lean());
                break;
            }
            case 'article': {
                resource = (await lesson_1.Article.findById(lessonData.resourceId).lean());
                break;
            }
            case 'quiz': {
                // Get quiz resource and its questions count
                const quizResource = await lesson_1.Quiz.findById(lessonData.resourceId).lean();
                if (quizResource) {
                    // Get total questions count for this quiz
                    const totalQuestions = await quiz_question_1.QuizQuestion.countDocuments({ quizId: lessonData.resourceId });
                    // Optionally include full questions
                    let questions = undefined;
                    if (includeQuestions) {
                        questions = await quiz_question_1.QuizQuestion.find({ quizId: lessonData.resourceId })
                            .select('question explanation type options correctAnswers point')
                            .lean();
                    }
                    // Add totalQuestions and optionally questions to the quiz resource
                    resource = {
                        ...quizResource,
                        totalQuestions,
                        ...(questions && { questions })
                    };
                }
                break;
            }
            default:
                throw new errors_1.ValidationError('Invalid content type', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
        return {
            ...lessonData,
            resource
        };
    }
    /**
     * Update lesson (supports resource data updates)
     */
    static async updateLesson(lessonId, updateData) {
        // If resource is provided, use transaction
        if (updateData.resource) {
            const session = await mongoose_1.default.startSession();
            try {
                const result = await session.withTransaction(async () => {
                    const lesson = await lesson_1.Lesson.findById(lessonId).session(session);
                    if (!lesson) {
                        throw new errors_1.NotFoundError('Lesson not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
                    }
                    if (updateData.resource) {
                        await this.updateResourceByType(lesson.contentType, lesson.resourceId, updateData.resource, session, updateData.duration);
                    }
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    const { resource: _, ...lessonUpdateData } = updateData;
                    // If chapterId is being updated, validate the new chapter exists
                    if (lessonUpdateData.chapterId && lessonUpdateData.chapterId !== lesson.chapterId.toString()) {
                        const chapter = await chapter_1.Chapter.findById(lessonUpdateData.chapterId).session(session);
                        if (!chapter) {
                            throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
                        }
                        // Remove lesson from old chapter's lessonIds array
                        await chapter_1.Chapter.findByIdAndUpdate(lesson.chapterId, { $pull: { lessonIds: lessonId } }, { session });
                        // Add lesson to new chapter's lessonIds array
                        await chapter_1.Chapter.findByIdAndUpdate(lessonUpdateData.chapterId, { $push: { lessonIds: lessonId } }, { session });
                        // If moving to a different chapter, set order to last
                        const lastLessonInNewChapter = await lesson_1.Lesson.findOne({ chapterId: lessonUpdateData.chapterId })
                            .sort({ order: -1 })
                            .session(session);
                        lessonUpdateData.order = lastLessonInNewChapter ? lastLessonInNewChapter.order + 1 : 1;
                    }
                    const updatedLesson = await lesson_1.Lesson.findByIdAndUpdate(lessonId, lessonUpdateData, { new: true, session });
                    if (!updatedLesson) {
                        throw new errors_1.DatabaseError('Failed to update lesson', errors_1.ErrorCodes.DB_OPERATION_FAILED);
                    }
                    return updatedLesson;
                });
                return result;
            }
            catch (error) {
                throw new errors_1.DatabaseError(error instanceof Error ? error.message : 'Failed to update lesson', errors_1.ErrorCodes.DB_OPERATION_FAILED);
            }
            finally {
                await session.endSession();
            }
        }
        throw new errors_1.ValidationError('resource is required for lesson updates', errors_1.ErrorCodes.REQUIRED_FIELD_MISSING);
    }
    /**
     * Delete lesson (supports cascade delete of resources)
     */
    static async deleteLesson(lessonId) {
        const session = await mongoose_1.default.startSession();
        try {
            await session.withTransaction(async () => {
                const lesson = await lesson_1.Lesson.findById(lessonId).session(session);
                if (!lesson) {
                    throw new errors_1.NotFoundError('Lesson not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
                }
                const chapterId = lesson.chapterId;
                const order = lesson.order;
                // Delete associated resource and related data
                await this.deleteResourceByType(lesson.contentType, lesson.resourceId, session);
                // Remove lesson ID from chapter's lessonIds array
                await chapter_1.Chapter.findByIdAndUpdate(chapterId, { $pull: { lessonIds: lessonId } }, { session });
                // Delete lesson
                await lesson_1.Lesson.findByIdAndDelete(lessonId, { session });
                // Update orders of remaining lessons in the same chapter
                await lesson_1.Lesson.updateMany({ chapterId, order: { $gt: order } }, { $inc: { order: -1 } }, { session });
            });
        }
        catch (error) {
            throw new errors_1.DatabaseError(error instanceof Error ? error.message : 'Failed to delete lesson', errors_1.ErrorCodes.DB_OPERATION_FAILED);
        }
        finally {
            await session.endSession();
        }
    }
    /**
     * Reorder lessons
     */
    static async reorderLessons(reorderData) {
        const { lessons } = reorderData;
        // Update each lesson's order
        const updatePromises = lessons.map(({ id, order }) => lesson_1.Lesson.findByIdAndUpdate(id, { order }, { new: true }));
        const updatedLessons = await Promise.all(updatePromises);
        // Filter out null values and return
        return updatedLessons.filter((lesson) => lesson !== null);
    }
    /**
     * Get lessons for a specific course with pagination
     */
    static async getCourseLessons(courseId, options = {}) {
        const { page = 1, limit = 10, search, preview, isPublished, sortBy = 'order', sortOrder = 'asc' } = options;
        const skip = (page - 1) * limit;
        const filter = { courseId };
        if (search)
            filter.$or = [{ title: { $regex: search, $options: 'i' } }];
        if (preview !== undefined)
            filter.preview = preview === 'true';
        if (isPublished !== undefined)
            filter.isPublished = isPublished;
        const sortOption = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
        const [lessons, total] = await Promise.all([
            lesson_1.Lesson.find(filter).populate('chapterId', 'title courseId').sort(sortOption).skip(skip).limit(limit),
            lesson_1.Lesson.countDocuments(filter)
        ]);
        return {
            lessons,
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                hasNextPage: page < Math.ceil(total / limit),
                hasPrevPage: page > 1
            }
        };
    }
    /**
     * Get lessons for a specific chapter with resource data
     */
    static async getLessons(chapterId) {
        // Validate chapter exists
        const chapter = await chapter_1.Chapter.findById(chapterId);
        if (!chapter) {
            throw new errors_1.NotFoundError('Chapter not found', errors_1.ErrorCodes.CHAPTER_NOT_FOUND);
        }
        const lessons = await lesson_1.Lesson.find({ chapterId }).sort({ order: 1 });
        // Get resource data for each lesson (only description)
        const lessonsWithResources = await Promise.all(lessons.map(async (lesson) => {
            const selectFields = ['description'];
            const resource = await this.getResourceByType(lesson.contentType, lesson.resourceId, selectFields);
            return {
                ...lesson.toObject(),
                resource
            };
        }));
        return lessonsWithResources;
    }
    /**
     * Helper method to get resource by type
     */
    static async getResourceByType(contentType, resourceId, selectFields) {
        // Convert array to object if needed
        const selectQuery = Array.isArray(selectFields) ? getSelectData(selectFields) : selectFields;
        switch (contentType) {
            case 'video': {
                const query = lesson_1.Video.findById(resourceId);
                const result = selectQuery ? await query.select(selectQuery).lean() : await query.lean();
                return result;
            }
            case 'article': {
                const query = lesson_1.Article.findById(resourceId);
                const result = selectQuery ? await query.select(selectQuery).lean() : await query.lean();
                return result;
            }
            case 'quiz': {
                const query = lesson_1.Quiz.findById(resourceId);
                const result = selectQuery ? await query.select(selectQuery).lean() : await query.lean();
                return result;
            }
            default:
                throw new errors_1.ValidationError('Invalid content type', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
    }
    /**
     * Helper method to update resource by type
     */
    static async updateResourceByType(contentType, resourceId, resource, session, lessonDuration) {
        switch (contentType) {
            case 'video': {
                const videoData = resource;
                return await lesson_1.Video.findByIdAndUpdate(resourceId, videoData, { session, new: true });
            }
            case 'article': {
                const articleData = resource;
                return await lesson_1.Article.findByIdAndUpdate(resourceId, articleData, { session, new: true });
            }
            case 'quiz': {
                const quizData = resource;
                // Handle questions separately if provided
                if (quizData.questions) {
                    // Update quiz questions - first delete existing ones, then create new ones
                    await quiz_question_1.QuizQuestion.deleteMany({ quizId: resourceId }, { session });
                    const questionsWithQuizId = quizData.questions.map((question) => ({
                        ...question,
                        quizId: resourceId.toString()
                    }));
                    // Create questions directly using QuizQuestion model
                    await quiz_question_1.QuizQuestion.insertMany(questionsWithQuizId, { session });
                }
                // Update quiz data (excluding questions)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { questions, ...quizUpdateData } = quizData;
                // Add duration from lesson if provided, otherwise keep existing duration
                const finalUpdateData = {
                    ...quizUpdateData,
                    ...(lessonDuration !== undefined && { duration: lessonDuration })
                };
                const updatedQuiz = await lesson_1.Quiz.findByIdAndUpdate(resourceId, finalUpdateData, { session, new: true });
                return updatedQuiz;
            }
            default:
                throw new errors_1.ValidationError('Invalid content type', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
    }
    /**
     * Helper method to delete resource by type
     */
    static async deleteResourceByType(contentType, resourceId, session) {
        switch (contentType) {
            case 'video': {
                const deletedVideo = await lesson_1.Video.findByIdAndDelete(resourceId, { session });
                if (!deletedVideo) {
                    throw new errors_1.NotFoundError('Video resource not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
                }
                break;
            }
            case 'article': {
                const deletedArticle = await lesson_1.Article.findByIdAndDelete(resourceId, { session });
                if (!deletedArticle) {
                    throw new errors_1.NotFoundError('Article resource not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
                }
                break;
            }
            case 'quiz': {
                // Delete quiz questions first, then quiz
                await quiz_question_1.QuizQuestion.deleteMany({ quizId: resourceId }, { session });
                const deletedQuiz = await lesson_1.Quiz.findByIdAndDelete(resourceId, { session });
                if (!deletedQuiz) {
                    throw new errors_1.NotFoundError('Quiz resource not found', errors_1.ErrorCodes.LESSON_NOT_FOUND);
                }
                break;
            }
            default:
                throw new errors_1.ValidationError('Invalid content type', errors_1.ErrorCodes.INVALID_INPUT_FORMAT);
        }
    }
}
exports.LessonService = LessonService;
