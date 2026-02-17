# LifeLine-X Hospital Management System

## Quick Start

### Local Development

**Terminal 1 - Backend:**
```bash
node server/index.js
```
Wait for: "Connected to MongoDB" ✅

**Terminal 2 - Frontend:**
```bash
cd client
npm start
```
Browser opens at http://localhost:3000 ✅

### Deploy to Render

1. **Push code:**
```bash
git add .
git commit -m "Deploy to Render"
git push origin main
```

2. **Set environment variables on Render:**

**Backend:**
- MONGODB_URI=`mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0`
- JWT_SECRET=`lifeline_x_secret_key_2024_secure`
- NODE_ENV=`production`
- PORT=`5000`

**Frontend:**
- REACT_APP_API_URL=`https://lifeline-x-backend.onrender.com/api`

3. **Wait 15-20 minutes for deployment**

4. **Test:** https://hospital-1-5hyf.onrender.com

## Troubleshooting

### Issue: Dashboard shows no data
**Solution:** Backend server is not running. Start it with `node server/index.js`

### Issue: Page refresh shows 404
**Solution:** This is normal in development. In production (Render), it's handled by `_redirects` file.

### Issue: Auth errors not showing
**Solution:** Already fixed. Errors display in red alert box.

## URLs
- Frontend: https://hospital-1-5hyf.onrender.com
- Backend: https://lifeline-x-backend.onrender.com
