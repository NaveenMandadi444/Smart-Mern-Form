/**
 * 🎯 MULTI-SOURCE INTELLIGENT DOCUMENT RESOLVER
 * 
 * Intelligently selects the best document source for form fields
 * WITHOUT asking user - makes silent automatic decisions
 * 
 * Architecture: 3 Decision Layers
 * LAYER 1 → Identify Field Meaning (context analysis)
 * LAYER 2 → Identify Best Document Source (priority rules)
 * LAYER 3 → Validate + Fill (confidence check)
 */

import VaultField from "../models/VaultField.js";
import VaultDocument from "../models/VaultDocument.js";

/**
 * Document Priority Rules
 * Defines which document source is preferred for each field category
 */
const DOCUMENT_PRIORITY_RULES = {
  // Identity Fields → Aadhaar is the authoritative source
  identity: {
    DOB: { primary: "AADHAAR", fallback: ["TENTH", "INTER", "PASSPORT", "PAN"] },
    "date of birth": { primary: "AADHAAR", fallback: ["TENTH", "INTER", "PASSPORT", "PAN"] },
    address: { primary: "AADHAAR", fallback: [] }, // STRICT: Aadhaar only
    gender: { primary: "AADHAAR", fallback: ["PASSPORT", "PAN"] },
    "aadhaar number": { primary: "AADHAAR", fallback: [] },
    "pan number": { primary: "PAN", fallback: [] },
    "passport number": { primary: "PASSPORT", fallback: [] },
  },

  // Academic Percentage Fields → Education level specific
  academic_percentage: {
    "10th percentage": { primary: "TENTH", fallback: [] },
    "tenth percentage": { primary: "TENTH", fallback: [] },
    "10th marks": { primary: "TENTH", fallback: [] },
    "12th percentage": { primary: "INTER", fallback: [] },
    "inter percentage": { primary: "INTER", fallback: [] },
    "intermediate percentage": { primary: "INTER", fallback: [] },
    "12th marks": { primary: "INTER", fallback: [] },
    "degree cgpa": { primary: "DEGREE", fallback: [] },
    "btec cgpa": { primary: "DEGREE", fallback: [] },
  },

  // Flexible Name Fields
  name: {
    name: { primary: "AADHAAR", fallback: ["PASSPORT", "PAN", "TENTH", "INTER", "DEGREE"] },
    "full name": { primary: "AADHAAR", fallback: ["PASSPORT", "PAN", "TENTH", "INTER", "DEGREE"] },
    "student name": { primary: "AADHAAR", fallback: ["TENTH", "INTER"] },
    "applicant name": { primary: "AADHAAR", fallback: ["PASSPORT", "PAN"] },
    "father name": { primary: "AADHAAR", fallback: ["PAN", "PASSPORT"] },
    "father's name": { primary: "AADHAAR", fallback: ["PAN", "PASSPORT"] },
    "mother name": { primary: "AADHAAR", fallback: ["PASSPORT"] },
    "mother's name": { primary: "AADHAAR", fallback: ["PASSPORT"] },
  },
};

/**
 * LAYER 1: Identify Field Meaning
 * Determines if field is identity, academic, name, or other
 */
function classifyFieldMeaning(formFieldLabel) {
  const lowerLabel = formFieldLabel.toLowerCase().trim();

  // Check identity fields
  for (const field of Object.keys(DOCUMENT_PRIORITY_RULES.identity)) {
    if (lowerLabel.includes(field)) {
      return { category: "identity", priority: DOCUMENT_PRIORITY_RULES.identity[field] };
    }
  }

  // Check academic percentage fields
  for (const field of Object.keys(DOCUMENT_PRIORITY_RULES.academic_percentage)) {
    if (lowerLabel.includes(field)) {
      return { category: "academic_percentage", priority: DOCUMENT_PRIORITY_RULES.academic_percentage[field] };
    }
  }

  // Check name fields
  for (const field of Object.keys(DOCUMENT_PRIORITY_RULES.name)) {
    if (lowerLabel.includes(field)) {
      return { category: "name", priority: DOCUMENT_PRIORITY_RULES.name[field] };
    }
  }

  // Default: flexible matching
  return { category: "flexible", priority: { primary: "AADHAAR", fallback: ["TENTH", "INTER", "DEGREE", "PASSPORT", "PAN"] } };
}

/**
 * LAYER 2: Identify Best Document Source
 * Selects primary source, then fallbacks if needed
 */
