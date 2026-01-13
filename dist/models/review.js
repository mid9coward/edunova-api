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
exports.Review = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../enums");
const reviewSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    star: {
        type: Number,
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    status: {
        type: String,
        enum: Object.values(enums_1.ReviewStatus),
        default: enums_1.ReviewStatus.ACTIVE
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});
// Compound index to ensure one review per user per course
reviewSchema.index({ userId: 1, courseId: 1 });
// Additional indexes for efficient queries
reviewSchema.index({ courseId: 1, status: 1 });
reviewSchema.index({ userId: 1, status: 1 });
reviewSchema.index({ star: 1 });
reviewSchema.index({ createdAt: -1 });
// Virtual for populating user details
reviewSchema.virtual('user', {
    ref: 'User',
    localField: 'userId',
    foreignField: '_id',
    justOne: true
});
// Static method to get average rating for a course
reviewSchema.statics.getAverageRating = async function (courseId) {
    const result = await this.aggregate([
        {
            $match: {
                courseId: new mongoose_1.default.Types.ObjectId(courseId),
                status: enums_1.ReviewStatus.ACTIVE
            }
        },
        {
            $group: {
                _id: '$courseId',
                averageRating: { $avg: '$star' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    return result.length > 0 ? result[0] : { averageRating: 0, totalReviews: 0 };
};
// Static method to get rating distribution for a course
reviewSchema.statics.getRatingDistribution = async function (courseId) {
    const result = await this.aggregate([
        {
            $match: {
                courseId: new mongoose_1.default.Types.ObjectId(courseId),
                status: enums_1.ReviewStatus.ACTIVE
            }
        },
        {
            $group: {
                _id: '$star',
                count: { $sum: 1 }
            }
        },
        {
            $sort: { _id: -1 }
        }
    ]);
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    result.forEach((item) => {
        distribution[item._id] = item.count;
    });
    return distribution;
};
exports.Review = mongoose_1.default.model('Review', reviewSchema);
