# 🧠 Smart Form Field Mapping Service - Implementation Guide

## Overview

The **Smart Form Field Mapping Service** implements intelligent semantic field mapping with:

✅ **Different field wording** - Recognizes multiple naming variations  
✅ **Standard field mapping** - Maps to canonical field names  
✅ **CGPA ↔ Percentage handling** - Automatic conversion between grading systems  
✅ **Missing field detection** - Identifies unfilled fields  
✅ **Confidence scoring** - Quality metrics for each mapping (0.0-1.0)

## Architecture

### Services
```
backend/services/smartFieldMappingService.js
├── mapFormFields()          - Map multiple fields
├── mapSingleFormField()     - Map single field
├── getSuggestion()          - Get field values from vault
├── isConfidentMapping()     - Check mapping confidence
└── getFieldVariations()     - Get naming variations
```

### Controllers
```
backend/controllers/fieldMappingController.js
├── mapFormFieldsAPI()       - POST /api/field-mapping/map
├── mapSingleFieldAPI()      - POST /api/field-mapping/map-single
├── suggestFieldValueAPI()   - POST /api/field-mapping/suggest
├── getStandardFieldsAPI()   - GET /api/field-mapping/standard-fields
├── getFieldVariationsAPI()  - GET /api/field-mapping/variations/:field
├── validateMappingAPI()     - POST /api/field-mapping/validate
└── batchMapFieldsAPI()      - POST /api/field-mapping/batch
```

### Routes
```
backend/routes/fieldMappingRoutes.js
- All endpoints prefixed with /api/field-mapping
- All routes require authentication (authMiddleware)
```

### Integration
- Integrated into `submitForm()` in formController.js
- Stores mapping metadata in FormSubmission model
- Uses Gemini AI for advanced semantic understanding (fallback to local matching)

## Standard Fields

The system recognizes these standard fields:

```javascript
{
  student_name: "Student Name",
  father_name: "Father's Name",
  mother_name: "Mother's Name",
  dob: "Date of Birth",
  email: "Email Address",
  phone: "Phone Number",
  address: "Residential Address",
  cgpa: "CGPA/GPA",
  percentage: "Percentage/Marks %",
  gender: "Gender",
  aadhaar: "Aadhaar Number",
  pan: "PAN Card"
}
```

## Naming Variations

Each standard field recognizes multiple naming variations:

### student_name
- Student Name, Candidate Name, Applicant Name, Full Name, Name, Your Name

### father_name
- Father Name, Name of the Father, Father's Name, Parent Name (Father), Guardian Name

### cgpa
- CGPA, GPA, Grade Point, Grade Point Average, Cumulative GPA, SGPA

### percentage
- Percentage, Marks %, Score %, Percent, Grade Percentage, Overall Percentage

*See smartFieldMappingService.js for complete list*

## API Endpoints

### 1. Map Multiple Form Fields

**POST** `/api/field-mapping/map`

Maps multiple form fields to stored data with AI assistance.

**Request:**
```json
{
  "formFields": [
    { "label": "Student Name", "type": "text" },
    { "label": "Father Name", "type": "text" },
    { "label": "Percentage", "type": "number" }
  ],
  "useAI": true,
  "storedData": {
    "student_name": "John Doe",
    "father_name": "James Doe",
    "cgpa": 8.2
  }
}
```

**Response:**
```json
{
  "message": "Form fields mapped successfully",
  "data": {
    "mapped_fields": [
      {
        "form_field": "Student Name",
        "standard_field": "student_name",
        "value": "John Doe",
        "confidence": 0.95,
        "status": "filled"
      },
      {
        "form_field": "Father Name",
        "standard_field": "father_name",
        "value": "James Doe",
        "confidence": 0.95,
        "status": "filled"
      },
      {
        "form_field": "Percentage",
        "standard_field": "percentage",
        "value": "77.9",
        "confidence": 0.88,
        "status": "converted"
      }
    ],
    "summary": {
      "total_fields": 3,
      "mapped_count": 3,
      "missing_count": 0,
      "converted_count": 1,
      "average_confidence": 0.93
    }
  }
}
```

