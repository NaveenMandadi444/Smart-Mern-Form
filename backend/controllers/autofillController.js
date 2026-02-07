import { matchFormFieldsWithVault } from "../services/geminiService.js";
import { trackFieldUsage } from "../services/learningService.js";
import VaultField from "../models/VaultField.js";
import VaultAmbiguity from "../models/VaultAmbiguity.js";
import VaultSection from "../models/VaultSection.js";

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
