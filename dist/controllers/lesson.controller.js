"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LessonController = void 0;
const services_1 = require("../services");
const success_1 = require("../utils/success");
class LessonController {
    /**
     * Create a new lesson with resource
     */
    static async createLesson(req, res) {
        const lessonData = req.body;
        const result = await services_1.LessonService.createLesson(lessonData);
        success_1.sendSuccess.created(res, 'Lesson created successfully', result);
    }
    /**
     * Get lessons for a specific chapter
     */
    static async getLessons(req, res) {
        const { chapterId } = req.query;
        const result = await services_1.LessonService.getLessons(chapterId);
        success_1.sendSuccess.ok(res, 'Lessons retrieved successfully', result);
    }
    /**
     * Get lesson by ID with optional resource population
     */
    static async getLessonById(req, res) {
        const { id } = req.params;
        const { includeQuestions } = req.query;
        const lesson = await services_1.LessonService.getLessonById(id, includeQuestions === 'true');
        success_1.sendSuccess.ok(res, 'Lesson retrieved successfully', lesson);
    }
    /**
     * Update lesson (supports resource data updates)
     */
    static async updateLesson(req, res) {
        const { id } = req.params;
        const updateData = req.body;
        const lesson = await services_1.LessonService.updateLesson(id, updateData);
        success_1.sendSuccess.ok(res, 'Lesson updated successfully', lesson);
    }
    /**
     * Delete lesson (supports cascade delete of resources)
     */
    static async deleteLesson(req, res) {
        const { id } = req.params;
        await services_1.LessonService.deleteLesson(id);
        success_1.sendSuccess.ok(res, 'Lesson deleted successfully');
    }
    /**
     * Get lessons for a specific chapter
     */
    static async getChapterLessons(req, res) {
        const { chapterId } = req.params;
        const result = await services_1.LessonService.getLessons(chapterId);
        success_1.sendSuccess.ok(res, 'Chapter lessons retrieved successfully', { lessons: result });
    }
    /**
     * Get lessons for a specific course
     */
    static async getCourseLessons(req, res) {
        const { courseId } = req.params;
        const query = req.query;
        const result = await services_1.LessonService.getCourseLessons(courseId, query);
        success_1.sendSuccess.ok(res, 'Course lessons retrieved successfully', result);
    }
    /**
     * Reorder lessons within a chapter
     */
    static async reorderLessons(req, res) {
        const reorderData = req.body;
        const lessons = await services_1.LessonService.reorderLessons(reorderData);
        success_1.sendSuccess.ok(res, 'Lessons reordered successfully', { lessons });
    }
}
exports.LessonController = LessonController;
