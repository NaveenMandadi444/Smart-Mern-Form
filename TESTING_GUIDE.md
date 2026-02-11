# 🧪 TESTING Guide - Multi-Source Selection Feature

**Purpose:** Step-by-step testing guide for the new multi-source selection endpoints

---

## ✅ Pre-Test Checklist

Before testing, make sure:
- [ ] Backend server running (npm start on port 5000)
- [ ] MongoDB connected and vault data populated
- [ ] User logged in (JWT token available)
- [ ] At least 2-3 documents uploaded (Aadhaar, 10th, Inter)
- [ ] Postman or similar API testing tool ready

---

## 📝 Test Data Setup

### Users & Documents to Create

```javascript
// User: test@example.com
// Password: Test@123
// Documents uploaded:
//   1. AADHAAR: Naveen Mandadi, DOB: 01/01/1990, Address: Mumbai
//   2. TENTH: Roll: 123, Percentage: 90, Year: 2015
//   3. INTER: Roll: 456, Percentage: 92, Year: 2017
//   4. DEGREE: Roll: 789, CGPA: 8.5, Year: 2021
```

---

## 🚀 Test Cases

### Test 1: Auto-Fill WITH Source Selection

**Purpose:** Get auto-filled fields with alternatives displayed

```
METHOD: POST
URL: http://localhost:5000/api/autofill/with-selection
Headers: Authorization: Bearer <JWT_TOKEN>

REQUEST BODY:
{
  "formFields": [
    "Full Name",
    "Date of Birth",
    "10th Percentage",
    "12th Percentage",
    "Address",
    "CGPA"
  ]
}

EXPECTED RESPONSE:
{
  "success": true,
  "fields": [
    {
      "formField": "Full Name",
      "current": {
        "value": "Naveen Mandadi",
        "source": "AADHAAR",
        "confidence": 0.95
      },
      "alternatives": [
        {
          "value": "Naveen Mandadi",
          "source": "PASSPORT",
          "confidence": 0.92,
          "id": "field_id_xyz"
        }
      ],
      "totalSources": 2,
      "status": "filled",
      "userCanOverride": true
    },
    {
      "formField": "10th Percentage",
      "current": {
        "value": "90",
        "source": "TENTH",
        "confidence": 0.90
      },
      "alternatives": [],
      "totalSources": 1,
      "status": "filled",
      "userCanOverride": false
    }
  ],
  "summary": {
    "total": 6,
    "filled": 5,
    "missing": 1,
    "fieldsWithAlternatives": 2
  }
}

✅ SUCCESS CRITERIA:
├─ Response includes all requested fields
├─ Current value has confidence > 0.8
├─ Alternatives sorted by confidence
├─ totalSources counts correctly
├─ fieldsWithAlternatives only includes fields with alternatives
└─ status is either "filled" or "missing"
```

### Test 2: Get Field Variants (Single Field)

**Purpose:** Get all variants of a single field

```
METHOD: POST
URL: http://localhost:5000/api/autofill/get-variants
Headers: Authorization: Bearer <JWT_TOKEN>

REQUEST BODY:
{
  "fieldName": "Date of Birth"
}

EXPECTED RESPONSE:
{
  "success": true,
  "fieldName": "Date of Birth",
  "current": {
    "value": "01/01/1990",
    "source": "AADHAAR",
    "confidence": 0.95,
    "isBest": true
  },
  "alternatives": [
    {
      "value": "01/01/1990",
      "source": "PASSPORT",
      "confidence": 0.92,
      "id": "field_id_123",
      "isBest": false
    },
    {
      "value": "1990-01-01",
      "source": "DEGREE",
      "confidence": 0.85,
      "id": "field_id_456",
      "isBest": false
    }
  ],
  "totalSources": 3
}

✅ SUCCESS CRITERIA:
├─ Current has isBest: true
├─ Alternatives have isBest: false
├─ Sorted by confidence (highest first)
├─ totalSources matches array length
└─ All alternatives have unique source
```

### Test 3: User Selects Different Variant

**Purpose:** User clicks to change field source

