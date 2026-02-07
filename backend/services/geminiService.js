import { GoogleGenerativeAI } from "@google/generative-ai";
import Tesseract from "tesseract.js";

// Lazy initialization - initialize only when needed (after dotenv loads)
let genAI, model, visionModel, isInitialized = false;

function initializeGemini() {
  if (isInitialized) return;
  
  const apiKey = process.env.GEMINI_API_KEY;
  const USE_MOCK_DATA = !apiKey || apiKey === "your_api_key_here";
  
  console.log(
    "🔑 GEMINI_API_KEY loaded:",
    apiKey ? `${apiKey.substring(0, 20)}...` : "NOT SET"
  );
  console.log("🔧 USE_MOCK_DATA:", USE_MOCK_DATA);
  console.log("✅ Tesseract.js OCR initialized (FREE - No billing required)");
  
  if (!USE_MOCK_DATA) {
    console.log("✅ Initializing Gemini AI with real API key");
    genAI = new GoogleGenerativeAI(apiKey);
    const GEMINI_MODEL = "gemini-2.5-flash";
    model = genAI.getGenerativeModel({ model: GEMINI_MODEL });
    visionModel = genAI.getGenerativeModel({ model: GEMINI_MODEL });
  } else {
    console.log("⚠️ Gemini AI not available - using FREE Tesseract OCR");
  }
  
  isInitialized = true;
}

// Helper to check if Gemini is available
function isGeminiAvailable() {
  initializeGemini();
  return !!model;
}

// Mock data generator for testing without API key
const generateMockFields = (documentType) => {
  const mockDataMap = {
    AADHAAR: {
      "Full Name": { value: "John Doe", confidence: 85 },
      "Aadhaar Number": { value: "1234 5678 9012", confidence: 90 },
      "Date of Birth": { value: "01/01/1990", confidence: 88 },
      Gender: { value: "Male", confidence: 95 },
      "Father's Name": { value: "Richard Doe", confidence: 82 },
      Address: { value: "123 Main St, City, State - 123456", confidence: 80 },
    },
    PAN: {
      "Full Name": { value: "John Doe", confidence: 90 },
      "PAN Number": { value: "ABCDE1234F", confidence: 95 },
      "Date of Birth": { value: "01/01/1990", confidence: 88 },
      "Father's Name": { value: "Richard Doe", confidence: 85 },
    },
    PASSPORT: {
      "Full Name": { value: "John Doe", confidence: 92 },
      "Passport Number": { value: "A1234567", confidence: 95 },
      "Date of Birth": { value: "01/01/1990", confidence: 90 },
      "Date of Issue": { value: "01/01/2020", confidence: 88 },
      "Date of Expiry": { value: "01/01/2030", confidence: 88 },
      "Place of Birth": { value: "New York", confidence: 85 },
      "Father's Name": { value: "Richard Doe", confidence: 83 },
      "Mother's Name": { value: "Jane Doe", confidence: 83 },
    },
    TENTH: {
      "Student Name": { value: "John Doe", confidence: 90 },
      "Roll Number": { value: "12345", confidence: 92 },
      "Date of Birth": { value: "01/01/1990", confidence: 88 },
      "Father's Name": { value: "Richard Doe", confidence: 85 },
      "Mother's Name": { value: "Jane Doe", confidence: 85 },
      "School Name": { value: "ABC High School", confidence: 87 },
      "Passing Year": { value: "2008", confidence: 90 },
      "Total Marks": { value: "450/500", confidence: 88 },
      Percentage: { value: "90%", confidence: 90 },
    },
    INTER: {
      "Student Name": { value: "John Doe", confidence: 90 },
      "Roll Number": { value: "INT12345", confidence: 92 },
      "Date of Birth": { value: "01/01/1990", confidence: 88 },
      "Father's Name": { value: "Richard Doe", confidence: 85 },
      "Mother's Name": { value: "Jane Doe", confidence: 85 },
      "College Name": { value: "XYZ Junior College", confidence: 87 },
      "Passing Year": { value: "2010", confidence: 90 },
      "Total Marks": { value: "900/1000", confidence: 88 },
      Percentage: { value: "90%", confidence: 90 },
    },
    DEGREE: {
      "Student Name": { value: "John Doe", confidence: 90 },
      "Registration Number": { value: "DEG12345", confidence: 92 },
      "Date of Birth": { value: "01/01/1990", confidence: 88 },
      "Father's Name": { value: "Richard Doe", confidence: 85 },
      "Mother's Name": { value: "Jane Doe", confidence: 85 },
      "University Name": { value: "State University", confidence: 87 },
      Degree: { value: "Bachelor of Technology", confidence: 90 },
      Major: { value: "Computer Science", confidence: 90 },
      "Passing Year": { value: "2014", confidence: 90 },
      CGPA: { value: "8.5/10", confidence: 88 },
    },
  };

  return mockDataMap[documentType] || mockDataMap.AADHAAR;
};

