"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChapterController = void 0;
const services_1 = require("../services");
const success_1 = require("../utils/success");
class ChapterController {
    /**
     * Create a new chapter
     */
    static async createChapter(req, res) {
        const chapterData = req.body;
        const chapter = await services_1.ChapterService.createChapter(chapterData);
        success_1.sendSuccess.created(res, 'Chapter created successfully', chapter);
    }
    /**
     * Get chapters for a specific course
     */
    static async getChapters(req, res) {
        const query = req.query;
        const chapters = await services_1.ChapterService.getChapters(query);
        success_1.sendSuccess.ok(res, 'Chapters retrieved successfully', chapters);
    }
    /**
     * Get chapter by ID
     */
    static async getChapterById(req, res) {
        const { id } = req.params;
        const chapter = await services_1.ChapterService.getChapterById(id);
        success_1.sendSuccess.ok(res, 'Chapter retrieved successfully', { chapter });
    }
    /**
     * Update chapter
     */
    static async updateChapter(req, res) {
        const { id } = req.params;
        const updateData = req.body;
        const chapter = await services_1.ChapterService.updateChapter(id, updateData);
        success_1.sendSuccess.ok(res, 'Chapter updated successfully', { chapter });
    }
    /**
     * Delete chapter
     */
    static async deleteChapter(req, res) {
        const { id } = req.params;
        await services_1.ChapterService.deleteChapter(id);
        success_1.sendSuccess.ok(res, 'Chapter deleted successfully');
    }
    /**
     * Get chapters for a specific course
     */
    static async getCourseChapters(req, res) {
        const { courseId } = req.params;
        const chapters = await services_1.ChapterService.getPublicChaptersForCourse(courseId);
        success_1.sendSuccess.ok(res, 'Course chapters retrieved successfully', { chapters });
    }
    /**
     * Reorder chapters within a course
     */
    static async reorderChapters(req, res) {
        const reorderData = req.body;
        const chapters = await services_1.ChapterService.reorderChapters(reorderData);
        success_1.sendSuccess.ok(res, 'Chapters reordered successfully', { chapters });
    }
    /**
     * Add lesson to chapter
     */
    static async addLessonToChapter(req, res) {
        const { chapterId, lessonId } = req.params;
        const chapter = await services_1.ChapterService.addLessonToChapter(chapterId, lessonId);
        success_1.sendSuccess.ok(res, 'Lesson added to chapter successfully', { chapter });
    }
    /**
     * Remove lesson from chapter
     */
    static async removeLessonFromChapter(req, res) {
        const { chapterId, lessonId } = req.params;
        const chapter = await services_1.ChapterService.removeLessonFromChapter(chapterId, lessonId);
        success_1.sendSuccess.ok(res, 'Lesson removed from chapter successfully', { chapter });
    }
}
exports.ChapterController = ChapterController;
