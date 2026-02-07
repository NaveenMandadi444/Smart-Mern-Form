# 🚀 VisionForm Assist - Quick Start Guide

## ✅ Project Successfully Organized!

All files have been arranged in a complete, production-ready MERN stack structure.

---

## 📂 What's Been Created

### Root Level

- ✅ **README.md** - Full documentation
- ✅ **DEVELOPMENT.md** - Development guide
- ✅ **PROJECT_STRUCTURE.md** - Structure overview
- ✅ **COMPLETE_STRUCTURE.md** - Detailed file tree
- ✅ **docker-compose.yml** - Multi-container setup
- ✅ **.gitignore** - Git configuration

### Backend (/backend)

- ✅ **Models** (6 schemas)
  - User.js - User accounts
  - VaultSection.js - Document sections
  - VaultField.js - Extracted fields
  - VaultDocument.js - Document metadata with image URL
  - VaultAmbiguity.js - Conflict tracking
  - LearnedField.js - Pattern learning

- ✅ **Controllers** (5 controllers)
  - authController.js - Login/Register
  - documentController.js - Upload & processing with image display
  - vaultController.js - Vault management
  - autofillController.js - AI suggestions
  - ambiguityController.js - Conflict resolution

- ✅ **Services** (5 services)
  - geminiService.js - Google Gemini AI
  - ocrService.js - Google Vision API
  - documentVaultService.js - Vault routing
  - deduplicationService.js - Duplicate detection
  - learningService.js - Field learning

- ✅ **Routes** (5 route files)
- ✅ **Middleware** - Auth & error handling
- ✅ **Config** - Database, Auth, Constants
- ✅ **server.js** - Main Express app
- ✅ **Dockerfile** - Container image

### Frontend (/frontend)

- ✅ **Pages** (4 pages)
  - Auth.tsx - Authentication
  - Dashboard.tsx - Main dashboard
  - DataVault.tsx - Vault browser
  - FormAssistant.tsx - Form assistance

- ✅ **Components**
  - DocumentUploadModal.tsx - Upload with **IMAGE PREVIEW**

- ✅ **Services**
  - api.ts - All API services
- ✅ **Hooks**
  - useAuth.ts - Authentication hook

- ✅ **Utilities**
  - utils.ts - Helper functions
  - constants.ts - Frontend constants

- ✅ **Config**
  - vite.config.ts
  - tsconfig.json
  - tailwind.config.js
  - .eslintrc.cjs
  - Dockerfile

---

## 🖼️ KEY FEATURE: Document Image Preview

### Upload Modal Shows:

1. **Document Type Selection** - Choose Aadhaar, PAN, Passport, etc.
2. **File Upload** - Drag & drop or click to upload
3. **Image Preview** - Shows the exact document image user uploaded
4. **File Info** - File name and size
5. **Submit** - Upload & process button

Located in: `frontend/src/components/DocumentUploadModal.tsx`

The backend also stores:

- `imageUrl` - Full base64 image for preview
- `previewUrl` - Display URL
- Status tracking during processing

---

## 🔧 Installation & Setup

### Step 1: Prerequisites

```bash
# Required:
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- Google Vision API credentials
```

### Step 2: Clone & Enter Project

```bash
cd mernForm1
```

### Step 3: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
MONGODB_URI=mongodb://localhost:27017/visionform
JWT_SECRET=your_jwt_secret_key_change_in_production
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_VISION_API_KEY=your_google_vision_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
EOF

# Start development server
npm run dev
```

Backend runs on: **http://localhost:5000**

### Step 4: Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
cat > .env << EOF
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
EOF

# Start dev server
npm run dev
```

Frontend runs on: **http://localhost:5173**

### Step 5: MongoDB Setup

**Option A: Local MongoDB**