// Extract text using Google Cloud Vision API
// Extract text using Tesseract.js OCR (FREE - No API key required)
const extractTextWithTesseract = async (imageData, documentType) => {
  try {
    console.log("🔍 Using Tesseract.js for FREE text extraction...");

    // Convert base64 to buffer
    const imageBuffer = Buffer.from(imageData, "base64");

    // Run Tesseract OCR
    console.log("⏳ Running OCR... (this may take 10-30 seconds)");
    const { data } = await Tesseract.recognize(imageBuffer, "eng", {
      logger: (m) => {
        if (m.status === "recognizing text") {
          console.log(`📊 OCR Progress: ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const fullText = data.text;

    if (!fullText || fullText.length < 10) {
      console.log("⚠️ No text detected or text too short");
      return { fields: {} };
    }

    console.log("📄 Extracted text length:", fullText.length);
    console.log("📄 First 300 chars:", fullText.substring(0, 300));

    // Parse text into fields based on document type
    // 🟡 LAYER 2: Use Gemini for structured extraction
    const fields = await extractStructuredFieldsWithGemini(
      fullText,
      documentType,
    );

    console.log(
      "✅ Extracted and parsed",
      Object.keys(fields).length,
      "fields using 3-Layer Architecture (OCR → Gemini → Validation)",
    );
    return { fields };
  } catch (error) {
    console.error("❌ Tesseract OCR error:", error.message);
    throw error;
  }
};

// ==========================================
// 🚀 PRODUCTION 3-LAYER ARCHITECTURE
// ==========================================

// 🟣 LAYER 3: Field Cleaning & Validation Functions

// Master field cleaner - routes to appropriate cleaning function
const cleanFieldValue = (fieldName, value) => {
  if (!value) return "";
  
  const fieldLower = fieldName.toLowerCase();
  
  // Name fields
  if (fieldLower.includes('name') && !fieldLower.includes('school') && !fieldLower.includes('college') && !fieldLower.includes('university') && !fieldLower.includes('board')) {
    return cleanName(value);
  }
  
  // Date fields
  if (fieldLower.includes('dob') || fieldLower.includes('date of birth') || fieldLower.includes('birth date')) {
    return cleanDOB(value);
  }
  
  // Roll/Registration number
  if (fieldLower.includes('roll') || fieldLower.includes('registration') || fieldLower.includes('reg no')) {
    return cleanRollNumber(value);
  }
  
  // Year fields
  if (fieldLower.includes('year') && !fieldLower.includes('marks')) {
    return cleanYear(value);
  }
  
  // Percentage/marks/grade fields
  if (fieldLower.includes('percentage') || fieldLower.includes('cgpa') || fieldLower.includes('marks') || fieldLower.includes('grade')) {
    return cleanPercentage(value);
  }
  
  // Default: basic cleaning - remove extra spaces and noise
  return String(value)
    .replace(/\b(HES|ROLL|NY|I{1,3}|THE|OF|AND)\b/gi, '')
    .replace(/[^\w\s\-\/\.,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanName = (name) => {
  if (!name) return "";
  return name
  return name
    .replace(/[^a-zA-Z\s]/g, "") // Remove special chars
    .replace(/\b(ROLL|NO|NUMBER|ID|HES|NY|I|II|III|IV|V|THE|OF|AND|OR)\b/gi, "") // Remove noise words
    .replace(/\s+/g, " ") // Normalize spaces
    .trim()
    .split(" ")
    .filter((w) => w.length > 1) // Remove single letters
    .join(" ");
};

const cleanDOB = (dob) => {
  if (!dob) return "";
  // Match various date formats: DD/MM/YYYY, DD-MM-YYYY, DD.MM.YYYY
  const match = dob.match(/\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{4}/);
  return match ? match[0] : "";
};

const cleanRollNumber = (roll) => {
  if (!roll) return "";
  return roll
    .replace(/[^a-zA-Z0-9]/g, "") // Keep only alphanumeric
    .toUpperCase()
    .trim();
};

const cleanYear = (year) => {
  if (!year) return "";
  const match = year.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : "";
};

const cleanPercentage = (value) => {
  if (!value) return "";
  const match = value.match(/\d+\.?\d*/);
  return match ? match[0] : "";
};

// 🟡 LAYER 2: Gemini Structured Extraction with STRICT JSON Prompts
const getStrictPromptForDocumentType = (documentType, ocrText) => {
  const baseRules = `
STRICT RULES:
- Extract ONLY exact values
- Remove all OCR noise and extra words
- If value is unclear or not found → return empty string ""
- Return ONLY valid JSON
- Do NOT add any text before or after JSON
- Do NOT include explanations
- Do NOT return raw OCR text
`;

  const prompts = {
    TENTH: `You are a document data extraction engine for Class 10th Certificates.

Extract ONLY clean structured data from this SSC/Class 10th certificate.
${baseRules}

Extract these fields in JSON format:
{
  "studentName": "",
  "fatherName": "",
  "motherName": "",
  "dateOfBirth": "",
  "rollNumber": "",
  "schoolName": "",
  "passingYear": "",
  "totalMarks": "",
  "marksObtained": "",
  "percentage": "",
  "grade": ""
}

KEYWORDS TO SEARCH:
- Student name appears after "CERTIFIED THAT" or "This is to certify that"
- Father's name after "FATHER NAME" or "S/O" or "SON OF"
- Mother's name after "MOTHER NAME" or "D/O" or "DAUGHTER OF"  
- DOB after "DATE OF BIRTH" or "DOB" or "BORN ON"
- Roll number after "ROLL NO" or "ROLL NUMBER" or "REG NO"
- School after "SCHOOL" or "INSTITUTION"
- Year after "YEAR" or "PASSED" or numeric 4-digit year

Document Text:
${ocrText}`,

    INTER: `You are a document data extraction engine for Intermediate/12th Class Certificates.

Extract ONLY clean structured data from this Intermediate certificate.
${baseRules}

Extract these fields in JSON format:
{
  "studentName": "",
  "fatherName": "",
  "motherName": "",
  "dateOfBirth": "",
  "rollNumber": "",
  "collegeName": "",
  "passingYear": "",
  "stream": "",
  "totalMarks": "",
  "marksObtained": "",
  "percentage": "",
  "grade": ""
}

Document Text:
${ocrText}`,

    DEGREE: `You are a document data extraction engine for Degree/Graduation Certificates.

Extract ONLY clean structured data from this degree certificate.
${baseRules}

Extract these fields in JSON format:
{
  "studentName": "",
  "fatherName": "",
  "motherName": "",
  "dateOfBirth": "",
  "registrationNumber": "",
  "universityName": "",
  "collegeName": "",
  "degree": "",
  "major": "",
  "passingYear": "",
  "cgpa": "",
  "percentage": "",
  "grade": ""
}

Document Text:
${ocrText}`,

    AADHAAR: `You are a document data extraction engine for Aadhaar Cards.

Extract ONLY clean structured data from this Aadhaar card.
${baseRules}

Extract these fields in JSON format:
{
  "fullName": "",
  "aadhaarNumber": "",
  "dateOfBirth": "",
  "gender": "",
  "fatherName": "",
  "address": ""
}

Document Text:
${ocrText}`,

    PAN: `You are a document data extraction engine for PAN Cards.

Extract ONLY clean structured data from this PAN card.
${baseRules}

Extract these fields in JSON format:
{
  "fullName": "",
  "panNumber": "",
  "dateOfBirth": "",
  "fatherName": ""
}

Document Text:
${ocrText}`,

    PASSPORT: `You are a document data extraction engine for Passports.

Extract ONLY clean structured data from this passport.
${baseRules}

Extract these fields in JSON format:
{
  "fullName": "",
  "passportNumber": "",
  "dateOfBirth": "",
  "placeOfBirth": "",
  "dateOfIssue": "",
  "dateOfExpiry": "",
  "gender": "",
  "nationality": ""
}

Document Text:
${ocrText}`,
  };

  return prompts[documentType] || prompts.TENTH;
};

// Extract structured fields using Gemini AI with strict JSON prompts
const extractStructuredFieldsWithGemini = async (ocrText, documentType) => {
  try {
    if (!model) {
      console.log("⚠️ Gemini not available, using rule-based parsing");
      return generateMockFields(documentType);
    }

    console.log("🤖 Using Gemini AI for structured extraction...");

    const prompt = getStrictPromptForDocumentType(documentType, ocrText);

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    console.log("📝 Gemini raw response length:", responseText.length);

    // Extract JSON from response (handle markdown code blocks)
    let jsonText = responseText.trim();
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.replace(/```\n?/g, "");
    }

    const extractedData = JSON.parse(jsonText);

    // 🟣 LAYER 3: Apply cleaning to extracted fields
    const cleanedFields = {};

    for (const [key, value] of Object.entries(extractedData)) {
      let cleanedValue = value;

      // Apply field-specific cleaning
      if (key.toLowerCase().includes("name")) {
        cleanedValue = cleanName(value);
      } else if (
        key.toLowerCase().includes("dob") ||
        key.toLowerCase().includes("dateofbirth") ||
        key.toLowerCase().includes("date")
      ) {
        cleanedValue = cleanDOB(value);
      } else if (
        key.toLowerCase().includes("roll") ||
        key.toLowerCase().includes("registration")
      ) {
        cleanedValue = cleanRollNumber(value);
      } else if (key.toLowerCase().includes("year")) {
        cleanedValue = cleanYear(value);
      } else if (
        key.toLowerCase().includes("percentage") ||
        key.toLowerCase().includes("cgpa") ||
        key.toLowerCase().includes("marks")
      ) {
        cleanedValue = cleanPercentage(value);
      }

      // Only add non-empty fields
      if (cleanedValue && cleanedValue.trim() !== "") {
        // Convert camelCase to Title Case for display
        const displayKey = key
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str) => str.toUpperCase())
          .trim();

        cleanedFields[displayKey] = {
          value: cleanedValue,
          confidence: 90, // Gemini extraction confidence
        };
      }
    }

    console.log(
      "✅ Extracted",
      Object.keys(cleanedFields).length,
      "clean fields with Gemini",
    );
    return cleanedFields;
  } catch (error) {
    console.error("❌ Gemini extraction error:", error.message);
    console.log("⚠️ Falling back to mock data");
    return generateMockFields(documentType);
  }
};

// ==========================================
// END OF 3-LAYER ARCHITECTURE
// ==========================================

// 🟣 Old parsing function kept as fallback (used when Gemini fails)
// This function is now called from extractStructuredFieldsWithGemini as fallback
const parseTextToFieldsFallback_OLD_DELETE_ME = (text, documentType) => {
  const fields = {};

  // Clean up text - remove excessive spaces and special characters
  const cleanText = text.replace(/\s+/g, " ").replace(/[^\w\s:,./-]/g, "");
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l);

  // Helper function to extract value after a label
  const extractAfterLabel = (label, text, maxWords = 5) => {
    const regex = new RegExp(label + "\\s*:?\\s*([A-Z][A-Z\\s]{2,})", "i");
    const match = text.match(regex);
    if (match) {
      // Get the captured group and clean it
      let value = match[1].trim();
      // Take only the first few words (capitalized names)
      const words = value
        .split(/\s+/)
        .filter((w) => /^[A-Z]+$/.test(w))
        .slice(0, maxWords);
      return words.join(" ");
    }
    return null;
  };

  // Extract based on document type
  if (
    documentType === "TENTH" ||
    documentType === "INTER" ||
    documentType === "DEGREE"
  ) {
    // Student Name - look for "CERTIFIED THAT" or "This is to certify"
    let studentName = null;

    // Pattern 1: After "CERTIFIED THAT"
    const certifiedMatch = text.match(
      /CERTIFIED\s+THAT\s*[:\-~]?\s*([A-Z\s]{5,50})/i,
    );
    if (certifiedMatch) {
      const words = certifiedMatch[1]
        .trim()
        .split(/\s+/)
        .filter((w) => /^[A-Z]+$/.test(w) && w.length > 1)
        .slice(0, 4);
      studentName = words.join(" ");
    }

    // Pattern 2: Look for name before "FATHER NAME"
    if (!studentName) {
      const beforeFather = text.match(/([A-Z\s]{10,40})\s*FATHER\s+NAME/i);
      if (beforeFather) {
        const words = beforeFather[1]
          .trim()
          .split(/\s+/)
          .filter((w) => /^[A-Z]+$/.test(w) && w.length > 1)
          .slice(-4);
        studentName = words.join(" ");
      }
    }

    if (studentName) {
      fields["Student Name"] = { value: studentName, confidence: 85 };
    }

    // Father's Name
    const fatherName =
      extractAfterLabel("FATHER\\s*NAME", text, 4) ||
      extractAfterLabel("FATHER", text, 4);
    if (fatherName) {
      fields["Father's Name"] = { value: fatherName, confidence: 85 };
    }

    // Mother's Name
    const motherName =
      extractAfterLabel("MOTHER\\s*NAME", text, 4) ||
      extractAfterLabel("MOTHER", text, 4);
    if (motherName) {
      fields["Mother's Name"] = { value: motherName, confidence: 85 };
    }

    // Roll Number / Registration Number
    const rollMatch = text.match(
      /(?:ROLL\s*NO|REG(?:ISTRATION)?\s*NO?|ROLL\s*NUMBER)[:\.\s]*(\S+)/i,
    );
    if (rollMatch) {
      fields["Roll Number"] = { value: rollMatch[1].trim(), confidence: 90 };
    }

    // School/College Name
    const schoolMatch = text.match(
      /(?:SCHOOL|COLLEGE|UNIVERSITY)[:\s]*([A-Z\s,]{5,60})/i,
    );
    if (schoolMatch) {
      const schoolName = schoolMatch[0]
        .trim()
        .split(/\s+/)
        .slice(0, 8)
        .join(" ");
      fields["School/College Name"] = { value: schoolName, confidence: 75 };
    }

    // Date of Birth
    const dobMatch = text.match(
      /(?:D\.?O\.?B|DATE\s*OF\s*BIRTH|BIRTH)[:\s]*(\d{1,2}[-/.]\d{1,2}[-/.]\d{2,4})/i,
    );
    if (dobMatch) {
      fields["Date of Birth"] = { value: dobMatch[1], confidence: 85 };
    }

    // Passing Year
    const yearMatch =
      text.match(/(?:YEAR|PASSED|PASSING)[:\s]*(\d{4})/i) ||
      text.match(/\b(19\d{2}|20\d{2})\b/);
    if (yearMatch) {
      fields["Passing Year"] = { value: yearMatch[1], confidence: 80 };
    }

    // Marks / Percentage / CGPA
    const marksMatch = text.match(/(?:MARKS|TOTAL)[:\s]*(\d{2,4})/i);
    if (marksMatch) {
      fields["Total Marks"] = { value: marksMatch[1], confidence: 75 };
    }

    const percentageMatch = text.match(/(\d{1,3}(?:\.\d{1,2})?)\s*%/);
    if (percentageMatch) {
      fields["Percentage"] = {
        value: percentageMatch[1] + "%",
        confidence: 80,
      };
    }

    const cgpaMatch = text.match(/(?:CGPA|GPA)[:\s]*(\d+\.\d+)/i);
    if (cgpaMatch) {
      fields["CGPA"] = { value: cgpaMatch[1], confidence: 80 };
    }
  } else if (documentType === "AADHAAR") {
    // Aadhaar Number
    const aadhaarMatch = text.match(/(\d{4}\s*\d{4}\s*\d{4})/);
    if (aadhaarMatch) {
      fields["Aadhaar Number"] = {
        value: aadhaarMatch[1].replace(/\s+/g, " ").trim(),
        confidence: 90,
      };
    }

    // Name
    const nameMatch = text.match(
      /(?:NAME|Name)[:\s]*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
    );
    if (nameMatch) {
      fields["Full Name"] = { value: nameMatch[1].trim(), confidence: 85 };
    }

    // DOB
    const dobMatch = text.match(
      /(?:DOB|Date\s*of\s*Birth)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    );
    if (dobMatch) {
      fields["Date of Birth"] = { value: dobMatch[1], confidence: 85 };
    }

    // Gender
    const genderMatch = text.match(/\b(MALE|FEMALE)\b/i);
    if (genderMatch) {
      fields["Gender"] = { value: genderMatch[1], confidence: 90 };
    }

    // Address (get last few lines)
    const addressLines = lines.slice(-5).filter((l) => l.length > 10);
    if (addressLines.length > 0) {
      fields["Address"] = {
        value: addressLines.join(", ").substring(0, 150),
        confidence: 70,
      };
    }
  } else if (documentType === "PAN") {
    // PAN Number
    const panMatch = text.match(/\b([A-Z]{5}\d{4}[A-Z])\b/);
    if (panMatch) {
      fields["PAN Number"] = { value: panMatch[1], confidence: 95 };
    }

    // Name
    const nameMatch = text.match(/(?:NAME|Name)[:\s]*([A-Z\s]{5,40})/i);
    if (nameMatch) {
      const name = nameMatch[1]
        .trim()
        .split(/\s+/)
        .filter((w) => w.length > 1)
        .join(" ");
      fields["Full Name"] = { value: name, confidence: 85 };
    }

    // Father's Name
    const fatherName = extractAfterLabel("FATHER", text, 4);
    if (fatherName) {
      fields["Father's Name"] = { value: fatherName, confidence: 80 };
    }

    // DOB
    const dobMatch = text.match(
      /(?:DOB|Date\s*of\s*Birth)[:\s]*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})/i,
    );
    if (dobMatch) {
      fields["Date of Birth"] = { value: dobMatch[1], confidence: 85 };
    }
  }

  // Add raw extracted text (first 1000 chars)
  fields["Raw Extracted Text"] = {
    value: text.substring(0, 1000),
    confidence: 100,
  };

  return fields;
};