### 2. Map Single Field

**POST** `/api/field-mapping/map-single`

Map a single form field.

**Request:**
```json
{
  "fieldLabel": "DOB",
  "storedData": {
    "dob": "1998-05-15"
  }
}
```

**Response:**
```json
{
  "message": "Single field mapped successfully",
  "data": {
    "form_field": "DOB",
    "standard_field": "dob",
    "value": "1998-05-15",
    "confidence": 1.0,
    "status": "filled",
    "field_type": "date"
  }
}
```

### 3. Get Field Suggestion

**POST** `/api/field-mapping/suggest`

Get suggested values for a standard field from vault.

**Request:**
```json
{
  "standardField": "percentage"
}
```

**Response:**
```json
{
  "message": "Field suggestion retrieved",
  "data": {
    "field": "percentage",
    "suggestion": "77.9",
    "confidence": 0.88,
    "status": "converted_from_cgpa"
  }
}
```

### 4. Get Standard Fields

**GET** `/api/field-mapping/standard-fields`

Get all standard field definitions.

**Response:**
```json
{
  "message": "Standard fields retrieved",
  "data": {
    "student_name": "Student Name",
    "father_name": "Father's Name",
    "mother_name": "Mother's Name",
    "dob": "Date of Birth",
    ...
  },
  "count": 12
}
```

### 5. Get Field Variations

**GET** `/api/field-mapping/variations/:standardField`

Get naming variations for a standard field.

**Example:** `/api/field-mapping/variations/father_name`

**Response:**
```json
{
  "message": "Field variations retrieved",
  "field": "father_name",
  "variations": [
    "Father Name",
    "Name of the Father",
    "Father's Name",
    "Parent Name (Father)",
    "Guardian Name"
  ],
  "count": 5
}
```

### 6. Validate Mapping

**POST** `/api/field-mapping/validate`

Check if a field mapping is confident.

**Request:**
```json
{
  "formFieldLabel": "Student Name",
  "threshold": 0.75
}
```

**Response:**
```json
{
  "message": "Mapping validation completed",
  "data": {
    "formFieldLabel": "Student Name",
    "mapped": {
      "form_field": "Student Name",
      "standard_field": "student_name",
      "value": "John Doe",
      "confidence": 0.95,
      "status": "filled"
    },
    "isConfident": true,
    "threshold": 0.75,
    "recommendation": "Safe to auto-fill"
  }
}
```

### 7. Batch Map Fields

**POST** `/api/field-mapping/batch`

Map multiple forms in batch.

**Request:**
```json
{
  "batches": [
    {
      "formId": "form123",
      "formFields": [
        { "label": "Student Name", "type": "text" },
        { "label": "Email", "type": "email" }
      ]
    },
    {
      "formId": "form456",
      "formFields": [
        { "label": "Phone", "type": "tel" }
      ]
    }
  ],
  "useAI": true
}
```

**Response:**
```json
{
  "message": "Batch mapping completed",
  "total": 2,
  "results": [
    {
      "formId": "form123",
      "success": true,
      "data": { ... }
    },
    {
      "formId": "form456",
      "success": true,
      "data": { ... }
    }
  ]
}
```

## Special Conversion Rules

### CGPA → Percentage
When a form requests "percentage" but only CGPA is available:
```
percentage = CGPA × 9.5
```

**Example:** CGPA 8.2 → 77.9%

### Percentage → CGPA
When a form requests "CGPA" but only Percentage is available:
```
CGPA = Percentage ÷ 9.5
```

**Example:** 77.9% → 8.21 CGPA

## Confidence Scoring

**Confidence Range:** 0.0 to 1.0

| Range | Meaning | Use Case |
|-------|---------|----------|
| 0.90 - 1.00 | Exact meaning match | Safe to auto-fill |
| 0.75 - 0.89 | Similar meaning | Good for suggestions |
| 0.50 - 0.74 | Weak guess | Manual review recommended |
| Below 0.50 | Missing | Field requires user input |

## Status Values

