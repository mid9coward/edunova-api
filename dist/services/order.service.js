"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrderService = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const order_1 = require("../models/order");
const course_1 = require("../models/course");
const user_1 = require("../models/user");
const cart_1 = require("../models/cart");
const coupon_1 = require("../models/coupon");
const errors_1 = require("../utils/errors");
const enums_1 = require("../enums");
class OrderService {
    /**
     * Generate unique order code using random approach
     */
    static async generateOrderCode() {
        // Simple approach: ORD + timestamp(last 8 digits) + random 4 digits
        const timestamp = Date.now().toString().slice(-8);
        const randomNum = Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0');
        const code = `ORD${timestamp}${randomNum}`;
        // Double check uniqueness (very unlikely but safe)
        const existingOrder = await order_1.Order.findOne({ code });
        if (existingOrder) {
            return this.generateOrderCode();
        }
        return code;
    }
    /**
     * Validate and prepare order items from course IDs
     */
    static async validateAndPrepareOrderItems(courseIds) {
        // Check if all courses exist and are available
        const courses = await course_1.Course.find({
            _id: { $in: courseIds },
            status: 'published' // Only allow published courses
        }).select('_id title price oldPrice image status');
        if (courses.length !== courseIds.length) {
            const foundIds = courses.map((c) => c._id.toString());
            const missingIds = courseIds.filter((id) => !foundIds.includes(id));
            throw new errors_1.AppError(`Courses not found or not available: ${missingIds.join(', ')}`, 400);
        }
        // Prepare order items
        const orderItems = courses.map((course) => ({
            courseId: course._id,
            title: course.title,
            price: course.price,
            oldPrice: course.oldPrice,
            thumbnail: course.image
        }));
        return { orderItems, courses };
    }
    /**
     * Calculate order totals with coupon
     */
    static async calculateOrderTotals(orderItems, couponCode) {
        // Calculate subtotal
        const subTotal = orderItems.reduce((total, item) => total + item.price, 0);
        let totalDiscount = 0;
        let validatedCouponCode = undefined;
        // Apply coupon if provided
        if (couponCode) {
            const coupon = await coupon_1.Coupon.findOne({
                code: couponCode.toUpperCase(),
                isActive: true,
                startDate: { $lte: new Date() },
                $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }]
            });
            if (!coupon) {
                throw new errors_1.AppError('Invalid or expired coupon code', 400);
            }
            // Check if coupon is applicable
            if (coupon.courseIds.length > 0) {
                const orderCourseIds = orderItems.map((item) => item.courseId.toString());
                const hasApplicableCourses = coupon.courseIds.some((courseId) => orderCourseIds.includes(courseId.toString()));
                if (!hasApplicableCourses) {
                    throw new errors_1.AppError('Coupon is not applicable to any selected courses', 400);
                }
            }
            // Calculate discount
            if (coupon.discountType === 'percent') {
                totalDiscount = Math.round((subTotal * coupon.discountValue) / 100);
            }
            else {
                totalDiscount = Math.min(coupon.discountValue, subTotal);
            }
            validatedCouponCode = coupon.code;
        }
        const totalAmount = Math.max(0, subTotal - totalDiscount);
        return {
            subTotal,
            totalDiscount,
            totalAmount,
            validatedCouponCode
        };
    }
    /**
     * Create a new order from course IDs
     */
    static async createOrder(userId, orderData) {
        // Validate user exists
        const user = await user_1.User.findById(userId);
        if (!user) {
            throw new errors_1.AppError('User not found', 404);
        }
        // Validate and prepare order items
        const { orderItems } = await this.validateAndPrepareOrderItems(orderData.courseIds);
        // Calculate totals with coupon
        const { subTotal, totalDiscount, totalAmount, validatedCouponCode } = await this.calculateOrderTotals(orderItems, orderData.couponCode);
        // Generate unique order code
        const code = await this.generateOrderCode();
        // Create order
        const order = new order_1.Order({
            code,
            userId: new mongoose_1.default.Types.ObjectId(userId),
            items: orderItems,
            couponCode: validatedCouponCode,
            subTotal,
            totalDiscount,
            totalAmount,
            paymentMethod: orderData.paymentMethod,
            status: enums_1.OrderStatus.PENDING
        });
        await order.save();
        // Remove ordered items from cart after successful order creation
        const orderedCourseIds = orderItems.map((item) => item.courseId.toString());
        // Get current cart
        const cart = await cart_1.Cart.findOne({ userId });
        if (cart && cart.items.length > 0) {
            // Filter out items that were ordered
            const remainingItems = cart.items.filter((cartItem) => !orderedCourseIds.includes(cartItem.courseId.toString()));
            // Recalculate total price for remaining items
            const newTotalPrice = remainingItems.reduce((total, item) => total + item.price, 0);
            // Update cart with remaining items
            await cart_1.Cart.findOneAndUpdate({ userId }, {
                items: remainingItems,
                totalPrice: newTotalPrice
            });
        }
        return order;
    }
    /**
     * Get orders with pagination and filtering
     */
    static async getOrders(query) {
        const { page = 1, limit = 10, status, paymentMethod, sortBy = 'createdAt', sortOrder = 'desc', search } = query;
        const pageNum = +page;
        const limitNum = +limit;
        // Build filter
        const filter = {};
        if (status) {
            filter.status = status;
        }
        if (paymentMethod) {
            filter.paymentMethod = paymentMethod;
        }
        if (search) {
            filter.$or = [{ code: { $regex: search, $options: 'i' } }, { 'items.title': { $regex: search, $options: 'i' } }];
        }
        // Build sort
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        // Calculate pagination
        const skip = (pageNum - 1) * limitNum;
        // Execute query with aggregation for user details
        const orders = await order_1.Order.aggregate([
            { $match: filter },
            {
                $lookup: {
                    from: 'users',
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user',
                    pipeline: [{ $project: { username: 1, email: 1, avatar: 1 } }]
                }
            },
            { $unwind: '$user' },
            { $sort: sort },
            { $skip: skip },
            { $limit: limitNum }
        ]);
        // Get total count
        const totalOrders = await order_1.Order.countDocuments(filter);
        const totalPages = Math.ceil(totalOrders / limitNum);
        return {
            orders,
            pagination: {
                total: totalOrders,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get user's orders
     */
    static async getUserOrders(userId, query) {
        const filter = { userId: new mongoose_1.default.Types.ObjectId(userId) };
        if (query.status) {
            filter.status = query.status;
        }
        const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc' } = query;
        const pageNum = +page;
        const limitNum = +limit;
        const sort = {};
        sort[sortBy] = sortOrder === 'asc' ? 1 : -1;
        const skip = (pageNum - 1) * limitNum;
        const orders = await order_1.Order.find(filter).sort(sort).skip(skip).limit(limitNum);
        const total = await order_1.Order.countDocuments(filter);
        const totalPages = Math.ceil(total / limitNum);
        return {
            orders,
            pagination: {
                total,
                page: pageNum,
                limit: limitNum,
                totalPages,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1
            }
        };
    }
    /**
     * Get order by ID
     */
    static async getOrderById(orderId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            throw new errors_1.AppError('Invalid order ID', 400);
        }
        const order = await order_1.Order.findById(orderId).populate({
            path: 'userId',
            select: 'username email'
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        return order;
    }
    /**
     * Get order by ID with user details (for invoice generation)
     */
    static async getOrderWithUserDetails(orderId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            throw new errors_1.AppError('Invalid order ID', 400);
        }
        const order = await order_1.Order.findById(orderId).populate({
            path: 'userId',
            select: 'username email'
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        // Extract user details from populated userId
        const populatedUser = order.userId;
        return {
            order,
            user: {
                username: populatedUser.username,
                email: populatedUser.email
            }
        };
    }
    /**
     * Get order for invoice download with authorization check
     */
    static async getOrderForInvoice(orderId, currentUserId) {
        if (!mongoose_1.default.Types.ObjectId.isValid(orderId)) {
            throw new errors_1.AppError('Invalid order ID', 400);
        }
        const order = await order_1.Order.findById(orderId).populate({
            path: 'userId',
            select: 'username email'
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        // Check authorization: users can only download their own invoices
        // Convert both to string for proper comparison since order.userId might be ObjectId
        const orderUserId = order.userId._id?.toString() || order.userId.toString();
        const isOwner = orderUserId === currentUserId;
        if (!isOwner) {
            throw new errors_1.AppError('Access denied. You can only download your own invoices.', 403);
        }
        // Extract user details from populated userId
        const populatedUser = order.userId;
        return {
            order,
            user: {
                username: populatedUser.username,
                email: populatedUser.email
            }
        };
    }
    /**
     * Get order by code
     */
    static async getOrderByCode(code) {
        const order = await order_1.Order.findOne({ code })
            .populate({
            path: 'userId',
            select: 'username email'
        })
            .populate({
            path: 'items.courseId',
            select: 'title image'
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        return order;
    }
    /**
     * Update order status
     */
    static async updateOrderStatus(orderId, statusData) {
        // Get current order to check previous status
        const currentOrder = await order_1.Order.findById(orderId);
        if (!currentOrder) {
            throw new errors_1.AppError('Order not found', 404);
        }
        const previousStatus = currentOrder.status;
        const newStatus = statusData.status;
        // Update order status
        const order = await order_1.Order.findByIdAndUpdate(orderId, { status: newStatus }, { new: true, runValidators: true }).populate({
            path: 'userId',
            select: 'username email'
        });
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        // Handle course enrollment based on status change
        await this.handleCourseEnrollment(order, previousStatus, newStatus);
        return order;
    }
    /**
     * Handle course enrollment when order status changes
     */
    static async handleCourseEnrollment(order, previousStatus, newStatus) {
        const courseIds = order.items.map((item) => item.courseId);
        const userId = order.userId;
        if (newStatus === enums_1.OrderStatus.COMPLETED && previousStatus !== enums_1.OrderStatus.COMPLETED) {
            await user_1.User.findByIdAndUpdate(userId, {
                $addToSet: {
                    courses: { $each: courseIds }
                }
            });
        }
        // When order is canceled or reverted from completed: Remove courses from user
        else if ((newStatus === enums_1.OrderStatus.CANCELLED || newStatus === enums_1.OrderStatus.PENDING) &&
            previousStatus === enums_1.OrderStatus.COMPLETED) {
            await user_1.User.findByIdAndUpdate(userId, {
                $pullAll: {
                    courses: courseIds
                }
            });
        }
    }
    /**
     * Cancel order
     */
    static async cancelOrder(orderId, userId) {
        const filter = { _id: orderId };
        if (userId) {
            filter.userId = new mongoose_1.default.Types.ObjectId(userId);
        }
        const order = await order_1.Order.findOne(filter);
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        if (order.status === enums_1.OrderStatus.COMPLETED) {
            throw new errors_1.AppError('Cannot cancel completed order', 400);
        }
        if (order.status === enums_1.OrderStatus.CANCELLED) {
            throw new errors_1.AppError('Order is already canceled', 400);
        }
        order.status = enums_1.OrderStatus.CANCELLED;
        await order.save();
        return order;
    }
    /**
     * Delete order (Hard delete - Admin only)
     */
    static async deleteOrder(orderId) {
        const order = await order_1.Order.findById(orderId);
        if (!order) {
            throw new errors_1.AppError('Order not found', 404);
        }
        // If order is completed, remove courses from user
        if (order.status === enums_1.OrderStatus.COMPLETED) {
            const courseIds = order.items.map((item) => item.courseId);
            await user_1.User.findByIdAndUpdate(order.userId, {
                $pullAll: {
                    courses: courseIds
                }
            });
        }
        await order_1.Order.findByIdAndDelete(orderId);
    }
    /**
     * Bulk delete orders (Hard delete - Admin only)
     */
    static async bulkDeleteOrders(data) {
        const { orderIds } = data;
        const errors = [];
        let deletedCount = 0;
        // Validate all IDs first
        const invalidIds = orderIds.filter((id) => !mongoose_1.default.Types.ObjectId.isValid(id));
        if (invalidIds.length > 0) {
            throw new errors_1.AppError(`Invalid order IDs: ${invalidIds.join(', ')}`, 400);
        }
        // Process deletions one by one to handle user course removal
        for (const orderId of orderIds) {
            try {
                const order = await order_1.Order.findById(orderId);
                if (!order) {
                    errors.push(`Order ${orderId} not found`);
                    continue;
                }
                // If order is completed, remove courses from user
                if (order.status === enums_1.OrderStatus.COMPLETED) {
                    const courseIds = order.items.map((item) => item.courseId);
                    await user_1.User.findByIdAndUpdate(order.userId, {
                        $pullAll: {
                            courses: courseIds
                        }
                    });
                }
                await order_1.Order.findByIdAndDelete(orderId);
                deletedCount++;
            }
            catch (error) {
                errors.push(`Failed to delete order ${orderId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
        return { deletedCount, errors };
    }
}
exports.OrderService = OrderService;
