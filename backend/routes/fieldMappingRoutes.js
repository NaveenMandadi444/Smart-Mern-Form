/**
 * Smart Field Mapping Routes
 * Intelligent semantic form field mapping endpoints
 */

import express from "express";
import { authMiddleware } from "../middleware/auth.js";
import {
  mapFormFieldsAPI,
  mapSingleFieldAPI,
  suggestFieldValueAPI,
  getStandardFieldsAPI,
  getFieldVariationsAPI,
  validateMappingAPI,
  batchMapFieldsAPI,
} from "../controllers/fieldMappingController.js";

const router = express.Router();

/**
 * POST /api/field-mapping/map
 * Map multiple form fields to stored data
 */
router.post("/map", authMiddleware, mapFormFieldsAPI);

/**
 * POST /api/field-mapping/map-single
 * Map a single form field
 */
router.post("/map-single", authMiddleware, mapSingleFieldAPI);

/**
 * POST /api/field-mapping/suggest
 * Get suggestion for a standard field
 */
router.post("/suggest", authMiddleware, suggestFieldValueAPI);

/**
 * GET /api/field-mapping/standard-fields
 * Get all standard field definitions
 */
router.get("/standard-fields", authMiddleware, getStandardFieldsAPI);

/**
 * GET /api/field-mapping/variations/:standardField
 * Get naming variations for a standard field
 */
router.get("/variations/:standardField", authMiddleware, getFieldVariationsAPI);

/**
 * POST /api/field-mapping/validate
 * Validate if a mapping is confident
 */
router.post("/validate", authMiddleware, validateMappingAPI);

/**
 * POST /api/field-mapping/batch
 * Map multiple form fields in batch
 */
router.post("/batch", authMiddleware, batchMapFieldsAPI);

export default router;
