"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CourseCompletionService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const course_completion_1 = require("../models/course-completion");
const lesson_1 = require("../models/lesson");
const track_1 = require("../models/track");
class CourseCompletionService {
    static async syncCompletionForUserCourse(userId, courseId) {
        const courseObjectId = new mongoose_1.default.Types.ObjectId(courseId);
        const publishedLessons = await lesson_1.Lesson.find({ courseId: courseObjectId, isPublished: true })
            .select('_id')
            .lean();
        const totalLessons = publishedLessons.length;
        const publishedLessonIds = publishedLessons.map((lesson) => lesson._id);
        if (totalLessons === 0) {
            await course_completion_1.CourseCompletion.deleteOne({ userId, courseId });
            return {
                completed: false,
                completedAt: null,
                totalLessons: 0,
                completedLessons: 0,
                progressPercent: 0
            };
        }
        const completedLessons = await track_1.Track.countDocuments({
            userId,
            courseId,
            lessonId: { $in: publishedLessonIds }
        });
        const progressPercent = Math.round((completedLessons / totalLessons) * 100);
        if (completedLessons === totalLessons) {
            const existingCompletion = await course_completion_1.CourseCompletion.findOne({ userId, courseId });
            let completedAt = existingCompletion?.completedAt;
            if (!completedAt) {
                const latestTrack = await track_1.Track.findOne({
                    userId,
                    courseId,
                    lessonId: { $in: publishedLessonIds }
                })
                    .sort({ createdAt: -1 })
                    .select('createdAt')
                    .lean();
                completedAt = latestTrack?.createdAt ?? new Date();
            }
            const completion = await course_completion_1.CourseCompletion.findOneAndUpdate({ userId, courseId }, {
                $setOnInsert: { completedAt },
                $set: {
                    totalLessons,
                    completedLessons,
                    progressPercent
                }
            }, { upsert: true, new: true });
            return {
                completed: true,
                completedAt: completion?.completedAt ?? null,
                totalLessons,
                completedLessons,
                progressPercent
            };
        }
        await course_completion_1.CourseCompletion.deleteOne({ userId, courseId });
        return {
            completed: false,
            completedAt: null,
            totalLessons,
            completedLessons,
            progressPercent
        };
    }
    static async getCompletionStatus(userId, courseId) {
        return this.syncCompletionForUserCourse(userId, courseId);
    }
}
exports.CourseCompletionService = CourseCompletionService;
