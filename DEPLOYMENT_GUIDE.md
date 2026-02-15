# Lifeline X Hospital System - Vercel Deployment Guide

## 📋 Prerequisites

Before deploying, ensure you have:
- A [Vercel account](https://vercel.com/signup)
- [Vercel CLI](https://vercel.com/cli) installed (optional but recommended)
- MongoDB Atlas account with your database URI
- Git repository (GitHub, GitLab, or Bitbucket)

---

## 🚀 Deployment Steps

### Step 1: Prepare Your Project

1. **Update API Base URL for Production**

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

// Handle 401 responses (unauthorized)
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

2. **Create Environment Variable File for Client**

Create `client/.env.production`:

```env
REACT_APP_API_URL=https://your-app-name.vercel.app/api
```

3. **Update Auth.jsx to use environment variable**

Edit `client/src/pages/Auth.jsx`:

```javascript
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const handleSubmit = async () => {
  setError("");
  setLoading(true);

  try {
    const url = mode === "signup"
      ? `${API_BASE_URL}/auth/signup`
      : `${API_BASE_URL}/auth/login`;

    const payload = mode === "signup"
      ? form
      : { email: form.email, password: form.password };

    const res = await axios.post(url, payload);

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    navigate("/app/dashboard");
  } catch (err) {
    setError(err.response?.data?.error || "Something went wrong");
  } finally {
    setLoading(false);
  }
};
```

4. **Add build script to client package.json**

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

5. **Update CORS in server/index.js**

```javascript
const cors = require('cors');

// Update CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app-name.vercel.app'] 
    : ['http://localhost:3000'],
  credentials: true
}));
```

---

### Step 2: Push to Git Repository

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Prepare for Vercel deployment"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/yourusername/lifeline-x.git

# Push to main branch
git push -u origin main
```

---

### Step 3: Deploy to Vercel (Method 1: Web Dashboard)

1. **Go to [Vercel Dashboard](https://vercel.com/dashboard)**

2. **Click "Add New Project"**

3. **Import Your Git Repository**
   - Connect your GitHub/GitLab/Bitbucket account
   - Select your repository
   - Click "Import"

4. **Configure Project Settings**

   **Framework Preset:** Other (or Custom)
   
   **Root Directory:** Leave as `.` (root)
   
   **Build Command:**
   ```bash
   cd client && npm install && npm run build
   ```
   
   **Output Directory:**
   ```
   client/build
   ```
   
   **Install Command:**
   ```bash
   npm install && cd client && npm install && cd ..
   ```

5. **Add Environment Variables**

   Click "Environment Variables" and add:

   | Name | Value |
   |------|-------|
   | `MONGODB_URI` | `mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0` |
   | `JWT_SECRET` | `your-super-secret-jwt-key-here-1234567898` |
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |

6. **Click "Deploy"**

   Wait for the deployment to complete (usually 2-5 minutes)

---

### Step 4: Deploy to Vercel (Method 2: CLI)

1. **Install Vercel CLI**

```bash
npm install -g vercel
```

2. **Login to Vercel**

```bash
vercel login
```

3. **Deploy**

```bash
# From project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Select your account
# - Link to existing project? No
# - Project name? lifeline-x-hospital
# - Directory? ./
# - Override settings? Yes
```

4. **Add Environment Variables via CLI**

```bash
vercel env add MONGODB_URI
# Paste: mongodb+srv://hospi:hospital2000@cluster0.jspojlo.mongodb.net/?appName=Cluster0

vercel env add JWT_SECRET
# Paste: your-super-secret-jwt-key-here-1234567898

vercel env add NODE_ENV
# Type: production
```

5. **Deploy to Production**

```bash
vercel --prod
```

---

### Step 5: Post-Deployment Configuration

1. **Update MongoDB Atlas Network Access**
   - Go to MongoDB Atlas Dashboard
   - Navigate to Network Access
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Or add Vercel's IP ranges

2. **Update Client Environment Variable**
   
   After deployment, Vercel will give you a URL like:
   `https://lifeline-x-hospital.vercel.app`
   
   Update `client/.env.production`:
   ```env
   REACT_APP_API_URL=https://lifeline-x-hospital.vercel.app/api
   ```
   
   Then redeploy:
   ```bash
   git add .
   git commit -m "Update API URL"
   git push
   ```

3. **Test Your Deployment**
   - Visit your Vercel URL
   - Test authentication (signup/login)
   - Test all modules (Patients, Doctors, etc.)
   - Check browser console for errors

---

## 🔧 Alternative: Separate Frontend & Backend Deployment

For better performance, deploy frontend and backend separately:

### Frontend (Vercel)

1. **Create separate repo for client or use monorepo**

2. **Deploy only client folder**
   - Root Directory: `client`
   - Build Command: `npm run build`
   - Output Directory: `build`

3. **Environment Variables:**
   ```
   REACT_APP_API_URL=https://your-backend-url.vercel.app/api
   ```

### Backend (Vercel or Railway/Render)

1. **For Vercel:**
   - Root Directory: `server`
   - Build Command: `npm install`
   - Output Directory: `.`

2. **Create `server/vercel.json`:**
   ```json
   {
     "version": 2,
     "builds": [
       {
         "src": "index.js",
         "use": "@vercel/node"
       }
     ],
     "routes": [
       {
         "src": "/(.*)",
         "dest": "index.js"
       }
     ]
   }
   ```

3. **Environment Variables:**
   - MONGODB_URI
   - JWT_SECRET
   - NODE_ENV=production

---

## 🐛 Troubleshooting

### Issue: API calls failing with CORS error

**Solution:** Update `server/index.js` CORS configuration:

```javascript
app.use(cors({
  origin: [
    'https://your-frontend-url.vercel.app',
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Issue: 404 on page refresh

**Solution:** Add `_redirects` file in `client/public/`:

```
/*    /index.html   200
```

Or update `vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Issue: Environment variables not working

**Solution:** 
- Ensure variables are added in Vercel dashboard
- Redeploy after adding variables
- Check variable names match exactly (case-sensitive)

### Issue: MongoDB connection timeout

**Solution:**
- Whitelist Vercel IPs in MongoDB Atlas
- Check MongoDB URI is correct
- Ensure database user has proper permissions

### Issue: Build fails

**Solution:**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json
- Test build locally: `cd client && npm run build`

---

## 📊 Monitoring & Logs

1. **View Logs:**
   - Vercel Dashboard → Your Project → Deployments → Click deployment → View Logs

2. **Real-time Logs (CLI):**
   ```bash
   vercel logs
   ```

3. **Monitor Performance:**
   - Vercel Dashboard → Analytics
   - Check response times, errors, and traffic

---

## 🔄 Continuous Deployment

Vercel automatically deploys when you push to your Git repository:

```bash
# Make changes
git add .
git commit -m "Update feature"
git push

# Vercel automatically deploys!
```

---

## 🎯 Production Checklist

- [ ] MongoDB Atlas network access configured
- [ ] All environment variables set in Vercel
- [ ] CORS configured for production domain
- [ ] API URL updated in client
- [ ] JWT_SECRET is strong and secure
- [ ] Test authentication flow
- [ ] Test all CRUD operations
- [ ] Check mobile responsiveness
- [ ] Monitor error logs
- [ ] Set up custom domain (optional)

---

## 🌐 Custom Domain (Optional)

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed by Vercel
4. Wait for DNS propagation (up to 48 hours)

---

## 📞 Support

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)

---

## 🎉 Deployment Complete!

Your Lifeline X Hospital System is now live on Vercel!

**Next Steps:**
1. Share the URL with your team
2. Create user accounts
3. Start managing hospital operations
4. Monitor performance and logs
5. Gather feedback and iterate

---

**Deployed URL:** `https://your-app-name.vercel.app`

**Admin Panel:** `https://your-app-name.vercel.app/app/dashboard`

**Login:** `https://your-app-name.vercel.app/auth`
