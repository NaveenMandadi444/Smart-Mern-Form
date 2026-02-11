# 🔧 Fix 401 Unauthorized Error

## ❌ Error Message
```
Failed to load resource: the server responded with a status of 401 (Unauthorized)
AxiosError: Request failed with status code 401
```

## 🎯 What This Means
Your **JWT token is missing, expired, or invalid**. The token is required to authenticate API requests.

---

## ✅ Solution (3 Steps)

### Step 1: Make Sure You're Logged In
```
1. Go to http://localhost:5173
2. You should see "Login" or "Sign Up" button
3. If you see "Logout" → You're logged in ✅
4. If you see "Login" → You need to login first
```

### Step 2: Login Again
```
If you're not logged in:
1. Click "Login" or "Sign Up"
2. Enter your email and password
3. Click "Login"
4. Should see "Dashboard" page
5. Token is now saved ✅
```

### Step 3: Refresh Form Builder Page
```
1. Go to http://localhost:5173/form-builder
2. Press Ctrl+Shift+R (hard refresh)
3. Now try uploading/pasting form again
```

---

## 🔍 Verify Token is Stored

Open **Browser Console** (F12 → Console tab) and run:

```javascript
// Check if token exists
console.log("Token:", localStorage.getItem("authToken"));

// If empty → NOT logged in
// If shows long string → Logged in ✅
```

**Output Examples:**

✅ **Logged in (Good):**
```
Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NTc5M2FiYzEyMzQ1Njc4OTBhYmNkZWYiLCJpYXQiOjE3MDI0MzAwNDUsImV4cCI6MTcwMzAzNTA0NX0.7k...
```

❌ **Not logged in (Bad):**
```
Token: null
```

---

## 🚀 If Already Logged In But Still Getting Error

### Clear Cache & Try Again
```
1. Press F12 (Open DevTools)
2. Right-click on refresh button
3. Click "Empty cache and hard refresh"
4. Try uploading form again
```

### Check Token Expiry
```
Tokens expire after 7 days by default.
If token is expired:
1. Logout
2. Login again
3. New token created ✅
```

### Run Backend Server
Make sure backend is running:
```bash
# Terminal 1
cd backend
npm start
```

---

## 📋 Complete Checklist

- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:5173
- [ ] You are logged in (see "Logout" button)
- [ ] Token exists in localStorage (check with F12)
- [ ] Page refreshed (Ctrl+Shift+R)
- [ ] No 401 error shown ✅

---

## 🆘 Still Getting 401 Error?

### Option 1: Logout & Login Again
```
1. Click "Logout" at top right
2. Click "Login"
3. Re-enter credentials
4. Refresh form builder page
```

### Option 2: Clear All Browser Data
```
1. Press F12 (DevTools)
2. Application tab
3. Storage → LocalStorage
4. Click "http://localhost:5173"
5. Delete all items
6. Close DevTools
7. Refresh page
8. Login again
```

### Option 3: Check Backend Logs
```bash
# Look for errors in backend terminal
# You should see: "✅ JWT verified" 
# NOT: "❌ Invalid token"
```

---

## 🎉 Success!

Once 401 error is fixed:
1. ✅ Upload form image works
2. ✅ Paste form content works
3. ✅ Auto-fill button shows
4. ✅ Form fills with vault data

---

**Need help?** Check backend console for detailed error messages 🔧
