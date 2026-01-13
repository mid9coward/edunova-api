"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
class DatabaseConnection {
    static instance;
    isConnected = false;
    constructor() { }
    static getInstance() {
        if (!DatabaseConnection.instance) {
            DatabaseConnection.instance = new DatabaseConnection();
        }
        return DatabaseConnection.instance;
    }
    async connect() {
        if (this.isConnected) {
            console.log('Already connected to MongoDB');
            return;
        }
        try {
            const mongoUri = process.env.MONGODB_URI;
            await mongoose_1.default.connect(mongoUri);
            this.isConnected = true;
            console.log('Successfully connected to MongoDB');
            // Handle connection events
            mongoose_1.default.connection.on('error', (error) => {
                console.error('MongoDB connection error:', error);
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('disconnected', () => {
                console.log('MongoDB disconnected');
                this.isConnected = false;
            });
            mongoose_1.default.connection.on('reconnected', () => {
                console.log('MongoDB reconnected');
                this.isConnected = true;
            });
        }
        catch (error) {
            console.error('Failed to connect to MongoDB:', error);
            this.isConnected = false;
            throw error;
        }
    }
    async disconnect() {
        if (!this.isConnected) {
            return;
        }
        try {
            await mongoose_1.default.disconnect();
            this.isConnected = false;
            console.log('Disconnected from MongoDB');
        }
        catch (error) {
            console.error('Error disconnecting from MongoDB:', error);
            throw error;
        }
    }
    getConnectionStatus() {
        return this.isConnected;
    }
}
exports.default = DatabaseConnection.getInstance();
