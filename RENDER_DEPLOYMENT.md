# 🚀 Lifeline X Hospital System - Render Deployment Guide

## 📋 Why Render?

- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy deployment from Git
- ✅ Better for full-stack apps
- ✅ Persistent storage support
- ✅ Built-in database support

---

## 🎯 Deployment Strategy

We'll deploy **Backend** and **Frontend** separately for better performance:

1. **Backend (Node.js)** → Render Web Service
2. **Frontend (React)** → Render Static Site

---

## 🔧 Step 1: Prepare Your Project

### 1.1 Update Backend for Production

Edit `server/index.js` - Update CORS:

```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [process.env.FRONTEND_URL || 'https://your-frontend.onrender.com']
    : ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 1.2 Create Build Script for Frontend

Ensure `client/package.json` has:

```json
{
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  }
}
```

### 1.3 Update Frontend API URL

Edit `client/src/api/axios.ts`:

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
});

// Add token to all requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle 401 responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 1.4 Commit Changes

```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

---

## 🖥️ Step 2: Deploy Backend (Node.js API)

### 2.1 Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with GitHub/GitLab/Email
3. Verify your email

### 2.2 Create New Web Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub/GitLab repository
3. Select your repository: `lifeline-x-hospital`

### 2.3 Configure Backend Service

**Basic Settings:**
- **Name:** `lifeline-x-backend` (or your choice)
- **Region:** Choose closest to you
- **Branch:** `main`
- **Root Directory:** Leave empty (or `.`)
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:**
  ```bash
  npm install
  ```

- **Start Command:**
  ```bash
  node server/index.js
  ```

**Advanced Settings:**
- **Auto-Deploy:** Yes (recommended)

### 2.4 Add Environment Variables

Click **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | `mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0` |
| `JWT_SECRET` | `your-super-secret-jwt-key-here-1234567898` |
| `NODE_ENV` | `production` |
| `PORT` | `5000` |
| `FRONTEND_URL` | `https://your-frontend-name.onrender.com` (add after frontend deployment) |

### 2.5 Deploy Backend

1. Click **"Create Web Service"**
2. Wait 3-5 minutes for deployment
3. Note your backend URL: `https://lifeline-x-backend.onrender.com`

---

## 🌐 Step 3: Deploy Frontend (React App)

### 3.1 Create Static Site

1. Click **"New +"** → **"Static Site"**
2. Connect your repository again
3. Select your repository: `lifeline-x-hospital`

### 3.2 Configure Frontend Service

**Basic Settings:**
- **Name:** `lifeline-x-frontend` (or your choice)
- **Region:** Same as backend
- **Branch:** `main`
- **Root Directory:** `client`

**Build Settings:**
- **Build Command:**
  ```bash
  npm install && npm run build
  ```

- **Publish Directory:**
  ```
  build
  ```

### 3.3 Add Environment Variables

Click **"Environment"** tab and add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | `https://lifeline-x-backend.onrender.com/api` |

### 3.4 Add Redirect Rules

Create `client/public/_redirects`:

```
/*    /index.html   200
```

This ensures React Router works correctly.

### 3.5 Deploy Frontend

1. Click **"Create Static Site"**
2. Wait 3-5 minutes for deployment
3. Note your frontend URL: `https://lifeline-x-frontend.onrender.com`

---

## 🔄 Step 4: Update Backend with Frontend URL

1. Go to your **Backend service** on Render
2. Click **"Environment"** tab
3. Update `FRONTEND_URL` with your actual frontend URL
4. Click **"Save Changes"**
5. Backend will automatically redeploy

---

## 🗄️ Step 5: Configure MongoDB Atlas

