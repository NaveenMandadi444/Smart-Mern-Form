import { matchFormFieldsWithVault } from "../services/geminiService.js";
import { trackFieldUsage } from "../services/learningService.js";
import {
  resolveBestSourceForField,
  resolveMultipleFields,
} from "../services/documentSourceResolver.js";
import {
  intelligentAutoFillWithSelection,
  getFieldWithAlternatives,
  userSelectsFieldVariant,
  getFormSourceSummary,
} from "../services/multiSourceSelector.js";
import VaultField from "../models/VaultField.js";
import VaultAmbiguity from "../models/VaultAmbiguity.js";
import VaultSection from "../models/VaultSection.js";

/**
 * 🔍 DEBUG: Check vault status
 * Helpful for debugging auto-fill issues
 */
export const debugVaultStatus = async (req, res) => {
  try {
    const userId = req.userId;

    const totalFields = await VaultField.countDocuments({ userId });
    const fieldsBySource = await VaultField.aggregate([
      { $match: { userId } },
      { $group: { _id: "$extractedFrom", count: { $sum: 1 } } },
    ]);

    const sampleFields = await VaultField.find({ userId })
      .select('fieldName fieldValue extractedFrom confidence')
      .limit(10)
      .lean();

    res.json({
      totalVaultFields: totalFields,
      fieldsBySource: fieldsBySource,
      sampleFields: sampleFields,
      message: `Vault has ${totalFields} fields from ${fieldsBySource.length} document sources`,
    });
  } catch (error) {
    console.error("❌ Debug vault error:", error);
    res.status(500).json({
      message: "Failed to get vault status",
      error: error.message,
    });
  }
};

/**
 * Automatically selects best document source - NO user interaction needed
 * Uses priority rules for identity, academic, and name fields
 */
export const intelligentAutoFill = async (req, res) => {
  try {
    const userId = req.userId;
    const { formFields } = req.body;

    if (!formFields || !Array.isArray(formFields)) {
      return res.status(400).json({
        message: "formFields must be an array",
      });
    }

    console.log(`\n🚀 INTELLIGENT AUTOFILL: Processing ${formFields.length} fields`);

    // Use batch resolution for all fields at once
    const resolution = await resolveMultipleFields(userId, formFields);

    // Transform results for frontend
    const autofillData = {};
    resolution.results.forEach((result) => {
      if (result.status === "filled") {
        autofillData[result.formField] = {
          value: result.value,
          source: result.source,
          confidence: result.confidence,
          status: result.fieldStatus, // "filled" or "converted"
          autoFilled: true,
          mappingType: "intelligent_silent",
        };
      }
    });

    // Track usage for learning
    for (const [fieldName, fieldData] of Object.entries(autofillData)) {
      try {
        await trackFieldUsage(userId, fieldName, fieldData.value, "autofill");
      } catch (trackError) {
        console.log(`⚠️ Learning tracking skipped for ${fieldName}`);
      }
    }

    res.json({
      success: resolution.summary.filled > 0,
      autofillData,
      summary: resolution.summary,
      message: `Auto-filled ${resolution.summary.filled}/${resolution.summary.total} fields silently`,
    });
  } catch (error) {
    console.error("❌ Intelligent autofill error:", error);
    res.status(500).json({
      message: "Intelligent autofill failed",
      error: error.message,
    });
  }
};

/**
 * 🎯 AUTO-FILL SINGLE FIELD WITH INTELLIGENT RESOLUTION
 * Fills one field optimally without asking user
 */
