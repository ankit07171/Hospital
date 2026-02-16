# Render Deployment Fix - CORS Issue Resolution

## Problem
CORS error: "No 'Access-Control-Allow-Origin' header is present on the requested resource"

## Root Causes Fixed
1. ✅ Frontend `.env.production` had localhost URL instead of Render backend URL
2. ✅ Inconsistent API base URL between `axios.ts` and `Auth.jsx`
3. ✅ Added explicit CORS headers to auth routes
4. ✅ Server CORS configuration already set to allow all origins

---

## STEP 1: Update Environment Variables on Render

### Backend Service (lifeline-x-backend.onrender.com)
Go to your backend service → Environment → Add these variables:

```
MONGODB_URI=mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0
JWT_SECRET=your_super_secret_jwt_key_here_change_this
NODE_ENV=production
FRONTEND_URL=https://hospital-1-5hyf.onrender.com
PORT=5000
```

### Frontend Service (hospital-1-5hyf.onrender.com)
Go to your frontend service → Environment → Add this variable:

```
REACT_APP_API_URL=https://lifeline-x-backend.onrender.com/api
```

---

## STEP 2: Redeploy Both Services

### Option A: Manual Redeploy (Recommended)
1. Go to Render Dashboard
2. Click on **Backend Service** → Click "Manual Deploy" → Select "Clear build cache & deploy"
3. Wait for backend to finish deploying
4. Click on **Frontend Service** → Click "Manual Deploy" → Select "Clear build cache & deploy"
5. Wait for frontend to finish deploying

### Option B: Git Push (Alternative)
```bash
git add .
git commit -m "Fix CORS configuration for Render deployment"
git push origin main
```

---

## STEP 3: Verify Deployment

### Check Backend
1. Open: https://lifeline-x-backend.onrender.com
2. You should see a response (even if it's an error, it means the server is running)

### Check Frontend
1. Open: https://hospital-1-5hyf.onrender.com
2. Try to sign up or log in
3. Open browser DevTools (F12) → Network tab
4. Check if the auth request succeeds

### Check Logs
1. Go to Render Dashboard → Backend Service → Logs
2. Look for:
   - "Connected to MongoDB" ✅
   - "Server running on port 5000" ✅
   - No CORS errors ✅

---

## STEP 4: Test Authentication

1. Go to: https://hospital-1-5hyf.onrender.com
2. Click "Sign Up" or "Login"
3. Fill in the form
4. Submit
5. You should be redirected to the dashboard

---

## What Was Changed in Code

### 1. `client/.env.production`
```env
# BEFORE
REACT_APP_API_URL = http://localhost:5000/api

# AFTER
REACT_APP_API_URL=https://lifeline-x-backend.onrender.com/api
```

### 2. `client/src/api/axios.ts`
```typescript
// BEFORE
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',

// AFTER
baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
```

### 3. `client/src/pages/Auth.jsx`
```javascript
// Moved API_BASE_URL inside handleSubmit function for consistency
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

### 4. `server/routes/auth.js`
```javascript
// Added explicit CORS headers middleware
router.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});
```

---

## Troubleshooting

### If CORS Error Persists:

1. **Clear Browser Cache**
   - Press Ctrl+Shift+Delete
   - Clear cached images and files
   - Try in Incognito/Private mode

2. **Check Environment Variables**
   - Render Dashboard → Service → Environment
   - Verify `REACT_APP_API_URL` is set correctly on frontend
   - Verify `FRONTEND_URL` is set correctly on backend

3. **Check Build Logs**
   - Render Dashboard → Service → Logs
   - Look for build errors
   - Ensure environment variables are being read

4. **Verify Backend is Running**
   - Visit: https://lifeline-x-backend.onrender.com
   - Should see some response (not 404)

5. **Check Network Tab**
   - Open DevTools (F12) → Network tab
   - Try to login
   - Click on the failed request
   - Check "Headers" tab → "Request URL" should be: `https://lifeline-x-backend.onrender.com/api/auth/login`

### If MongoDB Connection Fails:

1. Check `MONGODB_URI` environment variable on backend
2. Verify MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
3. Check backend logs for connection errors

---

## Success Indicators

✅ Backend logs show: "Connected to MongoDB"
✅ Backend logs show: "Server running on port 5000"
✅ Frontend loads without errors
✅ Login/Signup works without CORS errors
✅ After login, redirected to dashboard
✅ Dashboard loads patient/appointment data

---

## Next Steps After Successful Deployment

1. Test all features:
   - Patient Management
   - Doctor Management
   - Appointments
   - Lab Tests
   - Billing
   - Emergency
   - Pharmacy

2. Monitor logs for any errors

3. Set up custom domain (optional)

---

## Support

If issues persist after following all steps:
1. Check Render service status
2. Verify all environment variables are set
3. Clear build cache and redeploy
4. Check browser console for specific error messages
