"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Blog = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../enums");
const blogSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        maxlength: 200
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: 200
    },
    content: {
        type: String,
        required: true
    },
    excerpt: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    thumbnail: {
        type: String,
        required: false,
        trim: true
    },
    authorId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: Object.values(enums_1.BlogStatus),
        default: enums_1.BlogStatus.DRAFT
    },
    publishedAt: {
        type: Date
    },
    categoryId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Category'
    }
}, {
    timestamps: true
});
// Indexes
blogSchema.index({ authorId: 1 });
blogSchema.index({ status: 1 });
blogSchema.index({ publishedAt: -1 });
blogSchema.index({ categoryId: 1 });
blogSchema.index({ title: 'text', content: 'text' });
exports.Blog = (0, mongoose_1.model)('Blog', blogSchema);
