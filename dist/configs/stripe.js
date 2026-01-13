"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.STRIPE_CURRENCY = exports.STRIPE_WEBHOOK_SECRET = void 0;
const stripe_1 = __importDefault(require("stripe"));
const errors_1 = require("../utils/errors");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
/**
 * Stripe Configuration
 */
// Initialize Stripe with secret key
if (!process.env.STRIPE_SECRET_KEY) {
    throw new errors_1.AppError('STRIPE_SECRET_KEY environment variable is required', 500);
}
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-08-27.basil', // Latest available API version
    typescript: true
});
// Webhook endpoint secret for signature verification
exports.STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;
// Currency configuration
exports.STRIPE_CURRENCY = process.env.STRIPE_CURRENCY || 'usd';
exports.default = stripe;
