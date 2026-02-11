# 🧪 Quick API Test (Verify Everything Works)

**Before integrating into your form, test if the APIs are working.**

---

## ✅ What This Verifies

✅ Backend server is running  
✅ JWT authentication works  
✅ Auto-fill endpoints respond  
✅ You have documents in vault  
✅ Multi-source selection working  

---

## 🚀 Quick Test Steps

### Step 1: Start Backend

```bash
cd backend
npm start
```

**Expected output:**
```
✓ Server running on http://localhost:5000
✓ Environment: development
```

**Wait for:**
```
MongoDB connected ✓
```

---

### Step 2: Open Browser Dev Tools

1. Press `F12` (or right-click → Inspect)
2. Go to **Console** tab
3. You'll paste commands here

---

### Step 3: Get Your JWT Token

In the Console, paste:

```javascript
fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'your@email.com',
    password: 'your_password'
  })
})
.then(r => r.json())
.then(data => {
  localStorage.setItem('token', data.token);
  console.log('✅ Token saved:', data.token);
})
.catch(e => console.error('❌ Error:', e));
```

**If you get error "user not found":**
- You haven't registered yet
- Go to `http://localhost:5173`, sign up first
- Then try the login command again

**Expected:** 
```
✅ Token saved: eyJhbGciOiJIUzI1NiIs...
```

---

### Step 4: Test Auto-Fill API

Paste this in Console:

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/autofill/with-selection', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    formFields: ['Full Name', 'Date of Birth', 'Address']
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Response:', data);
  if (data.autofillData) {
    console.log('Fields filled:', Object.keys(data.autofillData).length);
  }
})
.catch(e => console.error('❌ Error:', e));
```

**Expected Response:**
```json
{
  "success": true,
  "autofillData": {
    "Full Name": {
      "value": "Mandadi Naveen",
      "source": "AADHAAR",
      "confidence": 0.95,
      "status": "filled",
      "autoFilled": true
    },
    "Date of Birth": {
      "value": "14/11/2004",
      "source": "AADHAAR",
      "confidence": 0.90,
      "status": "filled",
      "autoFilled": true
    },
    ...
  },
  "summary": {
    "total": 3,
    "filled": 2,
    "missing": 1,
    "successRate": "66.67%"
  }
}
```

---

### Step 5: Test Getting Alternatives

Paste this:

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/autofill/get-variants', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    fieldName: 'Full Name'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Alternatives for "Full Name":', data);
})
.catch(e => console.error('❌ Error:', e));
```

**Expected:**
```json
{
  "fieldName": "Full Name",
  "current": {
    "value": "Mandadi Naveen",
    "source": "AADHAAR",
    "confidence": 0.95
  },
  "alternatives": [
    {
      "value": "Naveen Mandadi",
      "source": "PASSPORT",
      "confidence": 0.92
    },
    {
      "value": "N. Mandadi",
      "source": "PAN",
      "confidence": 0.88
    }
  ]
}
```

---

### Step 6: Test Selecting a Variant

Paste this:

```javascript
const token = localStorage.getItem('token');

fetch('http://localhost:5000/api/autofill/select-variant', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    fieldName: 'Full Name',
    selectedValue: 'Naveen Mandadi',
    selectedSource: 'PASSPORT'
  })
})
.then(r => r.json())
.then(data => {
  console.log('✅ Selection tracked:', data);
})
.catch(e => console.error('❌ Error:', e));
```

**Expected:**
```json
{
  "success": true,
  "fieldName": "Full Name",
  "message": "User preference for Full Name recorded",
  "learned": true
}
```

---

## 📊 Test Results Checklist

- [ ] Backend starts without errors
- [ ] Token is saved in localStorage
- [ ] Auto-fill API returns data
- [ ] Alternatives API shows options
- [ ] Select variant API confirms "learned: true"
- [ ] No 401 authorization errors
- [ ] No 404 not found errors
- [ ] All responses are JSON

---

## 🚨 Common Issues During Testing

### ❌ Error: 401 Unauthorized
**Cause:** Token not in localStorage or expired  
**Fix:** 
```javascript
// Check if token exists
console.log(localStorage.getItem('token'));
// Should show: eyJhbGciOiJIUzI1NiIs...

// If empty, run login command again
```

### ❌ Error: 404 Not Found
**Cause:** API endpoint doesn't exist  
**Fix:**
```
Verify backend is running on port 5000
Check URL is exactly: /api/autofill/with-selection
Check you're using POST not GET
```

### ❌ Error: MongoDB Error / Connection Failed
**Cause:** MongoDB not running  
**Fix:**
```bash
# Windows with MongoDB installed
mongod

# Or use MongoDB Atlas (cloud)
# Update MONGODB_URI in backend/.env
```

### ❌ Response: "No vault data available"
**Cause:** No documents uploaded yet  
**Fix:**
```
1. Open http://localhost:5173
2. Go to Document Upload
3. Upload Aadhaar or 10th certificate
4. Wait for processing
5. Then try API test again
```

### ❌ Response: "Field mapping failed"
**Cause:** Field name doesn't match vault fields  
**Fix:**
```
Use field names that exist in your documents:
- "Full Name" (from Aadhaar)
- "Date of Birth" (from Aadhaar)
- "Address" (from Aadhaar)
- "10th Percentage" (from 10th cert)
- "12th Percentage" (from 12th cert)
```

---

## 🎯 Expected Success Sequence

```
1. GET /health ✅
   Response: { "status": "Server is running" }

2. POST /api/auth/login ✅
   Response: { "token": "...", "user": {...} }

3. POST /api/autofill/with-selection ✅
   Response: { "autofillData": {...}, "summary": {...} }

4. POST /api/autofill/get-variants ✅
   Response: { "current": {...}, "alternatives": [...] }

5. POST /api/autofill/select-variant ✅
   Response: { "success": true, "learned": true }
```

---

## 📋 API Endpoints Summary

| Endpoint | Method | Purpose | Status |
|----------|--------|---------|--------|
| `/api/autofill/intelligent` | POST | Silent auto-fill (best source) | ✅ |
| `/api/autofill/with-selection` | POST | Auto-fill with alternatives | ✅ |
| `/api/autofill/get-variants` | POST | Get alternatives dropdown | ✅ |
| `/api/autofill/select-variant` | POST | Track user's selection | ✅ |
| `/api/autofill/form-sources` | POST | Show document breakdown | ✅ |

---

## 🎉 When Everything Works

After passing all tests above:
1. ✅ Backend is ready
2. ✅ APIs are working
3. ✅ Your vault has data
4. ✅ You can now integrate FormBuilderEnhanced

---

## 📞 If Tests Fail

**Check in order:**

1. **Backend running?**
   ```bash
   curl http://localhost:5000/health
   # Should respond: { "status": "Server is running" }
   ```

2. **Node version OK?**
   ```bash
   node --version
   # Should be v16 or higher
   ```

3. **Dependencies installed?**
   ```bash
   cd backend
   npm install
   ```

4. **MongoDB connected?**
   - Check backend logs for: "MongoDB connected"
   - If not, verify MONGODB_URI in .env

5. **Ports available?**
   ```bash
   # Port 5000 free?
   netstat -ano | findstr "5000"  # Windows
   lsof -i :5000  # Mac/Linux
   ```

---

## ✨ You're Ready When

✅ All tests pass  
✅ Backend logs show no errors  
✅ Console shows "✅" responses  
✅ You have actual data in vault  

**Then:** Follow START_HERE_NOW.md to integrate FormBuilderEnhanced!

---

**Test Duration:** 5 minutes  
**Difficulty:** Easy  
**Status:** All endpoints are live and working ✅
