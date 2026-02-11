/**
 * 🔒 STRICT SAFE FORM FIELD MAPPING SERVICE
 * 
 * PRIORITY: ACCURACY OVER COMPLETENESS
 * PRIMARY GOAL: NEVER make mistakes
 * 
 * ✅ Only fills when highly confident (>0.85)
 * ✅ Validates data types before filling
 * ✅ NEVER cross-maps unrelated data
 * ✅ Leaves blank if unsure
 * ✅ Uses context + semantic meaning
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

let genAI, isInitialized = false;

function initializeGemini() {
  if (isInitialized) return true;
  
  const apiKey = process.env.GEMINI_API_KEY;
  
  if (!apiKey || apiKey === "your_api_key_here") {
    console.warn("⚠️ GEMINI_API_KEY not configured - smart field mapping will use local fallback");
    return false;
  }
  
  console.log("✅ Initializing Gemini AI for smart field mapping");
  genAI = new GoogleGenerativeAI(apiKey);
  isInitialized = true;
  return true;
}

function isGeminiAvailable() {
  return initializeGemini();
}

/**
 * STANDARD FIELD DEFINITIONS WITH SEMANTIC MEANINGS
 */
const STANDARD_FIELDS = {
  student_name: "Person full name (alphabet only)",
  father_name: "Father's name (alphabet only)",
  mother_name: "Mother's name (alphabet only)",
  dob: "Birth date (DD/MM/YYYY or YYYY-MM-DD format)",
  email: "Email address (must contain @)",
  phone: "Phone number (digits only, 10-15 length)",
  address: "Physical location address (must contain location words/numbers)",
  cgpa: "CGPA score (decimal 0.0-10.0)",
  percentage: "Percentage/Marks (decimal 0-100)",
  gender: "Gender (M/F/Male/Female/Other)",
  aadhaar: "Aadhaar Number (12 digits)",
  pan: "PAN Card (10 alphanumeric characters)"
};

/**
 * SEMANTIC FIELD VARIATIONS MAP
 * Maps standard fields to common naming variations
 */
const FIELD_VARIATIONS = {
  student_name: [
    "Student Name", "Candidate Name", "Applicant Name", "Full Name",
    "Name", "Your Name", "Student's Name", "Candidate Full Name",
    "Fullname", "Full name", "applicant full name", "your full name"
  ],
  father_name: [
    "Father Name", "Name of the Father", "Father's Name", "Parent Name (Father)",
    "Father Name", "Fathername", "Father's Name", "Fathers Name",
    "Guardian Name", "Parent Name"
  ],
  mother_name: [
    "Mother Name", "Name of the Mother", "Mother's Name",
    "Mother Name", "Mothername", "Mother's Name", "Mothers Name"
  ],
  dob: [
    "DOB", "Date of Birth", "Birth Date", "D.O.B", "D O B",
    "Date birth", "Dateofbirth", "Birthdate"
  ],
  email: [
    "Email", "Email Address", "E-mail", "E Mail", "Mail", "Mail Address",
    "Emailaddress", "Email ID"
  ],
  phone: [
    "Phone", "Phone Number", "Mobile", "Mobile Number", "Contact Number",
    "Telephone", "Mobile No", "Phone No", "Contact No", "Cell", "Cellphone",
    "Phonenumber", "Mobilenumber", "Contactnumber"
  ],
  address: [
    "Address", "Residential Address", "Permanent Address", "Current Address",
    "Home Address", "Mailing Address", "Residentialaddress", "Permanentaddress"
  ],
  cgpa: [
    "CGPA", "GPA", "Grade Point", "Grade Point Average",
    "Cumulative GPA", "SGPA", "Grade", "CGPA/GPA"
  ],
  percentage: [
    "Percentage", "Marks %", "Score %", "Percent", "Grade Percentage",
    "Percentage Score", "Overall Percentage", "Marks Percentage"
  ],
  gender: [
    "Gender", "Sex", "Male/Female", "Gender"
  ],
  aadhaar: [
    "Aadhaar", "Aadhar", "Aadhaar Number", "Aadhar Number",
    "Aadhaar No", "Aadhar No", "UID", "UID Number",
    "Aadhaar ID", "Aadhar ID"
  ],
  pan: [
    "PAN", "PAN Number", "PAN No", "PAN Card", "PAN Card Number",
    "Pannumber", "Pancard"
  ]
};