async function findBestSourceDocument(userId, priority, existingValues = {}) {
  const primarySource = priority.primary;
  const fallbackSources = priority.fallback || [];
  const allSourcesToCheck = [primarySource, ...fallbackSources];

  console.log(`🔍 Looking for field in sources: ${allSourcesToCheck.join(" → ")}`);

  for (const source of allSourcesToCheck) {
    try {
      const doc = await VaultDocument.findOne({
        userId,
        documentType: source,
        status: "COMPLETED",
      }).lean();

      if (doc) {
        console.log(`✅ Found source: ${source}`);
        return source;
      }
    } catch (error) {
      console.log(`⚠️ Error checking ${source}:`, error.message);
    }
  }

  console.log(`❌ No document found in any source`);
  return null;
}

/**
 * LAYER 2B: Smart Percentage vs CGPA Handling
 * If percentage requested but only CGPA available → convert
 */
function shouldConvertCGPAToPercentage(fieldCategory, fieldLabel) {
  const lowerLabel = fieldLabel.toLowerCase();
  return (
    fieldCategory === "academic_percentage" &&
    (lowerLabel.includes("percentage") || lowerLabel.includes("marks")) &&
    !lowerLabel.includes("cgpa")
  );
}

function convertCGPAToPercentage(cgpaValue) {
  try {
    // Extract numeric value from CGPA (e.g., "8.5/10" → 8.5)
    const numericCGPA = parseFloat(cgpaValue.split("/")[0]);
    if (isNaN(numericCGPA)) return null;

    // Formula: percentage = CGPA × 9.5
    const percentage = (numericCGPA * 9.5).toFixed(2);
    return percentage;
  } catch (error) {
    return null;
  }
}

/**
 * LAYER 3: Validate + Fill
 * Gets field value from best source with high confidence
 */
async function getFieldValueFromSource(userId, fieldName, sourceDocument, shouldConvert = false) {
  try {
    // Special handling for Father's/Mother's Name - MUST NOT match student name
    const isFamilyName = /father|mother|parent/i.test(fieldName);
    
    let vaultField = null;
    
    if (isFamilyName) {
      // For family names, use EXACT field name match (case-insensitive)
      // This prevents matching "Name" when we want "Father's Name"
      const familyNamePattern = /father's?\s*name|mother's?\s*name/i;
      
      vaultField = await VaultField.findOne({
        userId,
        extractedFrom: sourceDocument,
        fieldName: { $regex: familyNamePattern },
        confidence: { $gte: 0.85 },
      }).lean();
      
      if (!vaultField) {
        // Try with just the family name word
        vaultField = await VaultField.findOne({
          userId,
          extractedFrom: sourceDocument,
          fieldName: { $regex: new RegExp(fieldName, "i") },
          confidence: { $gte: 0.85 },
        }).lean();
      }
    } else {
      // For regular names, use standard matching
      vaultField = await VaultField.findOne({
        userId,
        extractedFrom: sourceDocument,
        fieldName: { $regex: new RegExp(fieldName, "i") },
        confidence: { $gte: 0.85 },
      }).lean();
    }

    // If not found, try semantic matching (but NOT for family names)
    if (!vaultField && !isFamilyName) {
      vaultField = await VaultField.findOne({
        userId,
        extractedFrom: sourceDocument,
        $or: [
          { fieldName: { $regex: new RegExp(fieldName, "i") } },
          { semanticTag: { $regex: new RegExp(fieldName, "i") } },
        ],
        confidence: { $gte: 0.80 },
      }).lean();
    }

    if (!vaultField) {
      console.log(`❌ Field "${fieldName}" not found in ${sourceDocument}`);
      return null;
    }

    let value = vaultField.fieldValue;
    let status = "filled";

    // Convert CGPA to percentage if needed
    if (shouldConvert) {
      const converted = convertCGPAToPercentage(value);
      if (converted) {
        value = converted;
        status = "converted";
        console.log(`🔄 Converted CGPA ${vaultField.fieldValue} → Percentage ${value}`);
      }
    }

    return {
      value,
      source: sourceDocument,
      confidence: vaultField.confidence,
      status,
      fieldId: vaultField._id,
    };
  } catch (error) {
    console.log(`❌ Error getting field from ${sourceDocument}:`, error.message);
    return null;
  }
}

/**
 * SAFETY RULE VALIDATOR
 * Ensures no wrong cross-document filling
 */
function validateFieldSafety(fieldCategory, value, sourceDocument) {
  const lowerValue = value.toLowerCase();

  // Rule 1: Never fill address using email or random text
  if (fieldCategory === "identity" && value.includes("address")) {
    if (value.includes("@") || value.length < 10) {
      console.log(`❌ UNSAFE: Address field contains email`, value);
      return false;
    }
  }

  // Rule 2: Never fill location fields using dates
  if (fieldCategory === "identity" && value.includes("address")) {
    if (/\d{1,2}[-/]\d{1,2}[-/]\d{4}/.test(value)) {
      console.log(`❌ UNSAFE: Address field contains date`, value);
      return false;
    }
  }

  // Rule 3: Never mix academic data across levels
  if (fieldCategory === "academic_percentage") {
    // If looking for 10th percentage, must come from TENTH only
    if (value.includes("10th") && sourceDocument !== "TENTH") {
      console.log(`❌ UNSAFE: 10th percentage must come from TENTH, got ${sourceDocument}`);
      return false;
    }
    // If looking for Inter percentage, must come from INTER only
    if (value.includes("inter") && sourceDocument !== "INTER") {
      console.log(`❌ UNSAFE: Inter percentage must come from INTER, got ${sourceDocument}`);
      return false;
    }
  }

  return true;
}

