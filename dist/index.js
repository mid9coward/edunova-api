"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const body_parser_1 = __importDefault(require("body-parser"));
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_1 = require("./db");
const error_middleware_1 = require("./middlewares/error.middleware");
const rate_limit_middleware_1 = require("./middlewares/rate-limit.middleware");
const routers_1 = __importDefault(require("./routers"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use((0, helmet_1.default)());
app.use((0, compression_1.default)());
app.use(body_parser_1.default.json());
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use((0, cors_1.default)());
// Apply default rate limiting to all API routes
app.use('/api/v1', rate_limit_middleware_1.defaultRateLimit);
// API routes
app.use('/api/v1', routers_1.default);
// 404 handler - must be after all routes
app.use(error_middleware_1.notFoundHandler);
// Error handler - must be last middleware
app.use(error_middleware_1.errorHandler);
const startServer = async () => {
    try {
        // Connect to MongoDB
        await db_1.DatabaseConnection.connect();
        // Start the server
        const port = process.env.PORT || 8888;
        app.listen(port, () => {
            console.log(`Server is listening on port ${port}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await db_1.DatabaseConnection.disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await db_1.DatabaseConnection.disconnect();
    process.exit(0);
});
startServer();
