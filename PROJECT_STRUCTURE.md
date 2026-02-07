# VisionForm Assist - Project Structure

## Overview

Full-stack MERN application with AI-powered document processing and intelligent autofill.

## Directories

### /frontend

React + TypeScript frontend with Vite

- **src/components/** - Reusable UI components
- **src/pages/** - Page-level components (Auth, Dashboard, Vault, etc.)
- **src/services/** - API service layer (documentService, vaultService, etc.)
- **src/hooks/** - Custom React hooks (useAuth, etc.)
- **src/lib/** - Utility functions and helpers

### /backend

Express.js + MongoDB backend

- **models/** - Mongoose schemas (User, VaultSection, VaultField, etc.)
- **controllers/** - Request handlers (authController, documentController, etc.)
- **services/** - Business logic (geminiService, documentVaultService, etc.)
- **routes/** - API route definitions
- **middleware/** - Authentication and error handling
- **config/** - Database and auth configuration

## Key Services

### Backend Services

**geminiService.js**

- Document understanding and field extraction
- Semantic field matching
- Authority determination
- Smart suggestion generation

**documentVaultService.js**

- Section routing and management
- Authority hierarchy enforcement
- Personal Master updates
- Cross-section validation

**deduplicationService.js**

- Levenshtein distance-based duplicate detection
- Value normalization
- Ambiguity tracking
- Field conflict resolution

**ocrService.js**

- Google Vision API integration
- Text extraction from images

**learningService.js**

- Field usage tracking
- Pattern detection
- Reusable field suggestions

### Frontend Services

**api.ts**

- documentService - Document upload/processing
- vaultService - Vault operations
- autofillService - Autofill suggestions
- ambiguityService - Conflict management

## Data Flow

1. **Document Upload** → DocumentUploadModal
2. **Image Preview** → Shows user what was uploaded
3. **Processing** → Backend processes with Gemini + OCR
4. **Extraction** → Fields extracted with confidence scores
5. **Vault Storage** → Fields routed to appropriate sections
6. **Deduplication** → Conflicts tracked as ambiguities
7. **Autofill** → User fills forms, AI suggests values
8. **Learning** → System tracks patterns for future suggestions

## Configuration Files

- **.env** - Environment variables (MongoDB, API keys, etc.)
- **vite.config.ts** - Vite configuration
- **tsconfig.json** - TypeScript configuration
- **tailwind.config.js** - Tailwind CSS configuration
- **docker-compose.yml** - Multi-container orchestration
- **Dockerfile** - Container images for frontend/backend

## Getting Started

1. Install dependencies for both frontend and backend
2. Configure environment variables
3. Run MongoDB (locally or using Docker)
4. Start backend: `npm run dev`
5. Start frontend: `npm run dev`
6. Access at http://localhost:5173
