# Complete File Structure

## Project: VisionForm Assist

### Root Directory

```
mernForm1/
├── .gitignore                          # Git ignore rules
├── README.md                           # Project documentation
├── PROJECT_STRUCTURE.md                # Project structure overview
├── DEVELOPMENT.md                      # Development guide
├── docker-compose.yml                  # Docker container orchestration
│
├── frontend/                           # React + TypeScript frontend
│   ├── .gitignore                      # Frontend git ignore
│   ├── .env                            # Frontend environment variables
│   ├── .eslintrc.cjs                   # ESLint configuration
│   ├── vite.config.ts                  # Vite build configuration
│   ├── tsconfig.json                   # TypeScript configuration
│   ├── tsconfig.node.json              # TypeScript config for Vite
│   ├── tailwind.config.js              # Tailwind CSS configuration
│   ├── postcss.config.js               # PostCSS configuration
│   ├── package.json                    # Frontend dependencies
│   ├── Dockerfile                      # Docker image for frontend
│   ├── index.html                      # HTML entry point
│   │
│   └── src/
│       ├── main.tsx                    # Application entry point
│       ├── App.tsx                     # Root component
│       ├── index.css                   # Global styles
│       │
│       ├── pages/
│       │   ├── Auth.tsx                # Login/Register page
│       │   ├── Dashboard.tsx           # Main dashboard
│       │   ├── DataVault.tsx           # Vault management
│       │   └── FormAssistant.tsx       # Form assistance page
│       │
│       ├── components/
│       │   └── DocumentUploadModal.tsx  # Document upload UI
│       │
│       ├── services/
│       │   ├── index.ts                # Service exports
│       │   └── api.ts                  # API service layer
│       │
│       ├── hooks/
│       │   ├── index.ts                # Hook exports
│       │   └── useAuth.ts              # Authentication hook
│       │
│       └── lib/
│           ├── index.ts                # Library exports
│           ├── utils.ts                # Utility functions
│           └── constants.ts            # Frontend constants
│
└── backend/                            # Node.js + Express backend
    ├── .gitignore                      # Backend git ignore
    ├── .env                            # Backend environment variables
    ├── server.js                       # Express app entry point
    ├── Dockerfile                      # Docker image for backend
    ├── package.json                    # Backend dependencies
    │
    ├── models/                         # Mongoose schemas
    │   ├── User.js                     # User model
    │   ├── VaultSection.js             # Vault section model
    │   ├── VaultField.js               # Vault field model
    │   ├── VaultDocument.js            # Vault document model
    │   ├── VaultAmbiguity.js           # Ambiguity tracking model
    │   └── LearnedField.js             # Learned field patterns
    │
    ├── controllers/                    # Request handlers
    │   ├── authController.js           # Authentication endpoints
    │   ├── documentController.js       # Document operations
    │   ├── vaultController.js          # Vault operations
    │   ├── autofillController.js       # Autofill suggestions
    │   └── ambiguityController.js      # Ambiguity management
    │
    ├── services/                       # Business logic
    │   ├── geminiService.js            # Google Gemini AI integration
    │   ├── ocrService.js               # Google Vision API integration
    │   ├── documentVaultService.js     # Vault management logic
    │   ├── deduplicationService.js     # Duplicate detection
    │   └── learningService.js          # Field learning logic
    │
    ├── routes/                         # API route definitions
    │   ├── authRoutes.js               # Authentication routes
    │   ├── documentRoutes.js           # Document routes
    │   ├── vaultRoutes.js              # Vault routes
    │   ├── autofillRoutes.js           # Autofill routes
    │   └── ambiguityRoutes.js          # Ambiguity routes
    │
    ├── middleware/                     # Express middleware
    │   └── auth.js                     # Auth & error handling
    │
    └── config/                         # Configuration
        ├── database.js                 # MongoDB connection
        ├── auth.js                     # JWT & password hashing
        └── constants.js                # Backend constants
```

## Key Files Summary

### Frontend Entry Points

- **main.tsx**: React app initialization with Router
- **App.tsx**: Route definitions and protection logic
- **vite.config.ts**: Proxy configuration to backend API

### Backend Entry Point

- **server.js**: Express app setup with all middleware and routes

### Models (MongoDB Schemas)

1. **User.js**: User authentication data
2. **VaultSection.js**: Document sections with authority levels
3. **VaultField.js**: Individual extracted fields
4. **VaultDocument.js**: Uploaded document metadata
5. **VaultAmbiguity.js**: Conflicting field values
6. **LearnedField.js**: User field usage patterns

### API Controllers

1. **authController.js**: register, login, verify
2. **documentController.js**: upload, process, get documents
3. **vaultController.js**: section management and field CRUD
4. **autofillController.js**: suggestions and alternatives
5. **ambiguityController.js**: conflict tracking and resolution

### Services

1. **geminiService.js**: AI-powered field extraction and matching
2. **ocrService.js**: Text extraction from images
3. **documentVaultService.js**: Section routing and authority management
4. **deduplicationService.js**: Duplicate detection and ambiguity tracking
5. **learningService.js**: User pattern tracking

### Frontend Components

1. **Auth.tsx**: Login/Register UI
2. **Dashboard.tsx**: Main dashboard with upload options
3. **DataVault.tsx**: Vault browser and manager
4. **FormAssistant.tsx**: Form filling assistance
5. **DocumentUploadModal.tsx**: Upload UI with image preview

## Environment Configuration

### Backend (.env)

```
MONGODB_URI=mongodb://localhost:27017/visionform
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_key
GOOGLE_VISION_API_KEY=your_vision_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
```

## Database Collections

- **users** - User accounts
- **vault_documents** - Uploaded documents with image URLs
- **vault_sections** - Document sections (PERSONAL_MASTER, etc.)
- **vault_fields** - Extracted fields from documents
- **vault_ambiguities** - Conflicting field values
- **learned_fields** - User pattern tracking

## Dependencies

### Frontend

- React 18.3.1
- TypeScript 5.2.2
- Vite 5.0.8
- Tailwind CSS 3.3.6
- Sonner (toast notifications)
- Axios (HTTP client)
- React Router DOM 6.20.0
- Lucide React (icons)

### Backend

- Express.js 4.18.2
- MongoDB & Mongoose 8.0.0
- Google Generative AI
- Google Cloud Vision API
- JWT & bcryptjs for auth
- Multer for file uploads
- Helmet for security
- Morgan for logging

## Running the Application

### Option 1: Separate Terminals

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
npm run dev
```

### Option 2: Docker Compose

```bash
docker-compose up
```

Visit http://localhost:5173

---

This complete structure supports the full VisionForm Assist workflow with intelligent document processing and AI-powered autofill capabilities.
