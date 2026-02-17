# LifeLine-X Hospital Management System

## Deploy to Render

### 1. Push to GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### 2. Set Environment Variables on Render

**Backend Service:**
```
MONGODB_URI=mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0
JWT_SECRET=lifeline_x_secret_key_2024_secure
NODE_ENV=production
PORT=5000
```

**Frontend Service:**
```
REACT_APP_API_URL=https://lifeline-x-backend.onrender.com/api
```

### 3. Deploy
- Render will auto-deploy from GitHub
- Wait 15-20 minutes
- Test: https://hospital-1-5hyf.onrender.com

## Local Development

**Start Backend:**
```bash
node server/index.js
```

**Start Frontend:**
```bash
cd client
npm start
```

## URLs
- Frontend: https://hospital-1-5hyf.onrender.com
- Backend: https://lifeline-x-backend.onrender.com
