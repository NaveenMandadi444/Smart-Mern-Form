# VisionForm Assist - Document-Aware Identity Vault

A comprehensive React + Node.js full-stack application that provides intelligent form autofill capabilities powered by an AI-driven document vault system. Extract data from government documents, store in MongoDB, and intelligently suggest values when filling forms using Google Gemini AI.

## 🎯 Key Features

- **Document Processing**: Upload and extract data from Aadhaar, PAN, Passport, Education certificates
- **Smart Vault**: MongoDB-backed document vault with section-based isolation
- **AI-Powered Autofill**: Gemini AI-powered field matching and suggestions
- **Deduplication**: Levenshtein distance-based duplicate detection
- **Conflict Resolution**: Track ambiguities with manual resolution UI
- **Field Learning**: Track user patterns and suggest fields for future forms
- **Image Preview**: Shows uploaded document image with full preview before processing

## 📦 Tech Stack

### Frontend

- React 18.3.1 with TypeScript
- Vite (build tool)
- Tailwind CSS
- Sonner (toast notifications)
- Axios (HTTP client)
- React Router DOM

### Backend

- Node.js + Express.js
- MongoDB + Mongoose
- Google Gemini AI
- Google Vision API (OCR)
- JWT Authentication
- Multer (file uploads)

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key
- Google Vision API credentials

### Installation

#### 1. Clone and Setup

```bash
cd mernForm1
```

#### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend will run on `http://localhost:5173`

#### 3. Backend Setup

```bash
cd ../backend
npm install
npm run dev
```

Backend will run on `http://localhost:5000`

### Environment Configuration

#### Backend (.env)

```env
MONGODB_URI=mongodb://localhost:27017/visionform
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
GOOGLE_VISION_API_KEY=your_google_vision_key
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_API_TIMEOUT=30000
```

## 📋 Project Structure

```
mernForm1/
├── frontend/                 # React TypeScript application
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities
│   │   ├── App.tsx          # Main app component
│   │   ├── main.tsx         # Entry point
│   │   └── index.css        # Tailwind styles
│   ├── vite.config.ts       # Vite configuration
│   └── package.json
│
├── backend/                  # Express.js server
│   ├── models/              # Mongoose schemas
│   ├── controllers/         # Request handlers
│   ├── services/            # Business logic
│   ├── routes/              # API routes
│   ├── middleware/          # Auth & error handling
│   ├── config/              # Database & auth config
│   ├── server.js            # Entry point
│   └── package.json
│
├── docker-compose.yml       # Docker container setup
└── README.md                # This file
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Token verification

### Documents

- `POST /api/documents/upload` - Upload document
- `POST /api/documents/process` - Process & extract fields
- `GET /api/documents` - Get user documents
- `GET /api/documents/:id` - Get document details

### Vault

- `GET /api/vault/sections` - Get all vault sections
- `GET /api/vault/section/:type` - Get section details
- `GET /api/vault/fields/:sectionId` - Get section fields
- `POST /api/vault/fields` - Add field
- `PUT /api/vault/fields/:id` - Update field
- `DELETE /api/vault/fields/:id` - Delete field

### Autofill

- `POST /api/autofill/suggest` - Get autofill suggestions
- `POST /api/autofill/alternatives` - Get alternative sources
- `GET /api/autofill/learned-fields` - Get learned patterns
- `POST /api/autofill/format` - Format field value

### Ambiguities

- `GET /api/ambiguities` - Get conflicts
- `PUT /api/ambiguities/:id/resolve` - Resolve conflict
- `DELETE /api/ambiguities/:id` - Clear conflict

## 🗄️ Database Schema

### Collections

**users** - User accounts

- \_id, email, password, fullName, createdAt, updatedAt

**vault_documents** - Uploaded documents

- \_id, userId, documentType, uploadedAt, status, fileName, imageUrl, previewUrl

**vault_sections** - Document sections (PERSONAL_MASTER, AADHAAR_SECTION, etc.)

- \_id, userId, sectionType, authority, sourceDocument

**vault_fields** - Extracted fields

- \_id, sectionId, userId, fieldName, fieldValue, confidence, extractedFrom, metadata

**vault_ambiguities** - Conflicting values

- \_id, userId, fieldName, values, resolutionStatus, resolvedValue

**learned_fields** - User field patterns

- \_id, userId, fieldName, usageCount, extractedValues, formTypes, lastUsed

## 🔐 Security

- JWT-based authentication
- Password hashing with bcryptjs
- User data isolation (userId filter on all queries)
- CORS configuration
- Environment variable protection

## 🎓 Vault Authority Hierarchy

- **PERSONAL_MASTER**: 100 (Summary identity)
- **AADHAAR_SECTION**: 95 (Aadhaar-specific)
- **PASSPORT_SECTION**: 90 (Passport-specific)
- **PAN_SECTION**: 85 (PAN-specific)
- **EDUCATION**: 70 (Education documents)

## 🚀 Deployment

### Using Docker Compose

```bash
docker-compose up
```

### Manual Deployment

**Frontend**: Deploy to Vercel, Netlify, or Docker
**Backend**: Deploy to Heroku, Railway, DigitalOcean, or Docker
**Database**: Use MongoDB Atlas (cloud)

## 📝 Document Processing Flow

1. User uploads document with image preview
2. Backend receives file and creates database record
3. Gemini AI classifies document type
4. OCR extracts text content
5. Gemini extracts structured fields
6. Deduplication checks for conflicts
7. Fields routed to appropriate vault section
8. Personal Master updated based on authority
9. Ambiguities tracked for manual resolution

## 🎯 Features Roadmap

- [ ] Multi-language document support
- [ ] Batch document processing
- [ ] Advanced analytics dashboard
- [ ] Document audit trail
- [ ] Export & backup functionality
- [ ] Mobile app support
- [ ] Form template builder
- [ ] API rate limiting dashboard

## 🤝 Contributing

1. Create feature branch
2. Make changes
3. Test thoroughly
4. Submit pull request

## 📄 License

MIT License - feel free to use this project

## 🆘 Support

For issues or questions, please open an issue in the repository.

---

**Built with ❤️ using React, Node.js, and Google Gemini AI**
