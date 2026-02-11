# 🔒 STRICT SAFE MAPPING - Test Verification Guide

## Overview
This document verifies that the `smartFieldMappingService.js` has been upgraded to STRICT SAFE MAPPING mode with the following safety guarantees:
- **Accuracy over Completeness**: Better to leave 3 fields empty than fill 1 field wrong
- **Confidence Threshold**: Only auto-fill when confidence >= 0.85 (stricter than 0.75 old default)
- **Data Type Validation**: All values validated against regex patterns before filling
- **Forbidden Crossing Prevention**: Email cannot map to address, etc.
- **Status Values**: filled | converted | unsafe | type_mismatch | missing

---

## 1. Data Type Validation Tests

### Test 1.1: Email Validation ✅
**Scenario**: Form asks for "Email" but stored data has "john@example.com"

**Old Behavior**: Would fill with high confidence
**New Behavior**: Validates email matches regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

```javascript
// Expected Result
{
  form_field: "Email",
  standard_field: "email",
  value: "john@example.com",
  confidence: 0.95,
  status: "filled",  // ✅ Email format valid
  reason: "Exact field name match"
}
```

### Test 1.2: Email Type Mismatch ❌
**Scenario**: Form asks for "Email" but stored data has "12345" (numeric)

**Old Behavior**: Might fill with confidence 0.75+
**New Behavior**: Detects type_mismatch, returns empty value

```javascript
// Expected Result
{
  form_field: "Email",
  standard_field: "email",
  value: "12345",
  confidence: 0.88,
  status: "type_mismatch",  // ❌ Value doesn't match email regex
  reason: 'Value "12345" does not match email data type pattern'
}
```

### Test 1.3: Phone Number Validation ✅
**Scenario**: Form asks for "Phone" and stored data has "9876543210"

**Old Behavior**: Would fill
**New Behavior**: Validates phone matches regex `/^[0-9]{10,15}$/`

```javascript
// Expected Result
{
  form_field: "Phone",
  standard_field: "phone",
  value: "9876543210",
  confidence: 0.92,
  status: "filled",  // ✅ Phone format valid
  reason: "Semantic field match"
}
```

### Test 1.4: Phone with Letters ❌
**Scenario**: Form asks for "Phone" but stored data has "John-123" (contains letters)

**Old Behavior**: Might fill
**New Behavior**: Detects type_mismatch

```javascript
// Expected Result
{
  form_field: "Phone",
  standard_field: "phone",
  value: "John-123",
  confidence: 0.90,
  status: "type_mismatch",  // ❌ Contains non-digits
  reason: 'Value "John-123" does not match phone data type pattern'
}
```

### Test 1.5: Names - Only Alphabet ✅
**Scenario**: Form asks for "Student Name" and stored data has "John Doe"

**Old Behavior**: Would fill
**New Behavior**: Validates name matches regex `/^[a-zA-Z\s'.-]{2,100}$/`

```javascript
// Expected Result
{
  form_field: "Student Name",
  standard_field: "student_name",
  value: "John Doe",
  confidence: 0.95,
  status: "filled",  // ✅ Name format valid
  reason: "Exact field name match"
}
```

### Test 1.6: Name with Numbers ❌
**Scenario**: Form asks for "Student Name" but stored data has "John123"

**Old Behavior**: Might fill with confidence > 0.75
**New Behavior**: Detects type_mismatch

```javascript
// Expected Result
{
  form_field: "Student Name",
  standard_field: "student_name",
  value: "John123",
  confidence: 0.92,
  status: "type_mismatch",  // ❌ Contains digits
  reason: 'Value "John123" does not match student_name data type pattern'
}
```

---

## 2. Confidence Threshold Tests (0.85 Minimum)

### Test 2.1: Exact Match (Confidence 0.95) ✅
**Scenario**: Form field is "Email" and standard field is "email"