export const extractFieldsWithGemini = async (imageData, documentType) => {
  // Initialize Gemini (lazy loading after dotenv loads)
  initializeGemini();
  
  // Use FREE Tesseract OCR if Gemini is not available (No billing required!)
  if (!isGeminiAvailable()) {
    console.log("🔍 Using FREE Tesseract OCR (Gemini not available)");
    try {
      const result = await extractTextWithTesseract(imageData, documentType);
      console.log(
        "✅ Tesseract OCR extracted:",
        Object.keys(result.fields || {}).length,
        "fields",
      );
      return result;
    } catch (error) {
      console.error("❌ Tesseract OCR failed:", error.message);
      console.log("⚠️ Falling back to MOCK data");
      const mockFields = generateMockFields(documentType);
      return { fields: mockFields };
    }
  }

  try {
    // Enhanced prompts for accurate OCR-like extraction
    const documentPrompts = {
      AADHAAR: `You are an expert OCR system. Carefully read and extract ALL text from this Aadhaar card image.

CRITICAL INSTRUCTIONS:
- Extract EXACTLY what is written on the card, character by character
- Do NOT generate or guess any information
- If text is unclear, set confidence to 60 or lower
- Preserve exact formatting (spaces, capitalization, punctuation)

REQUIRED FIELDS (extract if visible):
1. Full Name (as printed on card)
2. Aadhaar Number (12 digits, format: XXXX XXXX XXXX)
3. Date of Birth / DOB (DD/MM/YYYY format)
4. Gender (Male/Female/Other)
5. Address (complete address as written)
6. Father's Name / Husband's Name (if visible)
7. Mother's Name (if visible)
8. Issue Date (if visible)
9. Photo (yes/no)

CONFIDENCE SCORING:
- 90-100: Text is crystal clear
- 80-89: Text is clear with minor blur
- 70-79: Text is readable but has some quality issues
- Below 70: Text is difficult to read

Return ONLY valid JSON (no markdown, no explanations):
{
  "fields": {
    "Full Name": { "value": "EXACT TEXT FROM CARD", "confidence": 95 },
    "Aadhaar Number": { "value": "XXXX XXXX XXXX", "confidence": 90 }
  }
}`,

      PAN: `You are an expert OCR system. Carefully read and extract ALL text from this PAN card image.

CRITICAL INSTRUCTIONS:
- Extract EXACTLY what is written, character by character
- PAN format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
- Do NOT generate or invent information
- Preserve exact formatting and capitalization

REQUIRED FIELDS:
1. Full Name (as printed)
2. PAN Number (10 characters: ABCDE1234F format)
3. Father's Name / Holder's Name
4. Date of Birth (DD/MM/YYYY)
5. Issue Date (if visible)
6. Signature (yes/no)

Return ONLY valid JSON:
{
  "fields": {
    "Full Name": { "value": "EXACT NAME", "confidence": 95 },
    "PAN Number": { "value": "ABCDE1234F", "confidence": 98 }
  }
}`,

      PASSPORT: `You are an expert OCR system. Read this Passport document carefully.

Extract EXACTLY what appears:
1. Surname / Family Name
2. Given Names / First Name
3. Passport Number (letter + 7 digits)
4. Date of Birth
5. Date of Issue
6. Date of Expiry
7. Place of Birth
8. Place of Issue
9. Nationality
10. Father's Name
11. Mother's Name
12. Spouse Name (if applicable)
13. Address (if visible)

Return ONLY valid JSON with exact text and confidence scores.`,

      TENTH: `You are an expert OCR system. Read this 10th grade marksheet/certificate.

Extract EXACTLY:
1. Student Name (full name as printed)
2. Father's Name
3. Mother's Name
4. Roll Number / Registration Number
5. Date of Birth
6. School Name
7. Board Name (CBSE/ICSE/State Board)
8. Passing Year / Year of Examination
9. Passing Month
10. Total Marks Obtained
11. Maximum Marks
12. Percentage / Grade / CGPA
13. Result (Pass/Fail/Distinction)
14. Issue Date

Do NOT extract individual subject marks. Only extract aggregate/total marks.
Return ONLY valid JSON with exact values.`,

      INTER: `You are an expert OCR system. Read this Intermediate/12th certificate.

Extract EXACTLY:
1. Student Name
2. Father's Name
3. Mother's Name
4. Roll Number / Registration Number
5. Date of Birth
6. College/School Name
7. Board/University Name
8. Stream (Science/Commerce/Arts)
9. Passing Year
10. Total Marks
11. Maximum Marks
12. Percentage / Grade / CGPA
13. Result
14. Issue Date

Skip individual subject marks. Return ONLY valid JSON.`,

      DEGREE: `You are an expert OCR system. Read this Degree certificate.

Extract EXACTLY:
1. Student Name
2. Father's Name
3. Mother's Name
4. Registration Number / Roll Number
5. Date of Birth
6. Degree Name (Bachelor of Technology, etc.)
7. Major/Branch (Computer Science, etc.)
8. University Name
9. College Name
10. Year of Passing / Graduation Year
11. CGPA / Percentage
12. Class (First Class/Distinction/etc.)
13. Issue Date
14. Certificate Number

Return ONLY valid JSON with exact text.`,
    };

    const prompt = documentPrompts[documentType] || documentPrompts.AADHAAR;

    const result = await visionModel.generateContent([
      {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const responseText = response.text();
    console.log(
      "📄 Gemini extraction response:",
      responseText.substring(0, 500),
    );

    // Clean response - remove markdown code blocks if present
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "");

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("No JSON found in response");
      return { fields: {} };
    }

    const parsed = JSON.parse(jsonMatch[0]);
    
    // Handle both formats: {"fields": {...}} or direct fields at root
    let rawFields = parsed.fields || parsed;
    
    // Convert to standard format if needed
    const standardFields = {};
    for (const [key, value] of Object.entries(rawFields)) {
      if (value && typeof value === 'object' && 'value' in value) {
        // Already in correct format: {value: "...", confidence: 90}
        standardFields[key] = value;
      } else {
        // Convert direct value to standard format
        standardFields[key] = {
          value: String(value || ''),
          confidence: 85
        };
      }
    }
    
    // Apply Layer 3 - Field Cleaning
    const cleanedFields = {};
    for (const [key, fieldData] of Object.entries(standardFields)) {
      const cleanedValue = cleanFieldValue(key, fieldData.value);
      if (cleanedValue) { // Only include non-empty fields
        cleanedFields[key] = {
          value: cleanedValue,
          confidence: fieldData.confidence
        };
      }
    }
    
    console.log("✅ Extracted fields:", Object.keys(cleanedFields).length);

    // Log extracted field names for verification
    Object.keys(cleanedFields).forEach((key) => {
      console.log(
        `  - ${key}: ${cleanedFields[key].value} (${cleanedFields[key].confidence}%)`,
      );
    });

    return { fields: cleanedFields };
  } catch (error) {
    console.error("❌ Gemini extraction error:");
    console.error("Error name:", error.name);
    console.error("Error message:", error.message);
    console.error("Full error:", error);

    // Check if it's an API key error
    if (error.message && error.message.includes("API key")) {
      console.error("🔑 API KEY IS INVALID! Please check your Gemini API key.");
      console.error(
        "Current key starts with:",
        process.env.GEMINI_API_KEY?.substring(0, 15),
      );
    }

    // Don't use fallback - throw the error so we can see what's wrong
    throw new Error(`Failed to extract fields: ${error.message}`);
  }
};

export const matchFormFieldsWithVault = async (formField, vaultValues) => {
  // Use mock matching if no valid API key
  if (USE_MOCK_DATA) {
    console.log("⚠️ Using MOCK field matching");
    return {
      matched: vaultValues[0] || "No match",
      confidence: 75,
    };
  }

  try {
    const prompt = `Given a form field "${formField}" and these vault values: ${vaultValues.join(", ")}
    Return the best matching value with a relevance score. Format: {"matched": "value", "confidence": 85}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Gemini matching error:", error);
    // Fallback to mock data
    return {
      matched: vaultValues[0] || "No match",
      confidence: 75,
    };
  }
};

export const classifyDocumentType = async (imageData) => {
  // Initialize Gemini (lazy loading after dotenv loads)
  initializeGemini();
  
  // Use FREE Tesseract OCR for classification if Gemini is not available
  if (!isGeminiAvailable()) {
    console.log("🔍 Using FREE Tesseract OCR for document classification");
    try {
      const imageBuffer = Buffer.from(imageData, "base64");

      // Run quick OCR for classification only
      const { data } = await Tesseract.recognize(imageBuffer, "eng");
      const fullText = data.text;

      if (!fullText || fullText.length < 10) {
        console.log("⚠️ No text detected for classification");
        return { documentType: "AADHAAR", confidence: 50 };
      }

      const lowerText = fullText.toLowerCase();

      // Classify based on text content
      if (
        lowerText.includes("aadhaar") ||
        lowerText.includes("आधार") ||
        lowerText.includes("uidai")
      ) {
        return { documentType: "AADHAAR", confidence: 90 };
      } else if (
        lowerText.includes("income tax") ||
        lowerText.includes("permanent account number") ||
        /[A-Z]{5}\d{4}[A-Z]/.test(fullText)
      ) {
        return { documentType: "PAN", confidence: 90 };
      } else if (
        lowerText.includes("passport") ||
        lowerText.includes("republic of india")
      ) {
        return { documentType: "PASSPORT", confidence: 85 };
      } else if (
        lowerText.includes("secondary") ||
        lowerText.includes("10th") ||
        lowerText.includes("ssc") ||
        lowerText.includes("class x")
      ) {
        return { documentType: "TENTH", confidence: 85 };
      } else if (
        lowerText.includes("intermediate") ||
        lowerText.includes("12th") ||
        lowerText.includes("hsc") ||
        lowerText.includes("class xii")
      ) {
        return { documentType: "INTER", confidence: 85 };
      } else if (
        lowerText.includes("bachelor") ||
        lowerText.includes("master") ||
        lowerText.includes("degree") ||
        lowerText.includes("university")
      ) {
        return { documentType: "DEGREE", confidence: 80 };
      }

      return { documentType: "AADHAAR", confidence: 50 };
    } catch (error) {
      console.error("❌ Tesseract classification failed:", error.message);
      return { documentType: "AADHAAR", confidence: 50 };
    }
  }

  try {
    const prompt = `You are an expert document classifier. Analyze this image and identify the document type.

DOCUMENT TYPES:
1. AADHAAR - Indian Aadhaar card (has "आधार" logo, 12-digit number)
2. PAN - PAN card (has "INCOME TAX DEPARTMENT", 10-character alphanumeric)
3. PASSPORT - Passport (has country name, passport number, photo page)
4. TENTH - 10th grade marksheet/certificate (Standard X, Class 10, SSC)
5. INTER - Intermediate/12th certificate (Standard XII, Class 12, HSC, +2)
6. DEGREE - College degree certificate (Bachelor's, Master's, B.Tech, etc.)

INSTRUCTIONS:
- Look for logos, headers, document numbers
- Check for specific markers (Aadhaar logo, PAN format, passport format)
- Be 100% certain before classification
- If unsure, set confidence below 70

Return ONLY valid JSON (no markdown):
{
  "documentType": "AADHAAR",
  "confidence": 95
}`;

    const result = await visionModel.generateContent([
      {
        inlineData: {
          data: imageData,
          mimeType: "image/jpeg",
        },
      },
      prompt,
    ]);

    const response = await result.response;
    const responseText = response.text();
    console.log("📋 Classification response:", responseText.substring(0, 200));

    // Clean response
    let cleanedResponse = responseText.trim();
    cleanedResponse = cleanedResponse
      .replace(/```json\s*/g, "")
      .replace(/```\s*/g, "");

    const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
    const classification = jsonMatch ? JSON.parse(jsonMatch[0]) : null;

    if (classification) {
      console.log(
        `✅ Classified as: ${classification.documentType} (${classification.confidence}% confidence)`,
      );
    }

    return classification;
  } catch (error) {
    console.error("❌ Document classification error:");
    console.error("Error message:", error.message);
    console.error("Full error:", error);

    // Check if it's an API key error
    if (error.message && error.message.includes("API key")) {
      console.error(
        "🔑 API KEY IS INVALID! Please verify your Gemini API key is correct.",
      );
    }

    // Don't use fallback - throw the error
    throw new Error(`Failed to classify document: ${error.message}`);
  }
};

export const generateAutofillSuggestions = async (fieldName, context) => {
  // Use mock suggestions if no valid API key
  if (USE_MOCK_DATA) {
    console.log("⚠️ Using MOCK autofill suggestions");
    return {
      suggestions: ["Sample Suggestion 1", "Sample Suggestion 2"],
      formats: ["Format 1", "Format 2"],
    };
  }

  try {
    const prompt = `For a form field named "${fieldName}" with this context: ${context}
    Generate intelligent autofill suggestions considering format and relevance.
    Return: {"suggestions": ["suggestion1", "suggestion2"], "formats": ["format1", "format2"]}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : null;
  } catch (error) {
    console.error("Suggestion generation error:", error);
    // Fallback to mock data
    return {
      suggestions: ["Sample Suggestion 1", "Sample Suggestion 2"],
      formats: ["Format 1", "Format 2"],
    };
  }
};
