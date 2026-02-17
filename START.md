# Start Application

## Local Development

### 1. Start Backend (Terminal 1)
```bash
node server/index.js
```

Wait for: `Connected to MongoDB` and `Server running on port 5000`

### 2. Start Frontend (Terminal 2)
```bash
cd client
npm start
```

Browser opens at http://localhost:3000

## Deploy to Render

```bash
git add .
git commit -m "Deploy"
git push origin main
```

Set environment variables on Render dashboard:
- Backend: MONGODB_URI, JWT_SECRET, NODE_ENV=production
- Frontend: REACT_APP_API_URL=https://lifeline-x-backend.onrender.com/api
