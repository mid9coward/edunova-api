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
exports.Coupon = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const enums_1 = require("../enums");
const couponSchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        uppercase: true
    },
    // Discount type: percentage or fixed amount
    discountType: {
        type: String,
        enum: Object.values(enums_1.CouponDiscountType),
        required: true
    },
    discountValue: {
        type: Number,
        required: true,
        min: 0
    },
    courseIds: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Course'
        }
    ],
    // Eligibility rules
    minPurchaseAmount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Usage control
    maxUses: {
        type: Number,
        min: 1
    },
    usedCount: {
        type: Number,
        default: 0,
        min: 0
    },
    // Time validity
    startDate: {
        type: Date,
        default: Date.now
    },
    endDate: {
        type: Date
    },
    // Status
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});
// Indexes for better performance
couponSchema.index({ isActive: 1 });
couponSchema.index({ startDate: 1, endDate: 1 });
couponSchema.index({ discountType: 1 });
exports.Coupon = mongoose_1.default.model('Coupon', couponSchema);