export const autoFillSingleField = async (req, res) => {
  try {
    const userId = req.userId;
    const { formFieldName } = req.body;

    if (!formFieldName) {
      return res.status(400).json({
        message: "formFieldName is required",
      });
    }

    console.log(`\n🎯 SINGLE FIELD AUTOFILL: "${formFieldName}"`);

    // Resolve best source for single field
    const result = await resolveBestSourceForField(userId, formFieldName);

    if (result.status === "filled") {
      // Track usage
      try {
        await trackFieldUsage(userId, formFieldName, result.value, "autofill");
      } catch (trackError) {
        console.log(`⚠️ Learning tracking skipped`);
      }

      return res.json({
        success: true,
        formField: formFieldName,
        value: result.value,
        source: result.source,
        confidence: result.confidence,
        status: result.fieldStatus, // "filled" or "converted"
        autoFilled: true,
        mappingType: "intelligent_silent",
      });
    } else {
      return res.json({
        success: false,
        formField: formFieldName,
        status: result.status, // "missing", "unsafe", "error"
        reason: result.reason,
        autoFilled: false,
      });
    }
  } catch (error) {
    console.error("❌ Single field autofill error:", error);
    res.status(500).json({
      message: "Single field autofill failed",
      error: error.message,
    });
  }
};

/**
 * 🎯 NEW: Auto-Fill WITH SOURCE SELECTION
 * Auto-fills with best source BUT shows alternatives
 * User can click to switch between different document sources
 */
export const autoFillWithSourceSelection = async (req, res) => {
  try {
    const userId = req.userId;
    const { formFields } = req.body;

    if (!formFields || !Array.isArray(formFields)) {
      return res.status(400).json({
        message: "formFields must be an array",
      });
    }

    console.log(`\n🎯 AUTO-FILL WITH SELECTION: Processing ${formFields.length} fields`);

    // Check vault status
    const vaultCount = await VaultField.countDocuments({ userId });
    console.log(`📊 User vault has ${vaultCount} fields`);

    if (vaultCount === 0) {
      console.log(`⚠️  VAULT IS EMPTY - Auto-fill will fail for all fields`);
      return res.json({
        success: false,
        fields: formFields.map(f => ({
          formField: f,
          current: null,
          alternatives: [],
          status: "missing",
          userCanOverride: false,
        })),
        summary: {
          total: formFields.length,
          filled: 0,
          missing: formFields.length,
          fieldsWithAlternatives: 0,
        },
        message: "Vault is empty - please upload documents first to use auto-fill",
      });
    }

    // Get intelligent auto-fill with alternatives
    const result = await intelligentAutoFillWithSelection(userId, formFields);

    res.json({
      success: result.success,
      fields: result.fields,
      summary: result.summary,
      message: `Form auto-filled with ${result.summary.fieldsWithAlternatives} fields having alternative sources`,
    });
  } catch (error) {
    console.error("❌ Auto-fill with selection error:", error);
    res.status(500).json({
      message: "Auto-fill with selection failed",
      error: error.message,
    });
  }
};

/**
 * Get all variants of a single field
 * User can see and choose between different document sources
 */
export const getFieldVariants = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldName } = req.body;

    if (!fieldName) {
      return res.status(400).json({
        message: "fieldName is required",
      });
    }

    console.log(`\n📋 Getting variants for: "${fieldName}"`);

    // Get field with all alternatives
    const fieldData = await getFieldWithAlternatives(userId, fieldName);

    res.json({
      success: !!fieldData.best,
      fieldName,
      current: fieldData.best,
      alternatives: fieldData.alternatives,
      totalSources: fieldData.totalVariants,
      message: fieldData.message || `Found ${fieldData.alternatives.length} alternatives`,
    });
  } catch (error) {
    console.error("❌ Get field variants error:", error);
    res.status(500).json({
      message: "Failed to get field variants",
      error: error.message,
    });
  }
};

/**
 * User selects a specific variant
 * Track for learning purposes
 */
export const userSelectsVariant = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldName, selectedValue, selectedSource } = req.body;

    if (!fieldName || !selectedValue || !selectedSource) {
      return res.status(400).json({
        message: "fieldName, selectedValue, and selectedSource are required",
      });
    }

    console.log(
      `\n✍️ User selected variant: "${fieldName}" = "${selectedValue}" from ${selectedSource}`
    );

    // Track the user's selection for learning
    const result = await userSelectsFieldVariant(
      userId,
      fieldName,
      selectedValue,
      selectedSource
    );

    res.json({
      success: true,
      message: `User selection recorded for "${fieldName}"`,
      fieldName,
      selectedValue,
      selectedSource,
    });
  } catch (error) {
    console.error("❌ User select variant error:", error);
    res.status(500).json({
      message: "Failed to record user selection",
      error: error.message,
    });
  }
};

