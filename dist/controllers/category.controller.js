"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CategoryController = void 0;
const category_service_1 = require("../services/category.service");
const success_1 = require("../utils/success");
/**
 * Category Controller
 * Simple CRUD operations for categories
 */
class CategoryController {
    /**
     * Create new category
     */
    static async createCategory(req, res) {
        const categoryData = req.body;
        const category = await category_service_1.CategoryService.createCategory(categoryData);
        success_1.sendSuccess.created(res, 'Category created successfully', { category });
    }
    /**
     * Get all categories with pagination
     */
    static async getCategories(req, res) {
        const query = req.query;
        const result = await category_service_1.CategoryService.getCategories(query);
        success_1.sendSuccess.ok(res, 'Categories fetched successfully', result);
    }
    /**
     * Get all categories (simple list)
     */
    static async getAllCategories(req, res) {
        const categories = await category_service_1.CategoryService.getAllCategories();
        success_1.sendSuccess.ok(res, 'Categories fetched successfully', { categories });
    }
    /**
     * Get category by ID
     */
    static async getCategoryById(req, res) {
        const { categoryId } = req.params;
        const category = await category_service_1.CategoryService.getCategoryById(categoryId);
        success_1.sendSuccess.ok(res, 'Category fetched successfully', { category });
    }
    /**
     * Update category
     */
    static async updateCategory(req, res) {
        const { categoryId } = req.params;
        const updateData = req.body;
        const category = await category_service_1.CategoryService.updateCategory(categoryId, updateData);
        success_1.sendSuccess.ok(res, 'Category updated successfully', { category });
    }
    /**
     * Delete category
     */
    static async deleteCategory(req, res) {
        const { categoryId } = req.params;
        await category_service_1.CategoryService.deleteCategory(categoryId);
        success_1.sendSuccess.ok(res, 'Category deleted successfully');
    }
    /**
     * Bulk delete categories
     */
    static async bulkDeleteCategories(req, res) {
        const bulkDeleteData = req.body;
        const result = await category_service_1.CategoryService.bulkDeleteCategories(bulkDeleteData);
        success_1.sendSuccess.ok(res, 'Categories deleted successfully', result);
    }
}
exports.CategoryController = CategoryController;
