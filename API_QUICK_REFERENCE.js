#!/usr/bin/env node

/**
 * 🚀 QUICK API REFERENCE - INTELLIGENT AUTO-FILL
 * Copy-paste ready examples for testing
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║   🎯 INTELLIGENT MULTI-SOURCE AUTO-FILL - API QUICK REFERENCE  ║
╚════════════════════════════════════════════════════════════════╝

📍 BASE URL: http://localhost:5000/api/autofill

═══════════════════════════════════════════════════════════════
1️⃣  BATCH AUTO-FILL (Multiple Fields)
═══════════════════════════════════════════════════════════════

Method: POST
Route: /intelligent

Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
  Content-Type: application/json

Request Body:
{
  "formFields": [
    "Full Name",
    "Date of Birth",
    "Address",
    "10th Percentage",
    "Father Name",
    "Gender"
  ]
}

Expected Response (200 OK):
{
  "success": true,
  "autofillData": {
    "Full Name": {
      "value": "John Doe",
      "source": "AADHAAR",
      "confidence": 0.95,
      "status": "filled",
      "autoFilled": true,
      "mappingType": "intelligent_silent"
    },
    "Date of Birth": {
      "value": "01/01/2005",
      "source": "AADHAAR",
      "confidence": 0.90,
      "status": "filled",
      "autoFilled": true,
      "mappingType": "intelligent_silent"
    },
    "Address": {
      "value": "123 Main Street, City, State 000000",
      "source": "AADHAAR",
      "confidence": 0.85,
      "status": "filled",
      "autoFilled": true,
      "mappingType": "intelligent_silent"
    },
    "10th Percentage": {
      "value": "90",
      "source": "TENTH",
      "confidence": 0.90,
      "status": "filled",
      "autoFilled": true,
      "mappingType": "intelligent_silent"
    },
    "Father Name": {
      "value": "Richard Doe",
      "source": "AADHAAR",
      "confidence": 0.88,
      "status": "filled",
      "autoFilled": true,
      "mappingType": "intelligent_silent"
    },
    "Gender": {
      "value": "Male",
      "source": "AADHAAR",
      "confidence": 0.95,
      "status": "filled",
      "autoFilled": true,
      "mappingType": "intelligent_silent"
    }
  },
  "summary": {
    "total": 6,
    "filled": 6,
    "missing": 0,
    "unsafe": 0,
    "successRate": "100.00%"
  },
  "message": "Auto-filled 6/6 fields silently"
}

═══════════════════════════════════════════════════════════════
2️⃣  SINGLE FIELD AUTO-FILL
═══════════════════════════════════════════════════════════════

Method: POST
Route: /intelligent-single

Headers:
  Authorization: Bearer <YOUR_JWT_TOKEN>
  Content-Type: application/json

Request Body:
{
  "formFieldName": "Date of Birth"
}

Expected Response (200 OK):
{
  "success": true,
  "formField": "Date of Birth",
  "value": "01/01/2005",
  "source": "AADHAAR",
  "confidence": 0.90,
  "status": "filled",
  "autoFilled": true,
  "mappingType": "intelligent_silent"
}

OR (if field not found):
{
  "success": false,
  "formField": "Date of Birth",
  "status": "missing",
  "reason": "No document source available",
  "autoFilled": false
}

═══════════════════════════════════════════════════════════════
📋 RESPONSE FIELD MEANINGS
═══════════════════════════════════════════════════════════════

Field              | Type     | Meaning
───────────────────┼──────────┼─────────────────────────────
value              | string   | The auto-filled field value
source             | string   | Document source (AADHAAR, TENTH, etc)
confidence         | 0-1      | Confidence score (0.85 minimum)
status             | string   | "filled", "missing", "unsafe", "converted"
autoFilled         | boolean  | True if auto-filled
mappingType        | string   | Always "intelligent_silent"

═══════════════════════════════════════════════════════════════
🎯 DOCUMENT SOURCE MAPPING
═══════════════════════════════════════════════════════════════

Source     | Contains
───────────┼───────────────────────────────────────────────
AADHAAR    | Name, DOB, Address, Gender, Aadhaar#
PAN        | Name, PAN#, DOB, Father Name
PASSPORT   | Name, Passport#, DOB, Gender, etc
TENTH      | Student Name, 10th Percentage, DOB, School
INTER      | Student Name, 12th Percentage, DOB, College
DEGREE     | Name, CGPA, Degree, University

═══════════════════════════════════════════════════════════════
🧪 CURL COMMAND FOR TESTING
═══════════════════════════════════════════════════════════════

# Test Batch Auto-Fill
curl -X POST http://localhost:5000/api/autofill/intelligent \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "formFields": [
      "Full Name",
      "Date of Birth",
      "Address",
      "10th Percentage"
    ]
  }'

# Test Single Field Auto-Fill
curl -X POST http://localhost:5000/api/autofill/intelligent-single \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "formFieldName": "Date of Birth"
  }'

═══════════════════════════════════════════════════════════════
💻 JAVASCRIPT FETCH EXAMPLE
═══════════════════════════════════════════════════════════════

async function autoFillForm(fieldNames) {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(
    'http://localhost:5000/api/autofill/intelligent',
    {
      method: 'POST',
      headers: {
        'Authorization': \`Bearer \${token}\`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        formFields: fieldNames
      })
    }
  );

  const data = await response.json();
  
  if (data.success) {
    console.log(\`✅ Auto-filled \${data.summary.filled}/\${data.summary.total} fields\`);
    return data.autofillData;
  } else {
    console.error('❌ Auto-fill failed');
    return null;
  }
}

// Usage:
const formData = await autoFillForm([
  'Full Name',
  'Date of Birth',
  'Address',
  '10th Percentage'
]);

═══════════════════════════════════════════════════════════════
🛡️ PRIORITY RULES (Automated)
═══════════════════════════════════════════════════════════════

IDENTITY FIELDS:
  ✅ DOB → AADHAAR (first choice) → Tenth (fallback only)
  ✅ Address → AADHAAR ONLY (strict)
  ✅ Gender → AADHAAR → Passport
  
ACADEMIC FIELDS:
  ✅ 10th Percentage → TENTH ONLY
  ✅ 12th Percentage → INTER ONLY
  ✅ Degree CGPA → DEGREE ONLY

FLEXIBLE FIELDS:
  ✅ Name → AADHAAR → Passport → Academic docs
  ✅ Father Name → AADHAAR → PAN

═══════════════════════════════════════════════════════════════
⚠️ ERROR RESPONSES
═══════════════════════════════════════════════════════════════

401 Unauthorized (No token):
{
  "message": "Authentication required"
}

400 Bad Request (Invalid input):
{
  "message": "formFields must be an array"
}

500 Server Error:
{
  "message": "Intelligent autofill failed",
  "error": "Error details here"
}

═══════════════════════════════════════════════════════════════
✨ FEATURES
═══════════════════════════════════════════════════════════════

✅ Automatic document source selection
✅ Priority rules (Aadhaar → Academic by level)
✅ Safety validation (prevents cross-document contamination)
✅ CGPA ↔ Percentage conversion
✅ Confidence scoring (>0.85 required)
✅ Zero user popups/interruptions
✅ Batch processing (multiple fields at once)
✅ Single field fallback

═══════════════════════════════════════════════════════════════
📊 SUCCESS INDICATORS
═══════════════════════════════════════════════════════════════

Expected for a well-configured system:

✅ success: true (at least 1 field filled)
✅ summary.filled: > 0
✅ summary.successRate: > 50%
✅ No "unsafe" fields
✅ confidence: ≥ 0.85

═══════════════════════════════════════════════════════════════
🚀 LIFECYCLE
═══════════════════════════════════════════════════════════════

1. User opens form
2. Frontend calls POST /api/autofill/intelligent
3. Backend receives field names
4. documentSourceResolver analyzes each field
5. Priority rules applied automatically
6. Data fetched from correct document source
7. Validation performed (safety checks)
8. Response returned with auto-filled data
9. Frontend populates form silently
10. No user interaction needed!

═══════════════════════════════════════════════════════════════

Status: ✅ READY FOR PRODUCTION

`);

export default { /* API Reference Module */ };
