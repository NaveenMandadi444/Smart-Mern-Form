# 🚀 QUICK START - Multi-Source Selection Feature

**Goal:** Get the feature working in 15 minutes  
**Difficulty:** 🟢 Easy  
**Prerequisites:** Backend running, user logged in

---

## ⚡ 60-Second Quick Start

### Step 1: Start Backend (if not already running)
```bash
cd backend
npm start
# Should show: Server running on port 5000
```

### Step 2: Open Postman/API Testing Tool

### Step 3: Get Your JWT Token
```
Login via: POST http://localhost:5000/api/auth/login
Body:
{
  "email": "your@email.com",
  "password": "your-password"
}
Response: { token: "eyJhbGc..." }
```

### Step 4: Test Auto-Fill with Sources
```http
POST http://localhost:5000/api/autofill/with-selection

Header: Authorization: Bearer YOUR_JWT_TOKEN

Body:
{
  "formFields": ["Full Name", "Date of Birth", "Address"]
}

Click SEND → You should see auto-filled values with sources!
```

✅ **Done!** You just tested the new feature.

---

## 🎯 First 5 Tests (Copy & Paste Ready)

### Test 1️⃣: Auto-Fill Everything
```bash
curl -X POST http://localhost:5000/api/autofill/with-selection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formFields": ["Full Name", "Date of Birth", "10th Percentage", "Address"]
  }'
```

**Expected:** Fields filled with source indicators ✅

---

### Test 2️⃣: Get One Field's Variants
```bash
curl -X POST http://localhost:5000/api/autofill/get-variants \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "Full Name"
  }'
```

**Expected:** Current value + all alternatives ✅

---

### Test 3️⃣: User Switches Source
```bash
curl -X POST http://localhost:5000/api/autofill/select-variant \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fieldName": "Full Name",
    "selectedValue": "Naveen Mandadi",
    "selectedSource": "PASSPORT"
  }'
```

**Expected:** Selection recorded for learning ✅

---

### Test 4️⃣: See Form's Data Sources
```bash
curl -X POST http://localhost:5000/api/autofill/form-sources \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formFields": ["Full Name", "Date of Birth", "Address", "10th Percentage"]
  }'
```

**Expected:** Shows which documents provide the data ✅

---

### Test 5️⃣: Get Auto-Fill Summary
```bash
curl -X POST http://localhost:5000/api/autofill/with-selection \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "formFields": [
      "Full Name",
      "Date of Birth",
      "10th Percentage",
      "12th Percentage",
      "Address",
      "Phone",
      "Email"
    ]
  }'
```

**Expected:** 
- Some filled (from vault)
- Some empty (not in vault)
- Summary showing filled/missing/alternatives ✅

---

## 🔍 Postman Collection Template

**Import this into Postman:**

```json
{
  "info": {
    "name": "Multi-Source Selection API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "1. Auto-Fill with Alternatives",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          },
          {
            "key": "Content-Type",
            "value": "application/json",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"formFields\": [\"Full Name\", \"Date of Birth\", \"10th Percentage\", \"Address\"]\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/autofill/with-selection",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "autofill", "with-selection"]
        }
      }
    },
    {
      "name": "2. Get Field Variants",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fieldName\": \"Full Name\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/autofill/get-variants",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "autofill", "get-variants"]
        }
      }
    },
    {
      "name": "3. User Selects Variant",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"fieldName\": \"Full Name\",\n  \"selectedValue\": \"Naveen Mandadi\",\n  \"selectedSource\": \"PASSPORT\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/autofill/select-variant",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "autofill", "select-variant"]
        }
      }
    },
    {
      "name": "4. Form Sources",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwt_token}}",
            "type": "text"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"formFields\": [\"Full Name\", \"Date of Birth\", \"Address\", \"10th Percentage\"]\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/autofill/form-sources",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "autofill", "form-sources"]
        }
      }
    }
  ],
  "variable": [
    {
      "key": "jwt_token",
      "value": "YOUR_JWT_TOKEN_HERE"
    }
  ]
}
```

---

## 📋 Simple Test Checklist

Print this and check as you go:

