"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderItemSchema = exports.orderSchema = exports.Order = void 0;
const mongoose_1 = require("mongoose");
const enums_1 = require("../enums");
const orderItemSchema = new mongoose_1.Schema({
    courseId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Course', required: true },
    title: { type: String, required: true }, // snapshot title at purchase
    price: { type: Number, required: true }, // original price
    oldPrice: { type: Number }, // old price for reference
    thumbnail: { type: String } // snapshot thumbnail
});
exports.orderItemSchema = orderItemSchema;
const orderSchema = new mongoose_1.Schema({
    code: { type: String, required: true, unique: true },
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    // Courses purchased
    items: [orderItemSchema],
    couponCode: { type: String },
    // Totals
    subTotal: { type: Number, required: true }, // sum of item prices before discounts
    totalDiscount: { type: Number, default: 0 }, // all discounts combined
    totalAmount: { type: Number, required: true }, // final amount paid
    // Payment info
    paymentMethod: { type: String, enum: Object.values(enums_1.PaymentMethod), required: true },
    status: { type: String, enum: Object.values(enums_1.OrderStatus), default: enums_1.OrderStatus.PENDING }
}, {
    timestamps: true // This will add createdAt and updatedAt fields
});
exports.orderSchema = orderSchema;
// Create and export the Order model
const Order = (0, mongoose_1.model)('Order', orderSchema);
exports.Order = Order;
exports.default = Order;