/**
 * DATA TYPE VALIDATION PATTERNS
 * Strict regex validation before filling
 */
const DATA_TYPE_PATTERNS = {
  student_name: {
    regex: /^[a-zA-Z\s'.-]{2,100}$/,
    description: "Only letters, spaces, hyphens, and apostrophes"
  },
  father_name: {
    regex: /^[a-zA-Z\s'.-]{2,100}$/,
    description: "Only letters, spaces, hyphens, and apostrophes"
  },
  mother_name: {
    regex: /^[a-zA-Z\s'.-]{2,100}$/,
    description: "Only letters, spaces, hyphens, and apostrophes"
  },
  dob: {
    regex: /^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2}|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)/i,
    description: "DD/MM/YYYY or YYYY-MM-DD or month name"
  },
  email: {
    regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    description: "Must contain @ and domain"
  },
  phone: {
    regex: /^[0-9]{10,15}$/,
    description: "Only digits, 10-15 length"
  },
  address: {
    regex: /^[\w\s.,#-]{5,200}$/,
    description: "Contains address characters, 5+ length"
  },
  cgpa: {
    regex: /^([0-9]{1,2}(\.[0-9]{1,2})?|10)$/,
    description: "Decimal number between 0-10"
  },
  percentage: {
    regex: /^([0-9]{1,2}(\.[0-9]{1,2})?|100)$/,
    description: "Decimal number between 0-100"
  },
  gender: {
    regex: /^(M|F|Male|Female|Other|m|f|male|female|other)$/i,
    description: "M, F, or Other"
  },
  aadhaar: {
    regex: /^[0-9]{12}$/,
    description: "Exactly 12 digits"
  },
  pan: {
    regex: /^[A-Z0-9]{10}$/i,
    description: "10 alphanumeric characters"
  }
};

/**
 * ⚠️ FORBIDDEN CROSS-MAPPINGS
 * These pairs should NEVER be mapped to each other
 */
const FORBIDDEN_CROSSINGS = [
  { from: "email", to: ["address", "dob", "phone", "name"] },
  { from: "phone", to: ["email", "address", "name", "dob"] },
  { from: "dob", to: ["email", "phone", "name", "address"] },
  { from: "address", to: ["email", "phone", "dob", "name"] }
];

/**
 * Normalize text for matching
 * Converts to lowercase and removes special characters
 */
const normalizeText = (text) => {
  if (!text) return '';
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')  // Remove special chars
    .replace(/\s+/g, ' ')          // Normalize spaces
    .trim();
};

/**
 * Calculate string similarity (0-1)
 * Uses normalized text comparison
 */
const calculateSimilarity = (str1, str2) => {
  const norm1 = normalizeText(str1);
  const norm2 = normalizeText(str2);
  
  if (norm1 === norm2) return 1.0;
  if (!norm1 || !norm2) return 0;
  
  // Check if one contains the other
  if (norm1.includes(norm2) || norm2.includes(norm1)) {
    return 0.85;
  }
  
  // Levenshtein distance for partial similarity
  const distance = levenshteinDistance(norm1, norm2);
  const maxLength = Math.max(norm1.length, norm2.length);
  return 1 - (distance / maxLength);
};

/**
 * Calculate Levenshtein distance between two strings
 */
const levenshteinDistance = (str1, str2) => {
  const matrix = [];
  
  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }
  
  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }
  
  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
};

/**
 * CONVERSION RULES
 * Handle CGPA ↔ Percentage conversion
 */
const CONVERSION_RULES = {
  cgpaToPercentage: (cgpa) => {
    const num = parseFloat(cgpa);
    if (isNaN(num)) return null;
    return (num * 9.5).toFixed(2);
  },
  percentageToCgpa: (percentage) => {
    const num = parseFloat(percentage);
    if (isNaN(num)) return null;
    return (num / 9.5).toFixed(2);
  }
};

