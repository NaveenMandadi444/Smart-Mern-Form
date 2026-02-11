# Smart Field Mapping - Testing & Implementation Guide

## ✅ Quick Checklist

- [x] **Service Created** - `smartFieldMappingService.js` with all mapping logic
- [x] **Controller Created** - `fieldMappingController.js` with 7 API endpoints
- [x] **Routes Created** - `fieldMappingRoutes.js` with all route definitions
- [x] **Server Integrated** - Routes added to `server.js`
- [x] **Model Updated** - `FormSubmission.js` with mapping metadata fields
- [x] **Form Submit Enhanced** - `formController.js` now runs mapping on submit
- [x] **Documentation** - Comprehensive guide created

## 📋 Implementation Status

### Backend Changes

| File | Status | Changes |
|------|--------|---------|
| `backend/services/smartFieldMappingService.js` | ✅ New | Core mapping logic (600+ lines) |
| `backend/controllers/fieldMappingController.js` | ✅ New | 7 API endpoints (350+ lines) |
| `backend/routes/fieldMappingRoutes.js` | ✅ New | Route definitions (50+ lines) |
| `backend/server.js` | ✅ Updated | Added route import & registration |
| `backend/models/FormSubmission.js` | ✅ Updated | Added `fieldMappings` & `mappingSummary` |
| `backend/controllers/formController.js` | ✅ Updated | Added smart mapping to `submitForm()` |

### Key Features Implemented

| Feature | Status | Details |
|---------|--------|---------|
| Semantic field matching | ✅ | Recognizes multiple naming variations |
| Standard field mapping | ✅ | Maps to 12 canonical fields |
| CGPA ↔ Percentage conversion | ✅ | Automatic with 9.5 multiplier |
| Missing field detection | ✅ | Status tracking for missing fields |
| Confidence scoring | ✅ | 0.0-1.0 confidence for each mapping |
| AI enhancement | ✅ | Optional Gemini AI for complex cases |
| Batch processing | ✅ | Map multiple forms efficiently |
| Vault integration | ✅ | Uses stored vault data for suggestions |

## 🧪 Testing Guide

### 1. Test Environment Setup

**Prerequisites:**
```bash
cd backend
npm install
# Ensure .env has GEMINI_API_KEY
```

**Start Server:**
```bash
npm start
# Should see: ✅ Initializing Gemini AI for smart field mapping
```

### 2. Manual API Testing (Postman/curl)

#### Test 1: Map Single Field

**Request:**
```bash
curl -X POST http://localhost:5000/api/field-mapping/map-single \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "fieldLabel": "Father Name",
    "storedData": {
      "father_name": "James Doe"
    }
  }'
```

**Expected Response:**
```json
{
  "message": "Single field mapped successfully",
  "data": {
    "form_field": "Father Name",
    "standard_field": "father_name",
    "value": "James Doe",
    "confidence": 0.95,
    "status": "filled"
  }
}
```

#### Test 2: Map Multiple Fields

**Request:**
```bash
curl -X POST http://localhost:5000/api/field-mapping/map \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "formFields": [
      {"label": "Student Name", "type": "text"},
      {"label": "Father Name", "type": "text"},
      {"label": "Percentage", "type": "number"}
    ],
    "useAI": true,
    "storedData": {
      "student_name": "John Doe",
      "father_name": "James Doe",
      "cgpa": 8.2
    }
  }'
```

**Expected Behavior:**
- student_name → "John Doe" (confidence 0.95, status: filled)
- father_name → "James Doe" (confidence 0.95, status: filled)
- percentage → "77.9" (confidence 0.88, status: converted from CGPA)

#### Test 3: Test CGPA Conversion

**Request:**
```bash
curl -X POST http://localhost:5000/api/field-mapping/suggest \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "standardField": "percentage",
    "storedData": {
      "cgpa": 8.5
    }
  }'
```

**Expected Response:**
```json
{
  "data": {
    "field": "percentage",
    "suggestion": "80.75",
    "confidence": 0.88,
    "status": "converted_from_cgpa"
  }
}
```

#### Test 4: Get Standard Fields

**Request:**
```bash
curl -X GET http://localhost:5000/api/field-mapping/standard-fields \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Expected:** Returns 12 standard fields

#### Test 5: Get Field Variations

**Request:**
```bash
curl -X GET http://localhost:5000/api/field-mapping/variations/father_name \
  -H "Authorization: Bearer <YOUR_TOKEN>"