/**
 * 🎯 MAIN RESOLUTION FUNCTION
 * Returns best source + value without user interaction
 */
export async function resolveBestSourceForField(userId, formFieldLabel, existingVaultItems = {}) {
  try {
    console.log(`\n🎯 RESOLVING: "${formFieldLabel}"`);

    // LAYER 1: Classify field meaning
    const fieldClassification = classifyFieldMeaning(formFieldLabel);
    console.log(`📊 Field Category: ${fieldClassification.category}`);
    console.log(`🔐 Priority Rule: ${fieldClassification.priority.primary} → [${fieldClassification.priority.fallback.join(", ")}]`);

    // LAYER 2: Find best source document
    const bestSourceDocument = await findBestSourceDocument(
      userId,
      fieldClassification.priority,
      existingVaultItems,
    );

    if (!bestSourceDocument) {
      console.log(`⚠️ No document available for "${formFieldLabel}"`);
      return {
        status: "missing",
        reason: "No document source available",
        formField: formFieldLabel,
      };
    }

    // Check if should convert CGPA to percentage
    const shouldConvert = shouldConvertCGPAToPercentage(fieldClassification.category, formFieldLabel);
    if (shouldConvert) {
      console.log(`🔄 Will convert CGPA to percentage if needed`);
    }

    // LAYER 3: Get field value from source
    const fieldResult = await getFieldValueFromSource(
      userId,
      formFieldLabel,
      bestSourceDocument,
      shouldConvert,
    );

    if (!fieldResult) {
      console.log(`⚠️ Field value not found in ${bestSourceDocument}`);
      return {
        status: "missing",
        reason: `Field not found in ${bestSourceDocument}`,
        formField: formFieldLabel,
        source: bestSourceDocument,
      };
    }

    // LAYER 3B: Validate safety
    const isSafe = validateFieldSafety(
      fieldClassification.category,
      fieldResult.value,
      bestSourceDocument,
    );

    if (!isSafe) {
      return {
        status: "unsafe",
        reason: "Data validation failed",
        formField: formFieldLabel,
        source: bestSourceDocument,
      };
    }

    // LAYER 3C: Check confidence
    if (fieldResult.confidence < 0.85) {
      return {
        status: "low_confidence",
        reason: `Confidence ${fieldResult.confidence} below 0.85 threshold`,
        formField: formFieldLabel,
        source: bestSourceDocument,
      };
    }

    // ✅ SUCCESS - Return filled value
    console.log(`✅ RESOLVED: "${formFieldLabel}" = "${fieldResult.value}" from ${bestSourceDocument}`);
    return {
      status: "filled",
      formField: formFieldLabel,
      value: fieldResult.value,
      source: bestSourceDocument,
      confidence: fieldResult.confidence,
      fieldStatus: fieldResult.status, // "filled" or "converted"
      mappingType: "auto_silent", // Silent automatic resolution
    };
  } catch (error) {
    console.error(`❌ Resolution error:`, error);
    return {
      status: "error",
      reason: error.message,
      formField: formFieldLabel,
    };
  }
}

/**
 * 🎯 BATCH RESOLUTION
 * Resolve multiple form fields at once
 */
export async function resolveMultipleFields(userId, formFieldLabels = []) {
  console.log(`\n🎯 BATCH RESOLUTION: ${formFieldLabels.length} fields`);

  const results = [];

  for (const fieldLabel of formFieldLabels) {
    const result = await resolveBestSourceForField(userId, fieldLabel);
    results.push(result);
  }

  // Summary
  const filled = results.filter((r) => r.status === "filled").length;
  const missing = results.filter((r) => r.status === "missing").length;
  const unsafe = results.filter((r) => r.status === "unsafe").length;

  console.log(`\n📊 BATCH SUMMARY:`);
  console.log(`   ✅ Filled: ${filled}`);
  console.log(`   ⚠️ Missing: ${missing}`);
  console.log(`   🚫 Unsafe: ${unsafe}`);

  return {
    results,
    summary: {
      total: formFieldLabels.length,
      filled,
      missing,
      unsafe,
      successRate: ((filled / formFieldLabels.length) * 100).toFixed(2) + "%",
    },
  };
}

export default {
  resolveBestSourceForField,
  resolveMultipleFields,
};