```
SETUP:
  [ ] Backend running (npm start)
  [ ] GET JWT token
  [ ] Set Authorization header
  
TEST ENDPOINTS:
  [ ] POST /api/autofill/with-selection → ✅ Response OK
  [ ] POST /api/autofill/get-variants → ✅ Response OK
  [ ] POST /api/autofill/select-variant → ✅ Response OK
  [ ] POST /api/autofill/form-sources → ✅ Response OK
  
VERIFY RESPONSES:
  [ ] with-selection returns fields[] array
  [ ] with-selection shows alternatives
  [ ] get-variants shows current + alternatives
  [ ] select-variant confirms selection saved
  [ ] form-sources shows document breakdown
  
SUCCESS:
  [ ] All 4 endpoints working
  [ ] All responses have success: true
  [ ] No errors in response
  [ ] Backend logs show no errors
  
✅ FEATURE IS WORKING!
```

---

## 🎬 Video Walkthrough (Text Version)

### Scenario: Fill a form manually with alternatives

```
1. USER OPENS FORM
   → Frontend calls POST /api/autofill/with-selection
   → Backend returns auto-filled data with alternatives

2. FORM DISPLAYS
   Name field shows: "Naveen Mandadi" [✓ AADHAAR] [📄 2 other]
   DOB field shows: "01/01/1990" [✓ AADHAAR] [No alternatives]
   Address field shows: "Mumbai" [✓ AADHAAR] [📄 1 other]

3. USER CLICKS "2 other" on Name field
   → Frontend calls POST /api/autofill/get-variants
   → Dropdown shows:
     • AADHAAR: "Naveen Mandadi" (95%)
     • PASSPORT: "Naveen Mandadi" (92%)
     • PAN: "N. Mandadi" (88%)

4. USER CLICKS "PASSPORT"
   → Frontend calls POST /api/autofill/select-variant
   → Backend records selection
   → Name field updates to "Naveen Mandadi" [PASSPORT]
   → Learning system updated

5. USER SUBMITS FORM
   → Form submitted with selected sources tracked
   → Next time form loaded → PASSPORT suggested for Name

✅ DONE!
```

---

## 🐛 Troubleshooting Quick Reference

| Issue | Solution |
|-------|----------|
| **401 Unauthorized** | Check JWT token in header |
| **404 Not Found** | Backend not running or wrong URL |
| **500 Server Error** | Check backend logs (`npm start` terminal) |
| **Empty alternatives** | Field only in one document (expected) |
| **"Field not found"** | Field name not in vault, upload documents |
| **CORS Error** | Check backend CORS configuration |
| **"User not authenticated"** | JWT token expired, login again |

---

## 📊 Sample Responses

### Success Response (with-selection)
```json
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
          "id": "field_123"
        }
      ],
      "totalSources": 2,
      "status": "filled",
      "userCanOverride": true
    }
  ],
  "summary": {
    "total": 1,
    "filled": 1,
    "missing": 0,
    "fieldsWithAlternatives": 1
  }
}
```

### Success Response (select-variant)
```json
{
  "success": true,
  "message": "User selection recorded for \"Full Name\"",
  "fieldName": "Full Name",
  "selectedValue": "Naveen Mandadi",
  "selectedSource": "PASSPORT"
}
```

### Error Response (field not found)
```json
{
  "success": false,
  "error": "Field not found in vault",
  "statusCode": 404
}
```

---

## 🚀 Next Steps After Testing

1. **If working:**
   - Read MULTI_SOURCE_SELECTION_GUIDE.md for frontend integration
   - Start building React components
   - Run full test suite (TESTING_GUIDE.md)

2. **If not working:**
   - Check backend logs
   - Verify database connection
   - Make sure documents uploaded to vault
   - Review error messages

3. **Performance check:**
   - Time each request
   - Should be < 1 second
   - If slower, check database queries

---

## 💡 Pro Tips

✅ **Always include Authorization header** or you'll get 401  
✅ **Field names must match** what's in vault  
✅ **Test with real documents** uploaded to vault  
✅ **Check backend logs** for debugging  
✅ **Use Postman** to visualize responses better  
✅ **Save responses** to understand data structure  

---

## 📞 Getting Help

**Issue:** APIs not responding  
**Check:** Backend running? `npm start` in backend folder

**Issue:** Unauthorized errors  
**Check:** JWT token valid? Get new one via login endpoint

**Issue:** No alternatives shown  
**Check:** Have you uploaded 2+ documents? System needs multiple sources

**Issue:** Performance slow  
**Check:** Database connection, network latency, server load

---

**✅ Ready to Go!**

Start with Test 1️⃣ above. If it works, you're golden. 🎉

Questions? Check TESTING_GUIDE.md for full details.