```javascript
// Expected Result
{
  form_field: "Email",
  standard_field: "email",
  value: "john@example.com",
  confidence: 0.95,
  status: "filled",  // ✅ 0.95 >= 0.85, Safe to fill
  reason: "Exact match"
}
```

### Test 2.2: Strong Match (Confidence 0.88) ✅
**Scenario**: Form field is "Student Email" and standard field is "email"

```javascript
// Expected Result
{
  form_field: "Student Email",
  standard_field: "email",
  value: "john@example.com",
  confidence: 0.88,
  status: "filled",  // ✅ 0.88 >= 0.85, Safe to fill (new threshold)
  reason: "Near-exact match"
}
```

### Test 2.3: Weak Match (Confidence 0.75) ❌
**Scenario**: Form field is "Student ID" and standard field is "email"

**Old Behavior**: Would fill (0.75 >= 0.75 old threshold)
**New Behavior**: Marked as "unsafe" (0.75 < 0.85 new threshold)

```javascript
// Expected Result
{
  form_field: "Student ID",
  standard_field: "email",
  value: "john@example.com",
  confidence: 0.75,
  status: "unsafe",  // ❌ 0.75 < 0.85, Cannot fill
  reason: "Low confidence match (75.0% < 85% required)"
}
```

### Test 2.4: No Match (Confidence 0.0) ❌
**Scenario**: Form field is "Completely Unknown" with no matching standard field

```javascript
// Expected Result
{
  form_field: "Completely Unknown",
  standard_field: null,
  value: "",
  confidence: 0.0,
  status: "missing",
  reason: "No standard field match found"
}
```

---

## 3. Forbidden Crossing Prevention Tests

### Test 3.1: Email → Address Forbidden ❌
**Scenario**: Form field is "Student Address" but best match is "email" with stored data "john@example.com"

**Rule**: email ↔ address is FORBIDDEN

```javascript
// Expected Result
{
  form_field: "Student Address",
  standard_field: "email",
  value: "john@example.com",
  confidence: 0.82,
  status: "unsafe",
  reason: "Cross-domain mapping forbidden: Student Address → email"
}
```

### Test 3.2: Phone → Email Forbidden ❌
**Scenario**: Form field is "Email Address" but best match is "phone" with stored data "9876543210"

**Rule**: phone ↔ email is FORBIDDEN

```javascript
// Expected Result
{
  form_field: "Email Address",
  standard_field: "phone",
  value: "9876543210",
  confidence: 0.88,
  status: "unsafe",
  reason: "Cross-domain mapping forbidden: Email Address → phone"
}
```

### Test 3.3: DOB → Name Forbidden ❌
**Scenario**: Form field is "Student Name" but best match is "dob" with stored data "01/01/2000"

**Rule**: dob ↔ names is FORBIDDEN

```javascript
// Expected Result
{
  form_field: "Student Name",
  standard_field: "dob",
  value: "01/01/2000",
  confidence: 0.60,
  status: "unsafe",
  reason: "Cross-domain mapping forbidden: Student Name → dob"
}
```

### Test 3.4: Address → Phone Forbidden ❌
**Scenario**: Form field is "Phone Number" but best match is "address" with stored data "123 Main St"

**Rule**: phone ↔ address is FORBIDDEN

```javascript
// Expected Result
{
  form_field: "Phone Number",
  standard_field: "address",
  value: "123 Main St",
  confidence: 0.78,
  status: "unsafe",
  reason: "Cross-domain mapping forbidden: Phone Number → address"
}
```

---

## 4. CGPA ↔ Percentage Conversion Tests

### Test 4.1: CGPA to Percentage Conversion ✅
**Scenario**: Form asks for "Percentage" but stored data only has CGPA 8.2

**Rule**: Percentage = CGPA × 9.5

```javascript
// Expected Result
{
  form_field: "Percentage",
  standard_field: "percentage",
  value: "77.90",
  confidence: 0.88,
  status: "converted",
  conversionSource: "cgpa",
  reason: "Conversion from CGPA (8.2 × 9.5)"
}
```

