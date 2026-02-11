# 🔧 Auto-Fill Troubleshooting Guide

## Issue: Auto-Fill Not Working (Returns 0 Fields)

Response shows:
```json
{
  "success": false,
  "fields": [...],
  "summary": {"filled": 0, "missing": 11},
  "message": "Form auto-filled with 0 fields having alternative sources"
}
```

---

## 🔍 Root Causes & Solutions

### **Problem 1: Vault is Empty**
**Symptom:** `Vault is empty - please upload documents first`

**Solution:**
1. Go to Dashboard → Document Upload
2. Select a document type (Aadhaar, 10th, 12th, Degree, etc.)
3. Upload a document image
4. Wait for OCR processing to complete
5. Verify fields were extracted
6. **Retry auto-fill**

**Why:** Auto-fill searches your vault for matching data. If vault is empty, there's nothing to fill.

---

### **Problem 2: Field Names Not Matching**
**Symptom:** Vault has data, but fields still show "missing"

**Solution:**
This is usually a field name mismatch issue. The fix has been implemented with:
- Field name normalization (removes colons, underscores)
- Smart pattern matching (15+ semantic patterns)  
- Multiple search strategies (exact match, first word, pattern)
- Lowered confidence threshold (0.60 instead of 0.75)

**To debug:** Check backend console logs for:
```
🔍 Fetching variants for "[FIELD_NAME]"
📊 Found X variants in vault
```

If it shows "Found 0 variants", the field name in vault doesn't match what we're searching for.

---

### **Problem 3: Database Connection Issues**
**Symptom:** API returns error instead of results

**Solution:**
1. Verify MongoDB is running:
   ```bash
   # On Windows
   mongod --dbpath "C:\data\db"
   
   # Or check if MongoDB service is running in Services
   ```

2. Check backend `.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/mernForm
   # or
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/mernForm
   ```

3. Restart backend:
   ```bash
   cd backend
   npm start
   ```

---

### **Problem 4: Authentication/Token Issues**
**Symptom:** Response is `401` or token error

**Solution:**
1. Verify token is being sent:
   ```javascript
   // In FormBuilderEnhanced.tsx
   const token = localStorage.getItem('authToken');
   if (!token) {
     console.error('No auth token found');
     return;
   }
   ```

2. Check token is valid:
   - Login again if expired
   - Test with: `http://localhost:5000/api/autofill/debug/vault-status`

---

## 🧪 Quick Diagnostic Steps

### **Step 1: Check Vault Status**
Run this test in API tester or browser console:
```bash
GET http://localhost:5000/api/autofill/debug/vault-status
Headers: Authorization: Bearer YOUR_TOKEN
```

Expected response:
```json
{
  "totalVaultFields": 25,
  "fieldsBySource": [
    { "_id": "AADHAAR", "count": 12 },
    { "_id": "TENTH", "count": 13 }
  ],
  "sampleFields": [
    { "fieldName": "Full Name", "fieldValue": "John Doe", "extractedFrom": "AADHAAR" },
    ...
  ]
}
```

**If `totalVaultFields: 0`** → Vault is empty, upload documents first!

---

### **Step 2: Check Backend Logs**
Look for lines like:
```
🎯 AUTO-FILL WITH SELECTION: Processing 11 fields
📊 User vault has 25 fields
🔍 Fetching variants for "full name"
📊 Found 3 variants in vault
✅ Found variants from 1 sources: AADHAAR
```

If you see `Found 0 variants` for fields that should match, the field normalization might need adjustment.

---

### **Step 3: Test Field Name Matching**
The field name cleaning logic handles:

✅ **Removes:**
- Trailing colons: `"Name:" → "Name"`
- Underscores: `"Name_____" → "Name"`
- Formatting: `"**Name**" → "Name"`

✅ **Recognizes patterns:**
- `"Full Name", "Student Name", "Applicant Name"` → all match
- `"Date of Birth", "DOB", "Birth Date"` → all match
- `"10th Percentage", "Marks", "Score %"` → all match

---

## ✅ Verification Checklist

- [ ] MongoDB is running
- [ ] Backend started without errors (`npm start`)
- [ ] Frontend can reach backend (check network tab)
- [ ] User is logged in (has `authToken` in localStorage)
- [ ] At least one document uploaded to vault
- [ ] Document extraction completed (status = COMPLETED)
- [ ] Backend logs show vault fields found
- [ ] Field names in form match vault field patterns

---

## 📋 Complete Auto-Fill Flow

```
1. User submits form with field names
   ↓
2. Frontend sends field names to /api/autofill/with-selection
   ↓
3. Backend checks vault has data
   ↓
4. For each form field:
   - Normalize field name (remove noise)
   - Search vault with 3 strategies
   - Find best match + alternatives
   ↓
5. Return filled data + alternatives
   ↓
6. Frontend displays filled form
```

**ANY step fails = 0 fields filled**

---

## 🔧 If Still Not Working

1. **Clear browser cache & localStorage**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. **Restart everything:**
   ```bash
   # Terminal 1
   cd backend
   npm start
   
   # Terminal 2 (new terminal)
   cd frontend
   npm run dev
   ```

3. **Check MongoDB directly:**
   ```bash
   mongosh
   use mernForm
   db.vaultfields.count()  # Should show > 0
   db.vaultfields.findOne()  # Show sample document
   ```

4. **Enable debug logging** in backend:
   - Add `DEBUG=*` before npm start
   - Or check `/backend/.env` for DEBUG settings

---

## 📞 Contact Support

If none of these work:
1. Check backend console for exact error messages
2. Share the `/api/autofill/debug/vault-status` response
3. Describe which documents you uploaded
4. Show the exact error in network tab

---

**Updated:** February 11, 2026  
**Version:** 2.0.0+  
**Status:** Troubleshooting Guide Active