```

**Expected:** Returns list of acceptable variations for father_name

### 3. Test Scenarios

#### Scenario A: Complete Mapping Match
```javascript
const testData = {
  formFields: [
    { label: "Student Name", type: "text" },
    { label: "Email", type: "email" },
    { label: "Phone Number", type: "tel" }
  ],
  storedData: {
    student_name: "John",
    email: "john@example.com",
    phone: "9876543210"
  }
};
// Expected: All fields filled with high confidence
```

#### Scenario B: Partial Match with Conversion
```javascript
const testData = {
  formFields: [
    { label: "Student Name", type: "text" },
    { label: "Percentage", type: "number" }
  ],
  storedData: {
    student_name: "John",
    cgpa: 8.2  // Only CGPA available
  }
};
// Expected: Name filled, Percentage converted (77.9)
```

#### Scenario C: Missing Fields
```javascript
const testData = {
  formFields: [
    { label: "Student Name", type: "text" },
    { label: "Date of Birth", type: "date" },
    { label: "Address", type: "text" }
  ],
  storedData: {
    student_name: "John"
    // DOB and Address missing
  }
};
// Expected: Name filled, DOB and Address marked missing
```

#### Scenario D: Spelling Variations
```javascript
const testData = {
  formFields: [
    { label: "Aadhar Number", type: "text" }  // Variation of Aadhaar
  ],
  storedData: {
    aadhaar: "1234-5678-9012"
  }
};
// Expected: Recognized and mapped despite spelling variation
```

### 4. Integration Testing

#### Test Form Submission with Mapping

**Create a form with fields:**
```json
{
  "fields": [
    {"label": "Full Name", "type": "text"},
    {"label": "Father Name", "type": "text"},
    {"label": "CGPA", "type": "number"}
  ]
}
```

**Submit the form:**
```json
{
  "submittedData": {
    "Full Name": "John Doe",
    "Father Name": "James Doe",
    "CGPA": "8.2"
  },
  "notes": "Test submission"
}
```

**Check submission response:**
- Should include `fieldMappings` array
- Should include `mappingSummary` with statistics

**Query the submitted form:**
```bash
GET /api/forms/:formId/submissions
```

**Verify:**
- `fieldMappings` array contains mapping data
- `mappingSummary` shows correct counts

### 5. Performance Testing

#### Test Batch Mapping
```bash
curl -X POST http://localhost:5000/api/field-mapping/batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_TOKEN>" \
  -d '{
    "batches": [
      {
        "formId": "form1",
        "formFields": [...]
      },
      {
        "formId": "form2",
        "formFields": [...]
      },
      {
        "formId": "form3",
        "formFields": [...]
      }
    ],
    "useAI": true
  }'
```

**Expected Performance:**
- Should complete < 2 seconds for 3 forms
- Loads vault data once, applies to all

### 6. Error Handling Tests

#### Test A: Invalid Input
```bash
curl -X POST http://localhost:5000/api/field-mapping/map \
  -H "Authorization: Bearer <TOKEN>" \
  -d '{"formFields": "not_an_array"}'
```
**Expected:** 400 error with message

#### Test B: Missing Authorization
```bash
curl -X POST http://localhost:5000/api/field-mapping/map \
  -d '{"formFields": []}'
```
**Expected:** 401 Unauthorized

#### Test C: Invalid Standard Field
```bash
curl -X GET http://localhost:5000/api/field-mapping/variations/invalid_field \
  -H "Authorization: Bearer <TOKEN>"
```
**Expected:** 404 Not Found

## 🔧 Configuration

### Enable/Disable AI

In your code, pass `useAI` parameter:

```javascript
// With AI (if available, falls back to local)
await mapFormFields(formFields, storedData, true);

// Local matching only (faster, no API calls)
await mapFormFields(formFields, storedData, false);
```

### Confidence Threshold

Adjust for different use cases:

```javascript
// High confidence (auto-fill only very sure matches)
const threshold = 0.90;

// Medium confidence (good for suggestions)
const threshold = 0.75;

// Low confidence (include weak matches)
const threshold = 0.50;
```

## 📊 Monitoring

### Check Mapping Quality

```bash
# Get all submissions with mapping data
GET /api/forms/submissions/all

# Response will include mappingSummary:
{
  "mappingSummary": {
    "total_fields": 10,
    "mapped_count": 8,
    "missing_count": 2,
    "converted_count": 1,
    "average_confidence": 0.87
  }
}
```

### Track Conversions

Monitor how often CGPA ↔ Percentage conversion is used:

```javascript
// In database, query fieldMappings where status = "converted"
```

### Identify Problem Fields

Find fields that are frequently missing:

```bash
# Query submissions where status = "missing"
# Group by standard_field
# Identify fields to add to vault
```

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Test all 7 API endpoints
- [ ] Verify CGPA conversion accuracy (8.2 × 9.5 = 77.9)
- [ ] Test batch mapping with 10+ forms
- [ ] Verify error handling with invalid inputs
- [ ] Check Gemini AI fallback (disable API key, test)
- [ ] Load test with concurrent requests
- [ ] Verify vault data loading works
- [ ] Check token authentication on all endpoints
- [ ] Test in MongoDB with sample data
- [ ] Monitor error logs during initial rollout

## 📝 Sample Test Data

### For Testing - Insert into Vault

```json
{
  "_id": "...",
  "userId": "user123",
  "fieldName": "CGPA",
  "fieldValue": "8.3",
  "semanticTag": "ACADEMIC_CGPA",
  "extractedFrom": "DOCUMENT"
}
```

### Test Form Structure

```json
{
  "_id": "form123",
  "userId": "user123",
  "formName": "Application Form",
  "fields": [
    {
      "label": "Name of Student",
      "type": "text",
      "required": true
    },
    {
      "label": "Father's Name",
      "type": "text",
      "required": false
    },
    {
      "label": "Marks Percentage",
      "type": "number",
      "required": false
    }
  ]
}
```

## 🎯 Success Metrics

After implementation, measure:

1. **Mapping Accuracy**
   - Percentage of correct mappings
   - Average confidence score

2. **User Experience**
   - Reduction in manual field filling
   - Time saved per form submission

3. **System Performance**
   - Mapping latency
   - Batch processing efficiency

4. **Conversion Effectiveness**
   - CGPA → Percentage conversions performed
   - Percentage → CGPA conversions performed

## 📞 Support

If you encounter issues:

1. Check logs: `console.error` output in terminal
2. Verify `.env` has `GEMINI_API_KEY` if using AI
3. Ensure MongoDB is connected
4. Review test scenarios above
5. Check API response error messages

## Next Steps

1. **Run Tests** - Follow testing guide above
2. **Monitor Mappings** - Check mapping quality in first week
3. **Collect Feedback** - Users may suggest new field variations
4. **Optimize** - Add common missing variations to `FIELD_VARIATIONS`
5. **Enhance** - Consider ML-based scoring in future
