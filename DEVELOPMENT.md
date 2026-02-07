# Development Guide

## Setup Instructions

### 1. Global Setup

```bash
cd mernForm1
```

### 2. Backend Setup

```bash
cd backend
npm install

# Create .env file with required variables
# Start development server
npm run dev
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install

# Start development server
npm run dev
```

### 4. MongoDB Setup

**Option A: Local MongoDB**

```bash
# Windows: Download from mongodb.com
# Or use Docker
docker run -d -p 27017:27017 --name mongodb mongo:7.0
```

**Option B: MongoDB Atlas**

- Create account at mongodb.com
- Get connection string
- Add to backend/.env

## Available Commands

### Backend

```bash
npm run dev      # Start development server with hot reload
npm start        # Production server
npm test         # Run tests
```

### Frontend

```bash
npm run dev      # Start dev server on port 5173
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication

All protected routes require Bearer token in Authorization header:

```
Authorization: Bearer <token>
```

### Key Endpoints

#### Auth

```
POST /auth/register
POST /auth/login
GET /auth/verify
```

#### Documents

```
POST /documents/upload
POST /documents/process
GET /documents
GET /documents/:id
```

#### Vault

```
GET /vault/sections
GET /vault/section/:type
GET /vault/fields/:sectionId
POST /vault/fields
PUT /vault/fields/:id
DELETE /vault/fields/:id
```

#### Autofill

```
POST /autofill/suggest
POST /autofill/alternatives
GET /autofill/learned-fields
POST /autofill/format
```

#### Ambiguities

```
GET /ambiguities
PUT /ambiguities/:id/resolve
DELETE /ambiguities/:id
```

## Troubleshooting

### MongoDB Connection Failed

- Check MONGODB_URI in .env
- Ensure MongoDB is running
- Verify connection string format

### Gemini API Errors

- Verify GEMINI_API_KEY in .env
- Check API quotas in Google Cloud Console
- Ensure API is enabled

### CORS Issues

- Check FRONTEND_URL in backend .env
- Verify VITE_API_URL in frontend .env
- Restart backend server

### Port Already in Use

```bash
# Backend (5000)
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Frontend (5173)
netstat -ano | findstr :5173
taskkill /PID <PID> /F
```

## Testing

### Manual Testing Workflow

1. Register new user
2. Upload test document (Aadhaar/PAN)
3. Verify fields extracted in Vault
4. Check image preview displayed
5. Test autofill suggestions
6. Resolve any ambiguities

### Test Documents

Use sample government documents or create test images.

## Performance Optimization

- Enable MongoDB indexes
- Cache Gemini API responses
- Implement request debouncing
- Optimize image compression
- Use React Query caching

## Security Checklist

- [ ] Change JWT_SECRET in production
- [ ] Use strong MongoDB passwords
- [ ] Enable MongoDB authentication
- [ ] Validate all file uploads
- [ ] Implement rate limiting
- [ ] Use HTTPS in production
- [ ] Secure Google API keys
- [ ] Enable CORS only for trusted domains

## Deployment

### Docker Deployment

```bash
docker-compose up
```

### Manual Deployment

Frontend: Vercel/Netlify
Backend: Heroku/Railway/DigitalOcean
Database: MongoDB Atlas

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/feature-name

# Make changes and commit
git add .
git commit -m "feat: description"

# Push and create PR
git push origin feature/feature-name
```

## Code Standards

- Use TypeScript for components
- Follow functional component patterns
- Use hooks for state management
- Add error boundaries
- Implement loading states
- Use consistent naming conventions

## Resources

- [React Documentation](https://react.dev)
- [Express.js Guide](https://expressjs.com)
- [MongoDB Documentation](https://docs.mongodb.com)
- [Google Gemini API](https://ai.google.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