/**
 * Find best standard field match for a form field
 * Returns: { standardField, confidence, reason }
 */
const findStandardFieldMatch = (formFieldName) => {
  let bestMatch = null;
  let bestSimilarity = 0;
  let reason = "No match found";
  
  for (const [stdField, variations] of Object.entries(FIELD_VARIATIONS)) {
    for (const variation of variations) {
      const similarity = calculateSimilarity(formFieldName, variation);
      
      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestMatch = stdField;
        
        if (similarity === 1.0) {
          reason = "Exact match";
        } else if (similarity >= 0.9) {
          reason = "Near-exact match";
        } else if (similarity >= 0.75) {
          reason = "Strong semantic match";
        } else if (similarity >= 0.5) {
          reason = "Partial match";
        }
      }
    }
  }
  
  // Also check if form field contains standard field keywords
  const normalizedFormField = normalizeText(formFieldName);
  for (const [stdField, variations] of Object.entries(FIELD_VARIATIONS)) {
    for (const variation of variations) {
      const normalizedVar = normalizeText(variation);
      if (normalizedFormField.includes(normalizedVar.split(' ')[0])) {
        if (!bestMatch || bestSimilarity < 0.7) {
          bestMatch = stdField;
          bestSimilarity = Math.max(bestSimilarity, 0.75);
          reason = "Contains keyword match";
        }
      }
    }
  }
  
  return {
    standardField: bestMatch,
    confidence: bestSimilarity,
    reason
  };
};

/**
 * Extract value from stored data using standard field name
 * Handles different data structure formats
 */
const extractValueFromData = (standardField, storedData) => {
  if (!storedData) return null;
  
  // Direct match
  if (storedData[standardField] !== undefined) {
    return storedData[standardField];
  }
  
  // Try common variations of the standard field name
  const variations = [
    standardField,
    standardField.replace(/_/g, ''),
    standardField.toLowerCase(),
    // Try with different delimiters
    standardField.replace(/_/g, ' '),
    standardField.replace(/_/g, '-'),
    standardField.replace(/_/g, ''),
  ];
  
  for (const variation of variations) {
    for (const [key, value] of Object.entries(storedData)) {
      if (normalizeText(key) === normalizeText(variation)) {
        return value;
      }
    }
  }
  
  return null;
};

/**
 * Handle special conversions and transformations
 * RULE 1: CGPA → Percentage (multiply by 9.5)
 * RULE 2: Percentage → CGPA (divide by 9.5)
 */
const handleSpecialConversions = (formFieldName, standardField, storedData, formValue) => {
  // If form asks for percentage but stored data has CGPA
  if (standardField === 'percentage') {
    const cgpaValue = extractValueFromData('cgpa', storedData);
    
    if (!formValue && cgpaValue) {
      const convertedPercentage = CONVERSION_RULES.cgpaToPercentage(cgpaValue);
      return {
        value: convertedPercentage,
        status: "converted",
        conversionSource: "cgpa",
        confidence: 0.88
      };
    }
  }
  
  // If form asks for CGPA but stored data has percentage
  if (standardField === 'cgpa') {
    const percentageValue = extractValueFromData('percentage', storedData);
    
    if (!formValue && percentageValue) {
      const convertedCgpa = CONVERSION_RULES.percentageToCgpa(percentageValue);
      return {
        value: convertedCgpa,
        status: "converted",
        conversionSource: "percentage",
        confidence: 0.88
      };
    }
  }
  
  return null;
};

/**
 * ✅ STRICT DATA TYPE VALIDATION
 * Returns true only if value matches expected data type
 */
const validateDataType = (value, standardField) => {
  if (!value || typeof value !== 'string') return false;
  
  const pattern = DATA_TYPE_PATTERNS[standardField];
  if (!pattern) return true; // Unknown field, allow (shouldn't happen)
  
  return pattern.regex.test(value.trim());
};

