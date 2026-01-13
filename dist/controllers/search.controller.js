"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchController = void 0;
const search_service_1 = require("../services/search.service");
const success_1 = require("../utils/success");
/**
 * Search Controller
 * Handles search requests for courses and blogs
 */
class SearchController {
    /**
     * Search for courses and blogs
     * GET /api/v1/search?q=query
     */
    static async search(req, res) {
        const { q } = req.query;
        // Perform search
        const results = await search_service_1.SearchService.search(q);
        success_1.sendSuccess.ok(res, 'Search completed successfully', results);
    }
}
exports.SearchController = SearchController;