### Test 4.2: Percentage to CGPA Conversion ✅
**Scenario**: Form asks for "CGPA" but stored data only has percentage 77.9

**Rule**: CGPA = Percentage ÷ 9.5

```javascript
// Expected Result
{
  form_field: "CGPA",
  standard_field: "cgpa",
  value: "8.20",
  confidence: 0.88,
  status: "converted",
  conversionSource: "percentage",
  reason: "Conversion from Percentage (77.9 ÷ 9.5)"
}
```

### Test 4.3: Percentage with Invalid Number ❌
**Scenario**: Form asks for "Percentage" but value is "99.99999" (out of range 0-100)

```javascript
// Expected Result
{
  form_field: "Percentage",
  standard_field: "percentage",
  value: "99.99999",
  confidence: 0.90,
  status: "type_mismatch",
  reason: 'Value "99.99999" does not match percentage data type pattern'
}
```

### Test 4.4: CGPA Out of Range ❌
**Scenario**: Form asks for "CGPA" but value is "12.5" (out of range 0-10)

```javascript
// Expected Result
{
  form_field: "CGPA",
  standard_field: "cgpa",
  value: "12.5",
  confidence: 0.89,
  status: "type_mismatch",
  reason: 'Value "12.5" does not match cgpa data type pattern'
}
```

---

## 5. Summary Report Tests

### Test 5.1: Mixed Form Submission
**Scenario**: Form has 8 fields with various results

**Form Fields**:
1. "Student Name" → Stored: "John Doe" (should fill)
2. "Email Address" → Stored: "john@example.com" (should fill)
3. "Phone Number" → Stored: "9876543210" (should fill)
4. "Gender" → Stored: "john@example.com" (type mismatch)
5. "Percentage" → Stored: CGPA 8.2 (should convert)
6. "Student ID" → Stored: Unknown (unsafe - low confidence)
7. "Address" → Stored: None (missing)
8. "Father Name" → Stored: "123456" (type mismatch)

**Expected Summary**:
```javascript
{
  summary: {
    total_fields: 8,
    filled_count: 3,           // Name, Email, Phone
    converted_count: 1,        // Percentage from CGPA
    unsafe_count: 1,           // Student ID (low confidence)
    type_mismatch_count: 2,    // Gender, Father Name
    missing_count: 1,          // Address
    safe_fill_count: 4,        // filled (3) + converted (1)
    average_confidence: "0.88"
  }
}
```

---

## 6. AI Prompt Safety Tests

The updated AI prompt includes:
- ✅ Explicit confidence threshold >= 0.85
- ✅ Forbidden crossing rules
- ✅ Data type validation requirements
- ✅ Status value definitions (filled, converted, unsafe, type_mismatch, missing)
- ✅ Examples showing when to reject mappings

### Test 6.1: AI Response Parsing
**Expected**: AI correctly returns JSON with new status values

```javascript
{
  "mapped_fields": [
    {
      "form_field": "Student Email",
      "standard_field": "email",
      "value": "john@example.com",
      "confidence": 0.95,
      "status": "filled",
      "reason": "Exact field match"
    },
    {
      "form_field": "Gender",
      "standard_field": "gender",
      "value": "",
      "confidence": 0.0,
      "status": "unsafe",
      "reason": "Confidence < 0.85"
    }
  ]
}
```

---

## 7. API Endpoint Safety Tests

All 7 endpoints should enforce STRICT SAFE MAPPING:

### Test 7.1: `/api/field-mapping/map` Endpoint
**Request**:
```json
{
  "formFields": [
    {"label": "Email", "type": "email"},
    {"label": "Phone", "type": "tel"}
  ],
  "storedData": {
    "email": "john@example.com",
    "phone": "9876543210"
  }
}
```

