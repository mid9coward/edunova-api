"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const search_controller_1 = require("../controllers/search.controller");
const validation_middleware_1 = require("../middlewares/validation.middleware");
const error_middleware_1 = require("../middlewares/error.middleware");
const rate_limit_middleware_1 = require("../middlewares/rate-limit.middleware");
const search_schema_1 = require("../schemas/search.schema");
const router = (0, express_1.Router)();
/**
 * Public Routes
 */
/**
 * @route GET /search?q=query
 * @desc Search for courses and blogs
 * @access Public
 */
router.get('/', rate_limit_middleware_1.searchRateLimit, (0, validation_middleware_1.validate)(search_schema_1.searchQuerySchema), (0, error_middleware_1.asyncHandler)(search_controller_1.SearchController.search));
exports.default = router;