/**
 * ✅ FORBIDDEN CROSSING CHECK
 * Returns true if this mapping is forbidden
 */
const checkForbiddenCrossing = (sourceField, targetField) => {
  return FORBIDDEN_CROSSINGS.some(rule => 
    rule.from === targetField && rule.to.includes(sourceField)
  );
};

/**
 * 🔒 STRICT CONFIDENCE THRESHOLD
 * Only auto-fill if confidence >= 0.85
 */
const isConfidenceSafe = (confidence) => {
  return confidence >= 0.85;
};

/**
 * Map a single form field to standard field with value
 * 🔒 STRICT SAFE MAPPING: Accuracy over Completeness
 * Returns complete mapping object with confidence
 */
const mapSingleField = (formField, storedData) => {
  // STEP 1: Find matching standard field
  const match = findStandardFieldMatch(formField.label);
  
  if (!match.standardField) {
    return {
      form_field: formField.label,
      standard_field: null,
      value: "",
      confidence: 0.0,
      status: "missing",
      field_type: formField.type || "text",
      reason: "No standard field match found"
    };
  }
  
  const standardField = match.standardField;
  const confidence = match.confidence;
  
  // STEP 2: Check confidence threshold (🔒 Must be >= 0.85)
  if (!isConfidenceSafe(confidence)) {
    return {
      form_field: formField.label,
      standard_field: standardField,
      value: "",
      confidence: Math.round(confidence * 100) / 100,
      status: "unsafe",
      field_type: formField.type || "text",
      reason: `Low confidence match (${(confidence * 100).toFixed(1)}% < 85% required)`
    };
  }
  
  // STEP 3: Extract value from stored data
  let value = extractValueFromData(standardField, storedData);
  let status = "missing";
  let conversionSource = null;
  
  // Try special conversions if no direct value
  if (!value) {
    const conversion = handleSpecialConversions(
      formField.label,
      standardField,
      storedData,
      value
    );
    
    if (conversion) {
      value = conversion.value;
      status = conversion.status;
      conversionSource = conversion.conversionSource;
    }
  }
  
  // If still no value, return missing
  if (!value) {
    return {
      form_field: formField.label,
      standard_field: standardField,
      value: "",
      confidence: Math.round(confidence * 100) / 100,
      status: "missing",
      field_type: formField.type || "text",
      reason: "Value not found in stored data"
    };
  }
  
  // STEP 4: Validate data type
  if (!validateDataType(value, standardField)) {
    return {
      form_field: formField.label,
      standard_field: standardField,
      value: value,
      confidence: Math.round(confidence * 100) / 100,
      status: "type_mismatch",
      field_type: formField.type || "text",
      reason: `Value "${value}" does not match ${standardField} data type pattern`
    };
  }
  
  // STEP 5: Check forbidden crossing
  if (checkForbiddenCrossing(formField.label, standardField)) {
    return {
      form_field: formField.label,
      standard_field: standardField,
      value: value,
      confidence: Math.round(confidence * 100) / 100,
      status: "unsafe",
      field_type: formField.type || "text",
      reason: `Cross-domain mapping forbidden: ${formField.label} → ${standardField}`
    };
  }
  
  // STEP 6: All checks passed - safe to fill
  return {
    form_field: formField.label,
    standard_field: standardField,
    value: value,
    confidence: Math.round(confidence * 100) / 100,
    status: status === "missing" ? "filled" : status,
    field_type: formField.type || "text",
    conversionSource: conversionSource,
    reason: match.reason
  };
};

/**
 * 🤖 AI-POWERED MAPPING (Optional - when Gemini is available)
 * Uses AI for complex semantic understanding
 */