1. Go to [MongoDB Atlas](https://cloud.mongodb.com)
2. Navigate to **Network Access**
3. Click **"Add IP Address"**
4. Select **"Allow Access from Anywhere"** (`0.0.0.0/0`)
5. Click **"Confirm"**

---

## ✅ Step 6: Test Your Deployment

### 6.1 Test Backend

Visit: `https://lifeline-x-backend.onrender.com/api/auth/login`

You should see a response (even if error, it means backend is running)

### 6.2 Test Frontend

1. Visit: `https://lifeline-x-frontend.onrender.com`
2. You should see the home page
3. Click **"Get Started"** or **"Sign In"**
4. Create a new account
5. Login and test all modules

---

## 🎨 Step 7: Custom Domain (Optional)

### For Frontend:

1. Go to your Static Site on Render
2. Click **"Settings"** → **"Custom Domains"**
3. Click **"Add Custom Domain"**
4. Enter your domain: `hospital.yourdomain.com`
5. Add the CNAME record to your DNS provider:
   ```
   CNAME hospital your-app.onrender.com
   ```
6. Wait for DNS propagation (up to 48 hours)

### For Backend:

1. Go to your Web Service on Render
2. Click **"Settings"** → **"Custom Domains"**
3. Add: `api.yourdomain.com`
4. Add CNAME record to DNS

---

## 📊 Step 8: Monitor Your App

### View Logs:

1. Go to your service on Render
2. Click **"Logs"** tab
3. Monitor real-time logs

### Check Metrics:

1. Click **"Metrics"** tab
2. View CPU, Memory, and Bandwidth usage

---

## 🔧 Troubleshooting

### Issue: Backend not connecting to MongoDB

**Solution:**
- Verify MongoDB URI is correct
- Check MongoDB Atlas network access allows all IPs
- Check environment variables are set correctly

### Issue: Frontend can't reach backend (CORS error)

**Solution:**
Update `server/index.js`:
```javascript
app.use(cors({
  origin: [
    'https://your-frontend.onrender.com',
    'http://localhost:3000'
  ],
  credentials: true
}));
```

### Issue: 404 on page refresh

**Solution:**
Ensure `client/public/_redirects` exists with:
```
/*    /index.html   200
```

### Issue: Build fails

**Solution:**
1. Check build logs in Render dashboard
2. Test build locally:
   ```bash
   cd client
   npm install
   npm run build
   ```
3. Fix any errors and push again

### Issue: Slow cold starts

**Solution:**
- Render free tier has cold starts (15-30 seconds)
- Upgrade to paid plan for always-on instances
- Or use a service like [UptimeRobot](https://uptimerobot.com) to ping your app every 5 minutes

---

## 💰 Pricing

### Free Tier:
- ✅ 750 hours/month for web services
- ✅ 100 GB bandwidth
- ✅ Automatic HTTPS
- ⚠️ Services spin down after 15 min of inactivity
- ⚠️ Cold start time: 15-30 seconds

### Paid Plans:
- **Starter:** $7/month - Always on, no cold starts
- **Standard:** $25/month - More resources
- **Pro:** $85/month - High performance

---

## 🔄 Continuous Deployment

Render automatically deploys when you push to GitHub:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Render automatically deploys!
```

---

## 📱 Your Deployed URLs

After deployment:

- **Frontend:** `https://lifeline-x-frontend.onrender.com`
- **Backend API:** `https://lifeline-x-backend.onrender.com`
- **Login:** `https://lifeline-x-frontend.onrender.com/auth`
- **Dashboard:** `https://lifeline-x-frontend.onrender.com/app/dashboard`

---

## 🎯 Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] Backend service created on Render
- [ ] Backend environment variables added
- [ ] Backend deployed successfully
- [ ] Frontend service created on Render
- [ ] Frontend environment variables added
- [ ] Frontend deployed successfully
- [ ] Backend updated with frontend URL
- [ ] MongoDB network access configured
- [ ] Authentication tested
- [ ] All modules working
- [ ] Custom domain configured (optional)

---

## 🆚 Render vs Vercel

| Feature | Render | Vercel |
|---------|--------|--------|
| Backend Support | ✅ Excellent | ⚠️ Serverless only |
| Free Tier | ✅ 750 hrs/month | ✅ Unlimited |
| Cold Starts | ⚠️ Yes (free tier) | ✅ No |
| Database Support | ✅ Built-in | ❌ External only |
| Pricing | $7/month starter | $20/month pro |
| Best For | Full-stack apps | Frontend + Serverless |

---

## 📞 Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)

---

## 🎉 Deployment Complete!

Your Lifeline X Hospital System is now live on Render!

**Next Steps:**
1. Share URLs with your team
2. Create admin accounts
3. Start managing hospital operations
4. Monitor logs and metrics
5. Consider upgrading for better performance

---

## 🔐 Security Best Practices

1. **Change JWT Secret:**
   - Use a strong, random secret
   - Never commit secrets to Git

2. **MongoDB Security:**
   - Use strong passwords
   - Restrict IP access if possible
   - Enable MongoDB authentication

3. **Environment Variables:**
   - Never hardcode sensitive data
   - Use Render's environment variables
   - Rotate secrets regularly

4. **HTTPS:**
   - Render provides automatic HTTPS
   - Always use HTTPS in production

---

**Deployed Successfully! 🎊**

Your hospital management system is now accessible worldwide on Render!
