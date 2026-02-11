/**
 * 🎯 MULTI-SOURCE DATA SELECTOR
 * Enhanced Auto-Fill with Manual Source Override
 * 
 * Features:
 * - Auto-fill from best source
 * - Show alternatives from other documents
 * - User can click to switch between sources
 * - Visual source indicators
 * - Learn from user's selection
 */

import VaultField from "../models/VaultField.js";
import VaultDocument from "../models/VaultDocument.js";
import { trackFieldUsage } from "./learningService.js";

/**
 * 🧹 CLEAN AND NORMALIZE FIELD NAMES
 * Removes formatting noise from pasted form fields
 */
function normalizeFieldName(fieldName) {
  if (!fieldName || typeof fieldName !== 'string') return '';
  
  // Skip section headers and non-fields
  if (fieldName.includes('🧾') || fieldName.includes('FORM') || 
      fieldName.includes('---') || fieldName.trim().length < 2) {
    return '';
  }
  
  // Clean up the field name
  return fieldName
    .replace(/[_\-]{2,}/g, '') // Remove multiple underscores/dashes
    .replace(/:\s*$/g, '') // Remove trailing colon
    .replace(/\*\*/g, '') // Remove markdown bold
    .replace(/\s{2,}/g, ' ') // Collapse multiple spaces
    .trim()
    .toLowerCase();
}

/**
 * 🎯 FIELD VARIATIONS FOR SMART MATCHING
 * IMPORTANT: Order matters! Check specific patterns first (Father's Name before Name)
 */
const FIELD_PATTERNS = {
  // CRITICAL: Family names must be checked FIRST to avoid matching generic "name"
  "father's name|father.*name|parent.*father|father's|paternal": 'father_name',
  "mother's name|mother.*name|parent.*mother|mother's|maternal": 'mother_name',
  
  // Then generic names (will NOT match father/mother due to negative lookahead in matching logic)
  'full name|student name|applicant name|candidate name|your name': 'student_name',
  '^name$': 'student_name', // Exact match for just "name"
  
  'dob|date.*birth|birth date': 'dob',
  'email|e-mail|mail address': 'email',
  'phone|mobile|contact|cell': 'phone',
  'address|residential|permanent|current|home': 'address',
  'cgpa|gpa|grade.*point|sgpa': 'cgpa',
  'percentage|marks %|score %|grade.*percentage': 'percentage',
  'gender|sex': 'gender',
  'aadhaar|aadhar': 'aadhaar',
  'pan': 'pan',
  'roll.*number|roll no': 'roll_number',
  'school|college|university|institution': 'institution_name',
};

/**
 * Get best matching field pattern
 * CRITICAL: Ordered search to prevent "name" from matching "father's name"
 */
function findBestMatchingPattern(cleanedFieldName) {
  // FIRST: Check family names (must be before generic name matching)
  if (/father's name|father.*name|parent.*father|father's|paternal/i.test(cleanedFieldName)) {
    return 'father_name';
  }
  if (/mother's name|mother.*name|parent.*mother|mother's|maternal/i.test(cleanedFieldName)) {
    return 'mother_name';
  }
  
  // THEN: Check other patterns
  for (const [pattern, fieldType] of Object.entries(FIELD_PATTERNS)) {
    // Skip family names (already checked)
    if (pattern.includes("father") || pattern.includes("mother")) continue;
    
    const regex = new RegExp(pattern, 'i');
    if (regex.test(cleanedFieldName)) {
      return fieldType;
    }
  }
  return null;
}

/**
 * Get all variants of a field from different document sources
 * Used when user wants to see alternatives
 */