| Status | Meaning |
|--------|---------|
| `filled` | Value found in stored data, exact match |
| `converted` | Value calculated from conversion rule |
| `missing` | No matching data found |

## Integration with Form Submissions

When a form is submitted, mapping data is automatically captured:

```javascript
// In FormSubmission document
{
  formId: ObjectId,
  userId: ObjectId,
  submittedData: { ... },
  
  // NEW: Smart mapping metadata
  fieldMappings: [
    {
      form_field: "Student Name",
      standard_field: "student_name",
      value: "John Doe",
      confidence: 0.95,
      status: "filled",
      field_type: "text"
    },
    ...
  ],
  
  mappingSummary: {
    total_fields: 10,
    mapped_count: 8,
    missing_count: 2,
    converted_count: 1,
    average_confidence: 0.87
  }
}
```

## Backend Integration Points

### Model Changes
- **FormSubmission.js** - Added `fieldMappings` and `mappingSummary` fields

### Controller Changes
- **formController.js** - Updated `submitForm()` to run smart mapping on submission

### New Files
- **smartFieldMappingService.js** - Core mapping logic
- **fieldMappingController.js** - API endpoints
- **fieldMappingRoutes.js** - Route definitions

## Usage Examples

### JavaScript/Frontend

```javascript
// Map multiple fields
const response = await fetch('/api/field-mapping/map', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    formFields: [
      { label: "Student Name", type: "text" },
      { label: "Percentage", type: "number" }
    ],
    useAI: true
  })
});

const result = await response.json();
console.log(result.data.mapped_fields);
```

### Postman

1. Import the endpoints
2. Set Authorization header with Bearer token
3. Test `/api/field-mapping/map` with sample data

### Python/Backend

```python
import requests

headers = {
    'Authorization': f'Bearer {token}',
    'Content-Type': 'application/json'
}

data = {
    'formFields': [
        {'label': 'Student Name', 'type': 'text'},
        {'label': 'Percentage', 'type': 'number'}
    ],
    'useAI': True
}

response = requests.post(
    'http://localhost:5000/api/field-mapping/map',
    headers=headers,
    json=data
)

print(response.json())
```

## Performance Optimization

### Caching
- Field variation mappings are pre-computed (no network calls)
- Standard field definitions are cached on initialization

### AI Fallback
- If Gemini AI fails, automatically falls back to local matching
- No service disruption if AI is unavailable

### Batch Processing
- Use `/api/field-mapping/batch` for multiple forms
- Loads vault data once, applies to all batches
- More efficient than individual calls

## Future Enhancements

1. **Learning from Corrections**
   - Store user corrections as feedback
   - Improve mapping accuracy over time
   
2. **Dynamic Field Patterns**
   - Add custom naming variations per user
   - Learn field naming patterns from submissions

3. **Multi-language Support**
   - Handle field names in different languages
   - Translate variations dynamically

4. **Advanced Conversions**
   - Date format conversions
   - Address formatting standardization
   - Phone number normalization

5. **ML-based Confidence**
   - Train model on historical mappings
   - Provide more accurate confidence scores

## Troubleshooting

### Issue: All mappings showing low confidence

**Solution:** Check if field names match known variations. Run:
```
GET /api/field-mapping/variations/student_name
```
to see accepted variations.

### Issue: Percentage/CGPA not converting

**Solution:** Ensure stored data has either CGPA or percentage value. Check vault:
```
GET /api/vault/fields
```

### Issue: AI mapping not working

**Solution:** Check if `GEMINI_API_KEY` is configured in `.env`. The system will automatically fall back to local matching if AI is unavailable.

## Summary

The Smart Form Field Mapping Service provides:
- 🎯 Semantic understanding of form fields
- 📊 Automatic CGPA ↔ Percentage conversion
- 📈 Confidence-based field matching
- 🔄 Intelligent fallbacks and error handling
- 📝 Complete audit trail of mappings
- 🚀 Batch processing support
- 🧠 AI-powered for complex cases

**Start using it today!** All endpoints are ready at `/api/field-mapping/`.