```
METHOD: POST
URL: http://localhost:5000/api/autofill/select-variant
Headers: Authorization: Bearer <JWT_TOKEN>

REQUEST BODY:
{
  "fieldName": "Date of Birth",
  "selectedValue": "01/01/1990",
  "selectedSource": "PASSPORT"
}

EXPECTED RESPONSE:
{
  "success": true,
  "message": "User selection recorded for \"Date of Birth\"",
  "fieldName": "Date of Birth",
  "selectedValue": "01/01/1990",
  "selectedSource": "PASSPORT"
}

✅ SUCCESS CRITERIA:
├─ Response confirms selection recorded
├─ Message contains field name
├─ Selection saved to database
└─ Tracked for learning (check learningService logs)
```

### Test 4: Get Form Source Summary

**Purpose:** See which documents are used for entire form

```
METHOD: POST
URL: http://localhost:5000/api/autofill/form-sources
Headers: Authorization: Bearer <JWT_TOKEN>

REQUEST BODY:
{
  "formFields": [
    "Full Name",
    "Date of Birth",
    "10th Percentage",
    "Address"
  ]
}

EXPECTED RESPONSE:
{
  "success": true,
  "sources": ["AADHAAR", "TENTH"],
  "sourceContribution": {
    "AADHAAR": 3,
    "PAN": 0,
    "PASSPORT": 0,
    "TENTH": 1,
    "INTER": 0,
    "DEGREE": 0
  },
  "fieldsBySource": {
    "AADHAAR": ["Full Name", "Date of Birth", "Address"],
    "TENTH": ["10th Percentage"]
  },
  "message": "Form uses data from 2 document sources"
}

✅ SUCCESS CRITERIA:
├─ sources only includes non-zero counts
├─ sourceContribution has all document types
├─ fieldsBySource maps correctly
├─ Message is descriptive
└─ Numbers add up correctly
```

---

## 🔄 Edge Cases to Test

### Test 5: Field with NO Alternatives

```
REQUEST: get-variants for "CGPA" (only in DEGREE)
EXPECTED: alternatives[] is empty, totalSources: 1
PASS: ✅ if alternatives is empty array
FAIL: ❌ if error thrown
```

### Test 6: Missing Field (Not in Vault)

```
REQUEST: with-selection including "Not Uploaded Field"
EXPECTED: status: "missing", current: null, alternatives: []
PASS: ✅ if handled gracefully
FAIL: ❌ if API errors
```

### Test 7: Field with Multiple Document Variants (Date formats)

```
REQUEST: get-variants for "Date of Birth"
DOCUMENT: 
  - AADHAAR: "01/01/1990"
  - TENTH: "1990-01-01"
  - PASSPORT: "01/JAN/1990"
EXPECTED: All variants shown with confidence, best selected
PASS: ✅ if all 3 shown correctly
FAIL: ❌ if variant deduplication removes valid alternatives
```

### Test 8: User Selection Learning Tracking

```
STEP 1: GET-VARIANTS returns AADHAAR as best
STEP 2: SELECT-VARIANT user picks PASSPORT instead
STEP 3: NEXT TIME: Suggest PASSPORT as best?

TEST: Make 3 consecutive selections of PASSPORT
EXPECTED: Future requests show PASSPORT as "isBest"
PASS: ✅ if learning updates confidence
FAIL: ❌ if selection not tracked
```

---

## 🎯 Integration Tests

### Integration Test 1: Complete Flow

```
STEP 1: POST /api/autofill/with-selection
        → Verify all fields filled with alternatives
        
STEP 2: For field with alternatives:
        POST /api/autofill/get-variants
        → Verify matches what was in step 1
        
STEP 3: User changes one field:
        POST /api/autofill/select-variant
        → Verify selection recorded
        
STEP 4: POST /api/autofill/with-selection again
        → Verify changed field now shows new source

✅ SUCCESS: All steps work together without errors
```

### Integration Test 2: Multiple Users

```
USER 1: test1@example.com
  - Uploads: AADHAAR, TENTH
  - Selects: Always uses AADHAAR for name
  
USER 2: test2@example.com
  - Uploads: AADHAAR, PASSPORT
  - Selects: Always uses PASSPORT for name
  
TEST: 
  - USER 1 calls get-variants([...]) 
    EXPECT: AADHAAR shown as best
  
  - USER 2 calls get-variants([...])
    EXPECT: PASSPORT shown as best (learning from selections)
    
✅ SUCCESS: User preferences isolated and learned separately
```

