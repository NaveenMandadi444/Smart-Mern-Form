/**
 * Smart Field Mapping Controller
 * API endpoints for intelligent form field mapping
 */

import {
  mapFormFields,
  mapSingleFormField,
  getSuggestion,
  getAllStandardFields,
  getFieldVariations,
} from "../services/smartFieldMappingService.js";
import VaultField from "../models/VaultField.js";

/**
 * POST /api/field-mapping/map
 * Map form fields to stored data
 * 
 * Request body:
 * {
 *   formFields: [
 *     { label: "Student Name", type: "text" },
 *     { label: "Father Name", type: "text" }
 *   ],
 *   useAI: true,
 *   storedData: { ... }  // Optional - if not provided, will lookup from vault
 * }
 */
export const mapFormFieldsAPI = async (req, res) => {
  try {
    const userId = req.userId;
    const { formFields, useAI = true, storedData } = req.body;

    // Validate input
    if (!formFields || !Array.isArray(formFields) || formFields.length === 0) {
      return res.status(400).json({
        message: "formFields must be a non-empty array",
      });
    }

    // If storedData not provided, fetch from vault
    let dataToUse = storedData;
    if (!dataToUse) {
      console.log("📂 Fetching stored data from vault for user:", userId);
      const vaultFields = await VaultField.find({ userId }).lean();
      
      dataToUse = {};
      vaultFields.forEach((field) => {
        // Use semantic tag as key if available, otherwise use field name
        const key = field.semanticTag || field.fieldName;
        dataToUse[key] = field.fieldValue;
      });
    }

    // Map fields
    const result = await mapFormFields(formFields, dataToUse, useAI);

    res.status(200).json({
      message: "Form fields mapped successfully",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error mapping form fields:", error);
    res.status(500).json({
      message: "Failed to map form fields",
      error: error.message,
    });
  }
};

/**
 * POST /api/field-mapping/map-single
 * Map a single form field
 * 
 * Request body:
 * {
 *   fieldLabel: "Student Name",
 *   storedData: { ... }  // Optional
 * }
 */
export const mapSingleFieldAPI = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldLabel, storedData } = req.body;

    if (!fieldLabel || typeof fieldLabel !== "string") {
      return res.status(400).json({
        message: "fieldLabel must be a non-empty string",
      });
    }

    // If storedData not provided, fetch from vault
    let dataToUse = storedData;
    if (!dataToUse) {
      const vaultFields = await VaultField.find({ userId }).lean();
      dataToUse = {};
      vaultFields.forEach((field) => {
        const key = field.semanticTag || field.fieldName;
        dataToUse[key] = field.fieldValue;
      });
    }

    // Map field
    const result = mapSingleFormField(fieldLabel, dataToUse);

    res.status(200).json({
      message: "Single field mapped successfully",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error mapping single field:", error);
    res.status(500).json({
      message: "Failed to map single field",
      error: error.message,
    });
  }
};

/**
 * POST /api/field-mapping/suggest
 * Get suggestion for a standard field
 * 
 * Request body:
 * {
 *   standardField: "percentage",
 *   storedData: { ... }  // Optional
 * }
 */
export const suggestFieldValueAPI = async (req, res) => {
  try {
    const userId = req.userId;
    const { standardField, storedData } = req.body;

    if (!standardField || typeof standardField !== "string") {
      return res.status(400).json({
        message: "standardField must be a non-empty string",
      });
    }

    // If storedData not provided, fetch from vault
    let dataToUse = storedData;
    if (!dataToUse) {
      const vaultFields = await VaultField.find({ userId }).lean();
      dataToUse = {};
      vaultFields.forEach((field) => {
        const key = field.semanticTag || field.fieldName;
        dataToUse[key] = field.fieldValue;
      });
    }

    // Get suggestion
    const result = getSuggestion(standardField, dataToUse);

    res.status(200).json({
      message: "Field suggestion retrieved",
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting field suggestion:", error);
    res.status(500).json({
      message: "Failed to get field suggestion",
      error: error.message,
    });
  }
};

/**
 * GET /api/field-mapping/standard-fields
 * Get all standard field definitions
 */
export const getStandardFieldsAPI = async (req, res) => {
  try {
    const standardFields = getAllStandardFields();

    res.status(200).json({
      message: "Standard fields retrieved",
      data: standardFields,
      count: Object.keys(standardFields).length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting standard fields:", error);
    res.status(500).json({
      message: "Failed to get standard fields",
      error: error.message,
    });
  }
};

/**
 * GET /api/field-mapping/variations/:standardField
 * Get naming variations for a standard field
 */
export const getFieldVariationsAPI = async (req, res) => {
  try {
    const { standardField } = req.params;

    if (!standardField) {
      return res.status(400).json({
        message: "standardField parameter is required",
      });
    }

    const variations = getFieldVariations(standardField);

    if (variations.length === 0) {
      return res.status(404).json({
        message: "Standard field not found",
        field: standardField,
      });
    }

    res.status(200).json({
      message: "Field variations retrieved",
      field: standardField,
      variations,
      count: variations.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting field variations:", error);
    res.status(500).json({
      message: "Failed to get field variations",
      error: error.message,
    });
  }
};

/**
 * POST /api/field-mapping/validate
 * Validate if a mapping is confident
 * 
 * Request body:
 * {
 *   formFieldLabel: "Student Name",
 *   threshold: 0.75  // Confidence threshold (default 0.75)
 * }
 */
export const validateMappingAPI = async (req, res) => {
  try {
    const userId = req.userId;
    const { formFieldLabel, threshold = 0.75 } = req.body;

    if (!formFieldLabel) {
      return res.status(400).json({
        message: "formFieldLabel is required",
      });
    }

    // Fetch from vault
    const vaultFields = await VaultField.find({ userId }).lean();
    const dataToUse = {};
    vaultFields.forEach((field) => {
      const key = field.semanticTag || field.fieldName;
      dataToUse[key] = field.fieldValue;
    });

    // Map field
    const mapped = mapSingleFormField(formFieldLabel, dataToUse);
    const isConfident = mapped.confidence >= threshold && mapped.status !== "missing";

    res.status(200).json({
      message: "Mapping validation completed",
      data: {
        formFieldLabel,
        mapped,
        isConfident,
        threshold,
        recommendation: isConfident
          ? "Safe to auto-fill"
          : "Manual verification recommended",
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error validating mapping:", error);
    res.status(500).json({
      message: "Failed to validate mapping",
      error: error.message,
    });
  }
};

/**
 * POST /api/field-mapping/batch
 * Map multiple form fields in batch
 * 
 * Request body:
 * {
 *   batches: [
 *     {
 *       formId: "form123",
 *       formFields: [
 *         { label: "Student Name", type: "text" }
 *       ]
 *     }
 *   ],
 *   useAI: true
 * }
 */
export const batchMapFieldsAPI = async (req, res) => {
  try {
    const userId = req.userId;
    const { batches, useAI = true } = req.body;

    if (!batches || !Array.isArray(batches)) {
      return res.status(400).json({
        message: "batches must be an array",
      });
    }

    // Fetch user's vault data once
    const vaultFields = await VaultField.find({ userId }).lean();
    const vaultData = {};
    vaultFields.forEach((field) => {
      const key = field.semanticTag || field.fieldName;
      vaultData[key] = field.fieldValue;
    });

    // Process each batch
    const results = [];
    for (const batch of batches) {
      const { formId, formFields } = batch;

      if (!formId || !formFields) {
        results.push({
          formId,
          error: "formId and formFields are required",
        });
        continue;
      }

      try {
        const mapped = await mapFormFields(formFields, vaultData, useAI);
        results.push({
          formId,
          success: true,
          data: mapped,
        });
      } catch (error) {
        results.push({
          formId,
          success: false,
          error: error.message,
        });
      }
    }

    res.status(200).json({
      message: "Batch mapping completed",
      total: batches.length,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in batch mapping:", error);
    res.status(500).json({
      message: "Failed to process batch mapping",
      error: error.message,
    });
  }
};

export default {
  mapFormFieldsAPI,
  mapSingleFieldAPI,
  suggestFieldValueAPI,
  getStandardFieldsAPI,
  getFieldVariationsAPI,
  validateMappingAPI,
  batchMapFieldsAPI,
};
