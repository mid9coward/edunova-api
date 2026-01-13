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
exports.Cart = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const cartItemSchema = new mongoose_1.Schema({
    courseId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    title: {
        type: String,
        required: true,
        trim: true
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    oldPrice: {
        type: Number,
        min: 0
    },
    thumbnail: {
        type: String,
        trim: true
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
}, {
    _id: false // Disable auto-generated _id for subdocuments
});
const cartSchema = new mongoose_1.Schema({
    userId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true // One cart per user
    },
    items: [cartItemSchema],
    totalPrice: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
}, {
    timestamps: true
});
// Index for efficient lookups
cartSchema.index({ 'items.courseId': 1 });
exports.Cart = mongoose_1.default.model('Cart', cartSchema);