---

## 📊 Performance Tests

### Load Test 1: Large Form

```
FORM SIZE: 50 fields
METHOD: POST /api/autofill/with-selection
BODY: formFields: [50 field names]

MEASURE:
- Response time: target < 2 seconds
- Memory usage: track for leaks
- Database queries: log count

✅ PASS: < 2 seconds
⚠️  WARNING: 2-5 seconds (optimize queries)
❌ FAIL: > 5 seconds
```

### Load Test 2: Concurrent Requests

```
TEST: 10 simultaneous users calling with-selection
MEASURE:
- All complete successfully
- No race conditions
- No database locks

✅ PASS: All 10 complete in < 5 seconds
❌ FAIL: Any error or timeout
```

---

## 🐛 Error Handling Tests

### Test 9: Invalid Field Name

```
REQUEST: 
{
  "fieldName": "NonExistent Field 12345"
}

EXPECTED:
{
  "success": false,
  "error": "Field not found",
  "statusCode": 404
}

❌ SHOULD NOT return success: true with empty data
```

### Test 10: Missing Authorization

```
REQUEST: No Authorization header
EXPECTED: 401 Unauthorized
❌ SHOULD NOT process without token
```

### Test 11: Invalid Document Source

```
REQUEST: select-variant with selectedSource: "INVALID_DOC"
EXPECTED: 400 Bad Request error
❌ SHOULD NOT process invalid source
```

### Test 12: Database Connection Error

```
SETUP: Disconnect MongoDB
REQUEST: Call with-selection
EXPECTED: 500 error with message
VERIFY: Graceful error, not crash
```

---

## 🔍 Debugging Checklist

If tests fail:

```
1. Check Backend Logs
   └─ npm run dev should show all requests
   └─ Look for SELECT-VARIANT logs
   └─ Check for database errors

2. Verify Database
   └─ VaultField documents exist
   └─ User ID matches between sets
   └─ Field names stored correctly

3. Check Authentication
   └─ JWT token valid
   └─ User ID extracted correctly
   └─ authMiddleware passing through

4. Inspect Network
   └─ Use DevTools Network tab
   └─ Check response headers
   └─ Verify request payload sent

5. Review Service Logic
   └─ multiSourceSelector.js functions logic
   └─ Confidence calculation
   └─ Alternative sorting
```

---

## 📋 Test Result Template

```
TEST CASE: [Name]
DATE: [Date]
TESTER: [Name]

REQUEST:
  Method: [POST/GET]
  URL: [URL]
  Headers: [Headers]
  Body: [Body]

RESULT:
  Status Code: [200/400/500]
  Response Time: [ms]
  
EXPECTED vs ACTUAL:
  ✅ / ❌ Field 1
  ✅ / ❌ Field 2
  ✅ / ❌ Field 3

NOTES:
  [Any observations]

PASS: ✅ / ❌
```

---

## 🚀 Deployment Testing

Before deploying to production:

```
STEPS:
1. ✅ All 12 test cases pass
2. ✅ Integration tests pass
3. ✅ Performance tests acceptable
4. ✅ Error handling tested
5. ✅ No console errors
6. ✅ Database backup taken
7. ✅ Rollback plan ready
8. ✅ Staging environment matches production
9. ✅ Stakeholders notified
10. ✅ Monitoring alerts configured

MONITORING POST-DEPLOY:
├─ Watch error rates
├─ Monitor response times
├─ Check database load
├─ Review user feedback
└─ Track usage analytics
```

---

## 📞 Quick Reference

**Run Tests:** `npm test` (if configured)  
**Check Logs:** `npm run dev` → watch terminal  
**API Base:** http://localhost:5000/api  
**Auth Header:** `Authorization: Bearer <token>`  
**Common Ports:** Backend 5000, Frontend 5173  

---

**✅ Ready to Test!**

Run through each test case systematically and report findings. 🎯