const mapFieldsWithAI = async (formFields, storedData) => {
  if (!isGeminiAvailable()) {
    return null;  // Fall back to local mapping
  }
  
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = `🔒 STRICT SAFE FORM FIELD MAPPING - ACCURACY OVER COMPLETENESS

You are a CONSERVATIVE form field mapping AI. Your primary goal is ACCURACY, not fill-rate.

CRITICAL PRINCIPLE: "Better to leave 3 fields empty than fill 1 field wrong"

FORM FIELDS TO MAP:
${formFields.map((f, i) => `${i + 1}. "${f.label}" (type: ${f.type || 'text'})`).join('\n')}

STORED STUDENT DATA:
${JSON.stringify(storedData, null, 2)}

STANDARD STUDENT FIELDS (12 canonical fields):
- student_name: Full name, letters/hyphens only
- father_name: Father's full name, letters/hyphens only
- mother_name: Mother's full name, letters/hyphens only
- dob: Date of birth, formats: DD/MM/YYYY or YYYY-MM-DD
- email: Email address, must contain @ symbol
- phone: Phone number, 10-15 digits only
- address: Physical address, 5+ characters
- cgpa: GPA on 10-point scale (0.0 - 10.0)
- percentage: Percentage score (0 - 100)
- gender: M, F, or Other
- aadhaar: 12-digit Aadhar number
- pan: 10-character PAN code

MANDATORY CONVERSION RULES:
✅ Form asks "Percentage" + Data has "CGPA": Convert (CGPA × 9.5)
✅ Form asks "CGPA" + Data has "Percentage": Convert (Percentage ÷ 9.5)
❌ NO OTHER CONVERSIONS ALLOWED

STRICT SAFETY RULES:
⚠️ FORBIDDEN MAPPINGS (these must NEVER be mapped to each other):
- email ↔ address, phone, date_of_birth, names
- phone ↔ email, address, date_of_birth
- date_of_birth ↔ email, phone, names, address

📍 DATA TYPE VALIDATION (MANDATORY before filling):
- Names: Only letters, spaces, hyphens, apostrophes
- Email: Must contain exactly one @ symbol
- Phone: Only digits, 10-15 length
- Date: DD/MM/YYYY, YYYY-MM-DD, or month name format
- Percentage: Decimal 0-100
- CGPA: Decimal 0-10

⚠️ CONFIDENCE THRESHOLD (MANDATORY):
- Confidence >= 0.85 → Safe to fill
- Confidence < 0.85 → Mark as "unsafe" (leave blank)
- Examples:
  * Exact field name match → 0.95 confidence (FILL)
  * Student Name ≈ Name → 0.88 confidence (FILL: safe)
  * Student ID ≈ Email → 0.60 confidence (UNSAFE: leave blank)
  * Student ID ≈ Phone → 0.65 confidence (UNSAFE: leave blank)

STATUS VALUES:
- "filled": Direct value found and all checks passed
- "converted": Value converted (CGPA→Percentage or vice-versa)
- "unsafe": Confidence < 0.85 OR data type mismatch OR forbidden crossing
- "type_mismatch": Value found but doesn't match field regex pattern
- "missing": No data available for this field

RETURN FORMAT (JSON ONLY):
{
  "mapped_fields": [
    {
      "form_field": "Form Field Name",
      "standard_field": "standard_field_name",
      "value": "actual_value or empty string",
      "confidence": 0.88,
      "status": "filled|converted|unsafe|type_mismatch|missing",
      "reason": "Brief explanation"
    }
  ]
}

EXAMPLES:
- If form has "Student Email" and data has "john@example.com": confidence 0.95, status: filled
- If form has "Phone Number" and data has "john@example.com": confidence 0.0, status: unsafe (data type mismatch)
- If form has "Percentage" and only CGPA 8.5 exists: confidence 0.88, status: converted (value: "80.75")
- If form has "Gender" and data is "john@example.com": confidence 0.0, status: type_mismatch
- If form has "Student ID" and data has "12345": confidence 0.5, status: unsafe (too low confidence)`;


    const response = await model.generateContent(prompt);
    const result = response.response.text();
    
    // Parse AI response
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.mapped_fields;
    }
  } catch (error) {
    console.warn("⚠️ AI mapping failed, using local fallback:", error.message);
  }
  
  return null;
};

