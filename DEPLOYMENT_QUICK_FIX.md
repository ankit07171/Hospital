# Quick Fix for CORS Error - Copy & Paste Guide

## 🚀 IMMEDIATE ACTION REQUIRED

### 1️⃣ Set Environment Variables on Render

#### Backend Service Environment Variables
```
MONGODB_URI=mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0
JWT_SECRET=lifeline_x_secret_key_2024_secure
NODE_ENV=production
FRONTEND_URL=https://hospital-1-5hyf.onrender.com
PORT=5000
```

#### Frontend Service Environment Variables
```
REACT_APP_API_URL=https://lifeline-x-backend.onrender.com/api
```

---

### 2️⃣ Redeploy Services

**Backend First:**
1. Go to: https://dashboard.render.com
2. Click: `lifeline-x-backend` service
3. Click: "Manual Deploy" button (top right)
4. Select: "Clear build cache & deploy"
5. Wait for deployment to complete (5-10 minutes)

**Frontend Second:**
1. Click: `hospital-1-5hyf` service
2. Click: "Manual Deploy" button (top right)
3. Select: "Clear build cache & deploy"
4. Wait for deployment to complete (5-10 minutes)

---

### 3️⃣ Test Your App

Open: https://hospital-1-5hyf.onrender.com

Try to login with:
- Email: test@example.com
- Password: test123

Or create a new account.

---

## ✅ What We Fixed

1. **Frontend Environment**: Changed API URL from localhost to Render backend
2. **API Configuration**: Made axios base URL consistent across all files
3. **CORS Headers**: Added explicit CORS headers to auth routes
4. **Server CORS**: Already configured to allow all origins

---

## 🔍 How to Check if It's Working

### Backend Health Check
Visit: https://lifeline-x-backend.onrender.com

Should see: Some response (even error is OK, means server is running)

### Frontend Health Check
Visit: https://hospital-1-5hyf.onrender.com

Should see: Your home page with login/signup

### Auth Check
1. Open: https://hospital-1-5hyf.onrender.com
2. Open DevTools (F12) → Network tab
3. Try to login
4. Check if request to `https://lifeline-x-backend.onrender.com/api/auth/login` succeeds

---

## 🆘 Still Getting CORS Error?

### Quick Fixes:

1. **Clear Browser Cache**
   ```
   Ctrl + Shift + Delete → Clear cache → Try again
   ```

2. **Try Incognito Mode**
   ```
   Ctrl + Shift + N (Chrome)
   Ctrl + Shift + P (Firefox)
   ```

3. **Verify Environment Variables**
   - Render Dashboard → Service → Environment tab
   - Make sure `REACT_APP_API_URL` is there on frontend
   - Make sure `MONGODB_URI` is there on backend

4. **Check Logs**
   - Render Dashboard → Service → Logs tab
   - Look for "Connected to MongoDB" ✅
   - Look for "Server running on port 5000" ✅

---

## 📝 Git Commands (If You Want to Push Changes)

```bash
# Add all changes
git add .

# Commit with message
git commit -m "Fix CORS configuration for Render deployment"

# Push to main branch
git push origin main
```

This will trigger automatic deployment on Render.

---

## 🎯 Expected Result

After following these steps:
- ✅ No CORS errors in browser console
- ✅ Login/Signup works
- ✅ Redirected to dashboard after login
- ✅ Dashboard shows data from MongoDB

---

## 📞 Need Help?

Check these in order:
1. Backend logs on Render
2. Frontend logs on Render
3. Browser console (F12)
4. Network tab in DevTools

Look for specific error messages and check against the troubleshooting guide in `RENDER_FIX_CHECKLIST.md`.
