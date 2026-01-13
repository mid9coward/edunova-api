"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.comparePassword = exports.hashPassword = exports.verifyToken = exports.generatePasswordResetToken = exports.generateVerificationToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const generateToken = (userId) => {
    const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;
    return jsonwebtoken_1.default.sign({ userId }, secret, { expiresIn });
};
exports.generateToken = generateToken;
const generateVerificationToken = (userId) => {
    const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
    const expiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN;
    return jsonwebtoken_1.default.sign({ userId, type: 'email_verification' }, secret, { expiresIn });
};
exports.generateVerificationToken = generateVerificationToken;
const generatePasswordResetToken = (userId) => {
    const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
    const expiresIn = '1h'; // Password reset token expires in 1 hour
    return jsonwebtoken_1.default.sign({ userId, type: 'password_reset' }, secret, { expiresIn });
};
exports.generatePasswordResetToken = generatePasswordResetToken;
const verifyToken = (token) => {
    const secret = process.env.ACCESS_TOKEN_SECRET || 'your-secret-key';
    return jsonwebtoken_1.default.verify(token, secret);
};
exports.verifyToken = verifyToken;
const hashPassword = async (password) => {
    const saltRounds = 12;
    return await bcryptjs_1.default.hash(password, saltRounds);
};
exports.hashPassword = hashPassword;
const comparePassword = async (password, hashedPassword) => {
    return await bcryptjs_1.default.compare(password, hashedPassword);
};
exports.comparePassword = comparePassword;
