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
exports.QuizAttempt = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../enums");
/**
 * Quiz Attempt Answer Schema
 */
const quizAttemptAnswerSchema = new mongoose_1.Schema({
    questionId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'QuizQuestion',
        required: true
    },
    selectedOptionIndexes: [
        {
            type: Number,
            required: true
        }
    ],
    isCorrect: {
        type: Boolean,
        required: true,
        default: false
    }
}, { _id: false });
/**
 * Quiz Attempt Schema
 */
const quizAttemptSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    quizId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Quiz',
        required: true
    },
    startedAt: {
        type: Date,
        required: true,
        default: Date.now
    },
    finishedAt: {
        type: Date
    },
    status: {
        type: String,
        enum: Object.values(enums_1.QuizAttemptStatus),
        default: enums_1.QuizAttemptStatus.IN_PROGRESS,
        required: true
    },
    score: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    answers: [quizAttemptAnswerSchema]
}, {
    timestamps: true
});
// Indexes for better query performance
quizAttemptSchema.index({ userId: 1, quizId: 1 });
quizAttemptSchema.index({ userId: 1, status: 1 });
quizAttemptSchema.index({ quizId: 1, status: 1 });
quizAttemptSchema.index({ startedAt: -1 });
quizAttemptSchema.index({ finishedAt: -1 });
exports.QuizAttempt = mongoose_1.default.model('QuizAttempt', quizAttemptSchema);