export async function getFieldVariantsFromAllSources(userId, fieldName) {
  try {
    // Clean the field name
    const cleanedFieldName = normalizeFieldName(fieldName);
    
    // Skip invalid fields
    if (!cleanedFieldName) {
      console.log(`⏭️  Skipping non-field: "${fieldName}"`);
      return {};
    }

    console.log(`🔍 Fetching variants for "${cleanedFieldName}" (from: "${fieldName}")`);

    // Find best matching pattern
    const matchingPattern = findBestMatchingPattern(cleanedFieldName);
    if (!matchingPattern) {
      console.log(`❓ No matching pattern for "${cleanedFieldName}"`);
    }

    // Build search variations - try multiple strategies
    const searchVariations = [];
    const isFamilyName = /father|mother/i.test(cleanedFieldName);
    const firstWord = cleanedFieldName.split(' ')[0];
    
    // SPECIAL HANDLING FOR FAMILY NAMES
    if (isFamilyName) {
      // For Father's/Mother's Name, use VERY specific patterns
      if (/father/i.test(cleanedFieldName)) {
        searchVariations.push({ 
          fieldName: { $regex: /father's?\s*name/i } 
        });
        searchVariations.push({ 
          fieldName: { $regex: /paternal\s*name/i } 
        });
      }
      if (/mother/i.test(cleanedFieldName)) {
        searchVariations.push({ 
          fieldName: { $regex: /mother's?\s*name/i } 
        });
        searchVariations.push({ 
          fieldName: { $regex: /maternal\s*name/i } 
        });
      }
    } else {
      // STANDARD MATCHING FOR OTHER FIELDS
      // Strategy 1: Search by cleaned field name directly
      searchVariations.push({ 
        fieldName: { $regex: new RegExp(cleanedFieldName, 'i') } 
      });
      
      // Strategy 2: Search by first word of cleaned name (but NOT if it's "name")
      if (firstWord && firstWord.length > 2 && firstWord.toLowerCase() !== 'name') {
        searchVariations.push({ 
          fieldName: { $regex: new RegExp('^' + firstWord, 'i') } 
        });
      }
      
      // Strategy 3: If we have a pattern, search by pattern type
      if (matchingPattern) {
        searchVariations.push({ 
          fieldName: { $regex: new RegExp(matchingPattern.replace(/_/g, ' '), 'i') } 
        });
      }
    }

    // Execute query with OR condition on all variations
    console.log(`🔎 Searching vault with ${searchVariations.length} variations for "${cleanedFieldName}"...`);
    
    let variants = await VaultField.find({
      userId,
      $or: searchVariations,
      confidence: { $gte: 0.6 }, // Lowered threshold from 0.75
    })
      .sort({ confidence: -1, createdAt: -1 })
      .limit(50)
      .lean();

    console.log(`📊 Found ${variants.length} variants in vault`);

    // Fallback: If no matches AND not a family name, search all vault fields with lower confidence
    // (Don't relax family name searches - if not found, it's genuinely not in vault)
    if (variants.length === 0 && !isFamilyName) {
      console.log(`🔄 Fallback: Searching ALL vault fields with lower confidence...`);
      variants = await VaultField.find({
        userId,
        $or: searchVariations,
      })
        .sort({ confidence: -1, createdAt: -1 })
        .limit(50)
        .lean();
      
      console.log(`📊 Fallback found ${variants.length} variants`);
    }

    if (variants.length === 0) {
      console.log(`⚠️  No vault data found for "${cleanedFieldName}" - vault might be empty or field not extracted`);
      return {};
    }

    // Group by source document type
    const groupedBySource = {};
    for (const variant of variants) {
      const source = variant.extractedFrom || 'UNKNOWN';
      if (!groupedBySource[source]) {
        groupedBySource[source] = [];
      }
      groupedBySource[source].push({
        value: variant.fieldValue,
        confidence: variant.confidence || 0.8,
        id: variant._id,
        extractedFrom: source,
        createdAt: variant.createdAt,
      });
    }

    console.log(`✅ Found variants from ${Object.keys(groupedBySource).length} sources: ${Object.keys(groupedBySource).join(', ')}`);
    return groupedBySource;
  } catch (error) {
    console.error("❌ Error fetching variants:", error);
    return {};
  }
}

/**
 * Get best value + alternatives for a field
 * Returns: { best, alternatives }
 */
export async function getFieldWithAlternatives(
  userId,
  fieldName,
  prioritySource = null
) {
  try {
    console.log(`\n🔎 Getting field with alternatives: "${fieldName}"`);

    // Get all variants
    const allVariants = await getFieldVariantsFromAllSources(userId, fieldName);

    if (Object.keys(allVariants).length === 0) {
      return {
        best: null,
        alternatives: [],
        message: "No data found for this field",
      };
    }

    // Select best value
    let best = null;
    let bestSource = null;
    let bestConfidence = 0;

    for (const [source, sourceVariants] of Object.entries(allVariants)) {
      if (sourceVariants.length > 0) {
        const topVariant = sourceVariants[0]; // Already sorted by confidence
        if (topVariant.confidence > bestConfidence) {
          best = topVariant.value;
          bestSource = source;
          bestConfidence = topVariant.confidence;
        }
      }
    }

    // Build alternatives list (excluding the best one)
    const alternatives = [];
    for (const [source, sourceVariants] of Object.entries(allVariants)) {
      for (const variant of sourceVariants) {
        if (variant.value !== best) {
          alternatives.push({
            value: variant.value,
            source: source,
            confidence: variant.confidence,
            id: variant.id,
            isBest: false,
          });
        }
      }
    }

    return {
      best: {
        value: best,
        source: bestSource,
        confidence: bestConfidence,
        isBest: true,
      },
      alternatives: alternatives.sort((a, b) => b.confidence - a.confidence),
      totalVariants: Object.keys(allVariants).length,
    };
  } catch (error) {
    console.error("❌ Error getting field with alternatives:", error);
    return {
      best: null,
      alternatives: [],
      error: error.message,
    };
  }
}

/**
 * Get intelligent auto-fill with source selection capability
 * Extended version with alternatives
 */
export async function intelligentAutoFillWithSelection(userId, formFields) {
  try {
    console.log(`\n🎯 INTELLIGENT AUTO-FILL WITH SELECTION: ${formFields.length} fields`);

    // Filter and clean form fields
    const validFields = formFields
      .map(f => normalizeFieldName(f))
      .filter(f => f && f.length > 0);

    console.log(`✅ Cleaned fields: ${formFields.length} → ${validFields.length} valid fields`);

    const results = [];

    for (const cleanedFieldName of validFields) {
      // Find original field name for response
      const originalField = formFields.find(f => normalizeFieldName(f) === cleanedFieldName);
      
      const fieldData = await getFieldWithAlternatives(userId, cleanedFieldName);

      if (fieldData.best) {
        results.push({
          formField: originalField,
          current: {
            value: fieldData.best.value,
            source: fieldData.best.source,
            confidence: fieldData.best.confidence,
          },
          alternatives: fieldData.alternatives,
          totalSources: fieldData.totalVariants,
          status: "filled",
          userCanOverride: fieldData.alternatives.length > 0,
        });
      } else {
        results.push({
          formField: originalField,
          current: null,
          alternatives: [],
          status: "missing",
          userCanOverride: false,
        });
      }
    }

    const filled = results.filter((r) => r.status === "filled").length;
    console.log(`✅ Prepared ${filled}/${validFields.length} fields with alternatives`);

    return {
      success: filled > 0,
      fields: results,
      summary: {
        total: validFields.length,
        filled,
        missing: validFields.length - filled,
        fieldsWithAlternatives: results.filter((r) => r.alternatives.length > 0)
          .length,
      },
    };
  } catch (error) {
    console.error("❌ Error in intelligent auto-fill with selection:", error);
    return {
      success: false,
      fields: [],
      error: error.message,
    };
  }
}

/**
 * User selects a specific variant
 * Track this selection for learning
 */
export async function userSelectsFieldVariant(
  userId,
  fieldName,
  selectedValue,
  selectedSource
) {
  try {
    console.log(
      `✍️ User selected: "${fieldName}" = "${selectedValue}" from ${selectedSource}`
    );

    // Track this user's selection for learning
    await trackFieldUsage(userId, fieldName, selectedValue, "user_selection", {
      source: selectedSource,
      timestamp: new Date(),
    });

    console.log(`✅ Selection tracked for learning`);

    return {
      success: true,
      message: "User selection recorded",
      fieldName,
      selectedValue,
      selectedSource,
    };
  } catch (error) {
    console.error("❌ Error tracking user selection:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get summary of available sources for all fields in form
 * Shows user which documents contribute to the form
 */
export async function getFormSourceSummary(userId, formFields) {
  try {
    console.log(`📊 Getting source summary for form...`);

    const sourceCounts = {};
    const fieldsBySource = {};

    for (const fieldName of formFields) {
      const variants = await getFieldVariantsFromAllSources(userId, fieldName);

      for (const source of Object.keys(variants)) {
        sourceCounts[source] = (sourceCounts[source] || 0) + 1;
        if (!fieldsBySource[source]) fieldsBySource[source] = [];
        fieldsBySource[source].push(fieldName);
      }
    }

    console.log(`✅ Form uses data from ${Object.keys(sourceCounts).length} sources`);

    return {
      sources: Object.keys(sourceCounts),
      fieldsBySource,
      sourceContribution: {
        AADHAAR: sourceCounts.AADHAAR || 0,
        PAN: sourceCounts.PAN || 0,
        PASSPORT: sourceCounts.PASSPORT || 0,
        TENTH: sourceCounts.TENTH || 0,
        INTER: sourceCounts.INTER || 0,
        DEGREE: sourceCounts.DEGREE || 0,
      },
    };
  } catch (error) {
    console.error("❌ Error getting source summary:", error);
    return {
      sources: [],
      error: error.message,
    };
  }
}

export default {
  getFieldVariantsFromAllSources,
  getFieldWithAlternatives,
  intelligentAutoFillWithSelection,
  userSelectsFieldVariant,
  getFormSourceSummary,
};