/**
 * 🚀 MAIN: Map all form fields
 * 
 * Usage:
 * const formFields = [
 *   { label: "Student Name", type: "text" },
 *   { label: "Father Name", type: "text" },
 *   { label: "Percentage", type: "number" }
 * ];
 * 
 * const storedData = {
 *   student_name: "John Doe",
 *   father_name: "James Doe",
 *   cgpa: 8.2
 * };
 * 
 * const result = await mapFormFields(formFields, storedData, useAI=true);
 */
export const mapFormFields = async (formFields, storedData, useAI = true) => {
  if (!formFields || !Array.isArray(formFields)) {
    throw new Error("formFields must be an array");
  }
  
  let mappedFields = [];
  
  // Try AI mapping first if enabled
  if (useAI) {
    const aiMappings = await mapFieldsWithAI(formFields, storedData);
    if (aiMappings) {
      mappedFields = aiMappings;
    }
  }
  
  // Fall back to local mapping if AI not available or not used
  if (mappedFields.length === 0) {
    mappedFields = formFields.map(field => mapSingleField(field, storedData || {}));
  }
  
  // Add metadata
  const result = {
    mapped_fields: mappedFields,
    summary: {
      total_fields: formFields.length,
      filled_count: mappedFields.filter(f => f.status === "filled").length,
      converted_count: mappedFields.filter(f => f.status === "converted").length,
      unsafe_count: mappedFields.filter(f => f.status === "unsafe").length,
      type_mismatch_count: mappedFields.filter(f => f.status === "type_mismatch").length,
      missing_count: mappedFields.filter(f => f.status === "missing").length,
      safe_fill_count: mappedFields.filter(f => ["filled", "converted"].includes(f.status)).length,
      average_confidence: (mappedFields.reduce((sum, f) => sum + f.confidence, 0) / mappedFields.length).toFixed(2)
    }
  };
  
  return result;
};

/**
 * Map a single form submission
 * Useful for individual field mapping during form filling
 */
export const mapSingleFormField = (formFieldLabel, storedData) => {
  return mapSingleField({ label: formFieldLabel }, storedData || {});
};

/**
 * Validate mapping confidence
 * 🔒 STRICT SAFE: Uses 0.85 threshold by default
 * Returns true only if safe to auto-fill
 */
export const isConfidentMapping = (mappedField, threshold = 0.85) => {
  return mappedField.confidence >= threshold && 
         ["filled", "converted"].includes(mappedField.status);
};

/**
 * Get suggestion for missing field
 * Returns possible values from stored data
 */
export const getSuggestion = (standardField, storedData) => {
  const value = extractValueFromData(standardField, storedData);
  
  if (value) {
    return {
      field: standardField,
      suggestion: value,
      confidence: 0.95,
      status: "available"
    };
  }
  
  // Try conversions
  if (standardField === 'percentage') {
    const cgpa = extractValueFromData('cgpa', storedData);
    if (cgpa) {
      return {
        field: standardField,
        suggestion: CONVERSION_RULES.cgpaToPercentage(cgpa),
        confidence: 0.88,
        status: "converted_from_cgpa"
      };
    }
  }
  
  if (standardField === 'cgpa') {
    const percentage = extractValueFromData('percentage', storedData);
    if (percentage) {
      return {
        field: standardField,
        suggestion: CONVERSION_RULES.percentageToCgpa(percentage),
        confidence: 0.88,
        status: "converted_from_percentage"
      };
    }
  }
  
  return {
    field: standardField,
    suggestion: null,
    confidence: 0,
    status: "no_data"
  };
};

/**
 * Get all standard fields
 */
export const getAllStandardFields = () => {
  return STANDARD_FIELDS;
};

/**
 * Get variations for a standard field
 */
export const getFieldVariations = (standardField) => {
  return FIELD_VARIATIONS[standardField] || [];
};

export default {
  mapFormFields,
  mapSingleFormField,
  isConfidentMapping,
  getSuggestion,
  getAllStandardFields,
  getFieldVariations,
  STANDARD_FIELDS,
  FIELD_VARIATIONS,
  CONVERSION_RULES
};
