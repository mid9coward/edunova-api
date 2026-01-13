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
exports.Course = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../enums");
const courseSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    image: {
        type: String
    },
    description: {
        type: String
    },
    excerpt: {
        type: String,
        trim: true,
        maxlength: 500
    },
    introUrl: {
        type: String
    },
    price: {
        type: Number,
        min: 0
    },
    oldPrice: {
        type: Number,
        min: 0
    },
    originalPrice: {
        type: Number,
        min: 0
    },
    isFree: {
        type: Boolean,
        default: false
    },
    status: {
        type: String,
        enum: Object.values(enums_1.CourseStatus),
        default: enums_1.CourseStatus.DRAFT
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    chapterIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Chapter'
        }
    ],
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    view: {
        type: Number,
        default: 0
    },
    sold: {
        type: Number,
        default: 0
    },
    level: {
        type: String,
        enum: Object.values(enums_1.CourseLevel),
        required: true
    },
    info: {
        requirements: [
            {
                type: String,
                trim: true
            }
        ],
        benefits: [
            {
                type: String,
                trim: true
            }
        ],
        techniques: [
            {
                type: String,
                trim: true
            }
        ],
        documents: [
            {
                type: String,
                trim: true
            }
        ],
        qa: [
            {
                question: {
                    type: String,
                    trim: true
                },
                answer: {
                    type: String,
                    trim: true
                }
            }
        ]
    }
}, {
    timestamps: true
});
// Indexes for better performance
courseSchema.index({ authorId: 1 });
courseSchema.index({ categoryId: 1 });
courseSchema.index({ status: 1 });
courseSchema.index({ level: 1 });
// Note: slug unique index is already defined in schema field definition
courseSchema.index({ createdAt: -1 });
courseSchema.index({ view: -1 });
courseSchema.index({ sold: -1 });
courseSchema.index({ title: 'text', description: 'text', excerpt: 'text' });
exports.Course = mongoose_1.default.model('Course', courseSchema);