```bash
# Download from mongodb.com or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**Option B: MongoDB Atlas**

- Create free account at mongodb.com
- Get connection string
- Update MONGODB_URI in backend/.env

---

## 🎯 Project Workflow

### 1. **Register/Login**

- Navigate to http://localhost:5173
- Create account or login

### 2. **Upload Document** ⭐ NEW IMAGE PREVIEW

- Click "Upload Document"
- Select document type (Aadhaar, PAN, etc.)
- Choose image file
- **See preview of uploaded image**
- Click "Upload & Process"

### 3. **Processing**

- Gemini AI extracts fields
- Fields routed to correct section
- Ambiguities tracked if conflicts

### 4. **View Vault**

- Navigate to "Data Vault"
- Browse sections and fields
- Edit/delete as needed

### 5. **Use Autofill**

- When filling forms
- Get AI suggestions from vault
- One-click copy with formatting

---

## 📊 API Endpoints Summary

### Auth

```
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/verify
```

### Documents (with Image Support)

```
POST   /api/documents/upload      (returns imageUrl, previewUrl)
POST   /api/documents/process
GET    /api/documents
GET    /api/documents/:id
```

### Vault

```
GET    /api/vault/sections
GET    /api/vault/section/:type
GET    /api/vault/fields/:sectionId
POST   /api/vault/fields
PUT    /api/vault/fields/:id
DELETE /api/vault/fields/:id
```

### Autofill

```
POST   /api/autofill/suggest
POST   /api/autofill/alternatives
GET    /api/autofill/learned-fields
POST   /api/autofill/format
```

### Ambiguities

```
GET    /api/ambiguities
PUT    /api/ambiguities/:id/resolve
DELETE /api/ambiguities/:id
```

---

## 🐳 Docker Setup (Alternative)

Run everything in containers:

```bash
# From project root
docker-compose up
```

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- MongoDB: localhost:27017

---

## 📋 Database Schema

### Collections Created:

1. **users** - User accounts
2. **vault_documents** - Uploaded documents with imageUrl
3. **vault_sections** - Document sections (PERSONAL_MASTER, AADHAAR_SECTION, etc.)
4. **vault_fields** - Extracted fields
5. **vault_ambiguities** - Conflicting fields
6. **learned_fields** - Usage patterns

---

## 🔐 Authority Hierarchy

```
PERSONAL_MASTER    → Authority: 100 (Final say)
AADHAAR_SECTION    → Authority: 95
PASSPORT_SECTION   → Authority: 90
PAN_SECTION        → Authority: 85
EDUCATION (all)    → Authority: 70
```

Higher authority prevents lower authority from overriding.

---

## ✨ Key Features Implemented

- ✅ Document upload with image preview
- ✅ Gemini AI field extraction
- ✅ Google Vision API OCR
- ✅ Section-based vault isolation
- ✅ Authority hierarchy enforcement
- ✅ Duplicate detection (Levenshtein distance)
- ✅ Ambiguity tracking
- ✅ Field learning system
- ✅ JWT authentication
- ✅ User data isolation
- ✅ Format transformations
- ✅ Docker containerization

---

## 🚀 Next Steps

1. Replace API keys in .env files
2. Test upload with document image
3. Verify image displays in modal
4. Process document and check extraction
5. Browse vault and test autofill
6. Resolve any ambiguities
7. Deploy using Docker Compose or separately

---

## 📝 File Locations Reference

| Purpose             | Location                                          |
| ------------------- | ------------------------------------------------- |
| Upload Modal        | `frontend/src/components/DocumentUploadModal.tsx` |
| Dashboard           | `frontend/src/pages/Dashboard.tsx`                |
| Auth                | `frontend/src/pages/Auth.tsx`                     |
| Vault Manager       | `frontend/src/pages/DataVault.tsx`                |
| API Services        | `frontend/src/services/api.ts`                    |
| Backend Server      | `backend/server.js`                               |
| Document Controller | `backend/controllers/documentController.js`       |
| Vault Service       | `backend/services/documentVaultService.js`        |
| MongoDB Models      | `backend/models/*.js`                             |

---

## 🎓 Documentation Files

- **README.md** - Full project documentation
- **DEVELOPMENT.md** - Development setup & troubleshooting
- **PROJECT_STRUCTURE.md** - Directory structure overview
- **COMPLETE_STRUCTURE.md** - Detailed file tree
- **QUICKSTART.md** - This file!

---

## ⚠️ Troubleshooting

| Issue                     | Solution                                                   |
| ------------------------- | ---------------------------------------------------------- |
| Port 5000 in use          | `netstat -ano \| findstr :5000` → `taskkill /PID <pid> /F` |
| Port 5173 in use          | `netstat -ano \| findstr :5173` → `taskkill /PID <pid> /F` |
| MongoDB connection failed | Check MONGODB_URI, ensure MongoDB running                  |
| Gemini API errors         | Verify API key, check quota in Google Cloud                |
| CORS errors               | Verify FRONTEND_URL in backend .env                        |
| Image preview not showing | Check imageUrl in upload response                          |

---

## 📚 Technology Stack

**Frontend**: React 18 • TypeScript • Vite • Tailwind • Sonner
**Backend**: Express • MongoDB • Mongoose • Gemini AI • Vision API  
**Auth**: JWT • bcryptjs
**Files**: Multer
**Deployment**: Docker • Docker Compose

---

## 🎉 You're All Set!

Your VisionForm Assist application is ready to run. Start with Step 3 above and follow the workflow.

Questions? Check DEVELOPMENT.md or README.md for detailed guides.

Happy coding! 🚀
