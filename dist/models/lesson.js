"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodingExercise = exports.Quiz = exports.Article = exports.Video = exports.Lesson = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../enums");
/**
 * Lesson Schema
 */
const lessonSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    chapterId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chapter',
        required: true
    },
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    resourceId: {
        type: mongoose_1.Schema.Types.ObjectId,
        required: true
    },
    contentType: {
        type: String,
        enum: Object.values(enums_1.LessonContentType),
        required: true
    },
    order: {
        type: Number,
        required: true
    },
    preview: {
        type: Boolean,
        default: false
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    duration: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});
/**
 * Video Resource Schema
 */
const videoSchema = new mongoose_1.Schema({
    url: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});
/**
 * Article Resource Schema
 */
const articleSchema = new mongoose_1.Schema({
    description: {
        type: String,
        required: true,
        trim: true
    }
}, {
    timestamps: true
});
/**
 * Quiz Resource Schema
 */
const quizSchema = new mongoose_1.Schema({
    totalAttemptsAllowed: {
        type: Number,
        min: 1,
        max: 10
    },
    passingScorePercentage: {
        type: Number,
        min: 1,
        max: 100
    },
    duration: {
        type: Number,
        min: 0,
        default: 0 // 0 means unlimited time
    },
    description: {
        type: String,
        trim: true
    }
}, {
    timestamps: true
});
/**
 * Coding Exercise Resource Schema
 */
const codingTestCaseSchema = new mongoose_1.Schema({
    input: {
        type: String,
        default: ''
    },
    expectedOutput: {
        type: String,
        required: true
    },
    isHidden: {
        type: Boolean,
        default: false
    }
}, {});
const codingConstraintsSchema = new mongoose_1.Schema({
    timeLimit: {
        type: Number,
        default: 2,
        min: 0
    },
    memoryLimit: {
        type: Number,
        default: 128,
        min: 0
    }
}, {
    _id: false
});
const codingExerciseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    language: {
        type: String,
        required: true,
        trim: true
    },
    version: {
        type: String,
        required: true,
        trim: true
    },
    problemStatement: {
        type: String,
        required: true
    },
    starterCode: {
        type: String,
        required: true
    },
    solutionCode: {
        type: String,
        required: true,
        select: false
    },
    testCases: {
        type: [codingTestCaseSchema],
        required: true,
        validate: {
            validator: (value) => Array.isArray(value) && value.length > 0,
            message: 'At least one test case is required'
        }
    },
    constraints: {
        type: codingConstraintsSchema,
        default: () => ({})
    }
}, {
    timestamps: true
});
// Lesson Indexes
lessonSchema.index({ chapterId: 1, order: 1 });
lessonSchema.index({ courseId: 1, order: 1 });
lessonSchema.index({ courseId: 1, isPublished: 1 });
lessonSchema.index({ chapterId: 1, isPublished: 1 });
// Resource Indexes
videoSchema.index({ createdAt: -1 });
articleSchema.index({ createdAt: -1 });
quizSchema.index({ createdAt: -1 });
codingExerciseSchema.index({ createdAt: -1 });
// Model Exports
exports.Lesson = mongoose_1.default.model('Lesson', lessonSchema);
exports.Video = mongoose_1.default.model('Video', videoSchema);
exports.Article = mongoose_1.default.model('Article', articleSchema);
exports.Quiz = mongoose_1.default.model('Quiz', quizSchema);
exports.CodingExercise = mongoose_1.default.model('CodingExercise', codingExerciseSchema);