/**
 * Get source summary for entire form
 * Shows which documents are used in the form
 */
export const getFormSources = async (req, res) => {
  try {
    const userId = req.userId;
    const { formFields } = req.body;

    if (!formFields || !Array.isArray(formFields)) {
      return res.status(400).json({
        message: "formFields must be an array",
      });
    }

    console.log(`\n📊 Getting source summary for form...`);

    // Get form source summary
    const summary = await getFormSourceSummary(userId, formFields);

    res.json({
      success: true,
      sources: summary.sources,
      fieldsBySource: summary.fieldsBySource,
      sourceContribution: summary.sourceContribution,
      message: `Form uses data from ${summary.sources.length} document sources`,
    });
  } catch (error) {
    console.error("❌ Get form sources error:", error);
    res.status(500).json({
      message: "Failed to get form sources",
      error: error.message,
    });
  }
};

export const suggestAutofill = async (req, res) => {
  try {
    const userId = req.userId;
    const { formFieldName, formContext } = req.body;

    // Get all values for similar fields across vault
    const vaultFields = await VaultField.find({
      userId,
      fieldName: formFieldName,
    });

    if (vaultFields.length === 0) {
      return res.json({
        suggestions: [],
        message: "No matching fields found in vault",
      });
    }

    // Get the most recent/confident value as primary
    const primaryField = vaultFields.reduce((prev, current) =>
      current.confidence > prev.confidence ? current : prev,
    );

    // Get all alternatives
    const alternatives = vaultFields
      .filter((f) => f._id.toString() !== primaryField._id.toString())
      .slice(0, 3);

    // Track usage
    await trackFieldUsage(
      userId,
      formFieldName,
      primaryField.fieldValue,
      "form",
    );

    res.json({
      primary: {
        value: primaryField.fieldValue,
        source: primaryField.extractedFrom,
        confidence: primaryField.confidence,
        sectionId: primaryField.sectionId,
      },
      alternatives: alternatives.map((f) => ({
        value: f.fieldValue,
        source: f.extractedFrom,
        confidence: f.confidence,
        sectionId: f.sectionId,
      })),
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Autofill suggestion failed", error: error.message });
  }
};

export const getAlternativeSources = async (req, res) => {
  try {
    const userId = req.userId;
    const { fieldName } = req.body;

    const fields = await VaultField.find({ userId, fieldName });

    const alternatives = fields.map((f) => ({
      value: f.fieldValue,
      source: f.extractedFrom,
      confidence: f.confidence,
      sectionId: f.sectionId,
      createdAt: f.createdAt,
    }));

    res.json({
      fieldName,
      alternatives,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get alternatives", error: error.message });
  }
};

export const getLearnedFieldsForAutofill = async (req, res) => {
  try {
    const userId = req.userId;

    const learnedFields = await VaultField.aggregate([
      { $match: { userId: userId } },
      { $group: { _id: "$fieldName", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
    ]);

    res.json({
      learnedFields,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to get learned fields", error: error.message });
  }
};

export const copyFieldWithFormat = async (req, res) => {
  try {
    const { fieldValue, targetFormat } = req.body;

    // Apply format transformation (e.g., date formatting, phone formatting)
    let formattedValue = fieldValue;

    if (targetFormat === "phone") {
      formattedValue = fieldValue.replace(/(\d{10})/, "+91-$1");
    } else if (targetFormat === "date") {
      // Simple date formatting
      formattedValue = new Date(fieldValue).toLocaleDateString("en-IN");
    }

    res.json({
      originalValue: fieldValue,
      formattedValue,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to format field", error: error.message });
  }
};