**Expected Response**:
```json
{
  "success": true,
  "mapped_fields": [
    {
      "form_field": "Email",
      "standard_field": "email",
      "value": "john@example.com",
      "confidence": 0.95,
      "status": "filled"
    },
    {
      "form_field": "Phone",
      "standard_field": "phone",
      "value": "9876543210",
      "confidence": 0.92,
      "status": "filled"
    }
  ],
  "summary": {
    "total_fields": 2,
    "filled_count": 2,
    "converted_count": 0,
    "unsafe_count": 0,
    "type_mismatch_count": 0,
    "missing_count": 0,
    "safe_fill_count": 2,
    "average_confidence": "0.94"
  }
}
```

### Test 7.2: `/api/field-mapping/validate` Endpoint
**Request**:
```json
{
  "formField": "Gender",
  "mappedValue": "john@example.com"
}
```

**Expected Response**:
```json
{
  "success": true,
  "isValid": false,
  "reason": "Value 'john@example.com' does not match gender data type pattern",
  "status": "type_mismatch"
}
```

---

## 8. Database Integration Tests

### Test 8.1: Form Submission with Mappings
**Scenario**: User submits form with 5 fields

**Expected FormSubmission Document**:
```javascript
{
  _id: ObjectId,
  user_id: "userId123",
  form_id: "formId456",
  
  // Original submission data
  original_data: { /* ... */ },
  
  // NEW: Field mapping results
  field_mappings: [
    {
      form_field: "Email",
      standard_field: "email",
      value: "john@example.com",
      confidence: 0.95,
      status: "filled",
      field_type: "email"
    },
    // ... more mappings
  ],
  
  // NEW: Mapping summary
  mapping_summary: {
    filled_count: 3,
    converted_count: 1,
    unsafe_count: 1,
    type_mismatch_count: 0
  },
  
  created_at: ISODate,
  updated_at: ISODate
}
```

---

## 9. Frontend Integration Tests

### Test 9.1: Component Handling New Status Values
**Expected Frontend Behavior**:

```javascript
// Status indicators:
- "filled" → ✅ Green checkmark - "Auto-filled"
- "converted" → 🔄 Orange checkmark - "Converted from CGPA/Percentage"
- "unsafe" → ⚠️ Yellow warning - "Low confidence, needs verification"
- "type_mismatch" → ❌ Red X - "Data format error, cannot fill"
- "missing" → ⊘ Gray dash - "No data available"

// User interactions:
- User can override "unsafe" fields with manual input
- User cannot auto-fill "type_mismatch" fields
- User can ratify filled/converted fields
- Form prevents submission if critical fields are missing
```

---

## 10. Verification Checklist

Before deploying, verify:

- [ ] **Data Type Validation**: All 12 standard fields have regex patterns
  - [ ] student_name: `/^[a-zA-Z\s'.-]{2,100}$/`
  - [ ] father_name: `/^[a-zA-Z\s'.-]{2,100}$/`
  - [ ] mother_name: `/^[a-zA-Z\s'.-]{2,100}$/`
  - [ ] dob: `/^(\d{1,2}\/\d{1,2}\/\d{4}|\d{4}-\d{1,2}-\d{1,2}|Jan|Feb|...)/i`
  - [ ] email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
  - [ ] phone: `/^[0-9]{10,15}$/`
  - [ ] address: `/^[\w\s.,#-]{5,200}$/`
  - [ ] cgpa: `/^([0-9]{1,2}(\.[0-9]{1,2})?|10)$/`
  - [ ] percentage: `/^([0-9]{1,2}(\.[0-9]{1,2})?|100)$/`
  - [ ] gender: `/^(M|F|Male|Female|Other|m|f|...)/i`
  - [ ] aadhaar: `/^[0-9]{12}$/`
  - [ ] pan: `/^[A-Z0-9]{10}$/i`

- [ ] **Confidence Threshold**: Minimum 0.85 enforced
  - [ ] 0.84 → returns `unsafe`
  - [ ] 0.85 → returns `filled` (if data type valid)

- [ ] **Forbidden Crossings**: All 4 rules implemented
  - [ ] email ↔ [address, phone, dob, names]
  - [ ] phone ↔ [email, address, dob]
  - [ ] dob ↔ [email, phone, names, address]
  - [ ] address ↔ [email, phone, dob, names]

- [ ] **Status Values**: 5 new statuses
  - [ ] `filled`: Data exists, type valid, confidence >= 0.85
  - [ ] `converted`: CGPA↔Percentage conversion applied
  - [ ] `unsafe`: Low confidence OR forbidden crossing
  - [ ] `type_mismatch`: Data fails regex validation
  - [ ] `missing`: No data available

- [ ] **API Responses**: All 7 endpoints return new summary format
  - [ ] filled_count (not mapped_count)
  - [ ] converted_count
  - [ ] unsafe_count (new)
  - [ ] type_mismatch_count (new)
  - [ ] missing_count
  - [ ] safe_fill_count (new)

- [ ] **Database**: FormSubmission schema includes field_mappings and mapping_summary
  - [ ] field_mappings array with all 6 fields
  - [ ] mapping_summary object with counts

- [ ] **Error Handling**: Gracefully handles edge cases
  - [ ] Empty storedData → all "missing"
  - [ ] Null values → "missing"
  - [ ] Invalid confidence values → clamped 0-1
  - [ ] AI errors → fall back to local mapping

---

## 11. Performance Metrics to Monitor

After deployment, track:

```
Safe Fill Rate = (filled_count + converted_count) / total_fields
Expected: 60-75% (previously aggressive filling had 85-90%)
Target: < 2% error rate on filled fields

Unsafe Rate = unsafe_count / total_fields
Expected: 5-15% (confidence below 0.85 threshold)
Acceptable: < 1% of these should be legit fills (validation accuracy)

Type Mismatch Rate = type_mismatch_count / total_fields
Expected: 2-8% (data format errors)
Target: < 1% (indicates data quality issues)

Average Confidence = mean(confidence scores)
Expected: 0.80-0.88
Minimum: 0.82 (if below, adjust FIELD_VARIATIONS)
```

---

## 12. Deployment Instructions

1. **Backup Current Service**:
   ```bash
   cp backend/services/smartFieldMappingService.js \
      backend/services/smartFieldMappingService.js.v1-backup
   ```

2. **Deploy Updated Service**:
   ```bash
   # Verify no syntax errors
   npm run lint backend/services/smartFieldMappingService.js
   ```

3. **Restart Backend**:
   ```bash
   npm restart
   ```

4. **Test All 7 Endpoints**:
   ```bash
   npm run test:mapping
   ```

5. **Monitor First Hour**:
   - Check error logs
   - Monitor response times
   - Track safe_fill_count and unsafe_count

6. **Adjust if Needed**:
   - If `unsafe_count > 20%`: Lower confidence threshold to 0.80
   - If `type_mismatch_count > 10%`: Review data quality, update FIELD_VARIATIONS
   - If `filled_count < 50%`: Missing important field variations

---

## Summary

✅ **STRICT SAFE MAPPING Implementation Complete**

**Key Achievements**:
- Confidence threshold raised from 0.75 to 0.85
- 5 new status values (filled, converted, unsafe, type_mismatch, missing)
- Data type validation for all 12 standard fields
- Forbidden crossing prevention (4 rules)
- CGPA ↔ Percentage conversion (9.5 multiplier)
- Updated AI prompt with safety-first approach
- Database schema updated with field_mappings and mapping_summary
- API endpoints return comprehensive safety metrics

**Safety Principle**: *"Better to leave 3 fields empty than fill 1 field wrong"*

---

*Document Version: 1.0*
*Last Updated: 2024*
*Status: Ready for Testing*
