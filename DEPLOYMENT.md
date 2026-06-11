# ANPC Yard System - Deployment Guide

This guide will help you deploy the ANPC Yard equipment tracking system to **Render** (backend) and **Vercel** (frontend).

---

## Prerequisites

1. **Git Repository** - Push your code to GitHub (public or private)
2. **Render Account** - https://render.com (free tier available)
3. **Vercel Account** - https://vercel.com (free tier available)
4. **MongoDB Atlas Account** - https://www.mongodb.com/cloud/atlas (free tier available)
5. **Cloudinary Account** - https://cloudinary.com (free tier available)

---

## Phase 1: Database Setup (MongoDB Atlas)

### Step 1: Create MongoDB Atlas Cluster
1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create a free **M0 cluster** (you can select any region)
4. Wait for the cluster to be created (5-10 minutes)

### Step 2: Create Database User
1. Go to "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Set username and password (save these!)
5. Assign role: "Atlas admin"
6. Click "Add User"

### Step 3: Whitelist IPs
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
4. This allows Render to connect

### Step 4: Get Connection String
1. Go to "Clusters" and click "Connect"
2. Choose "Connect your application"
3. Copy the MongoDB URI
4. Replace `<username>`, `<password>` with your database user credentials
5. Replace `<dbname>` with `anpc-yard`

**Format:** `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/anpc-yard?retryWrites=true&w=majority`

---

## Phase 2: Cloudinary Setup (Image Storage)

### Step 1: Create Cloudinary Account
1. Go to https://cloudinary.com
2. Sign up for free
3. Go to Dashboard

### Step 2: Get API Credentials
1. Copy your **Cloud Name**
2. Copy your **API Key**
3. Go to "Settings" → "API Keys"
4. Copy your **API Secret**

---

## Phase 3: Backend Deployment (Render)

### Option A: Using render.yaml (Recommended - Easiest)

**Step 1: Create Render Service from Blueprint**
1. Go to https://render.com and log in
2. Click "New +" → "Web Service"
3. Select "Public Git Repository"
4. Paste: `https://github.com/brayney/ANPCSystem.git`
5. Click "Continue"

**Step 2: Let render.yaml Configure Everything**
Render will automatically detect and use `render.yaml`:
- Build Command: `cd backend && npm install`
- Start Command: `cd backend && npm start`
- Environment: Node
- Plan: Free
- Environment Variables: All configured in render.yaml

**Step 3: Just Add Missing Secrets**
You'll need to manually add these environment variables (they're marked `sync: false` in render.yaml):
- `MONGODB_URI`
- `JWT_SECRET`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

**Step 4: Click Deploy**

---

### Option B: Manual Configuration (If render.yaml Doesn't Work)

**Step 1: Create Render Service**
1. Go to https://render.com and log in
2. Click "New +" → "Web Service"
3. Select "Public Git Repository"
4. Paste: `https://github.com/brayney/ANPCSystem.git`
5. Click "Continue"

**Step 2: Configure Render Service**
Fill in the following:
- **Name:** `anpc-yard-backend`
- **Environment:** `Node`
- **Build Command:** `cd backend && npm install`
- **Start Command:** `cd backend && npm start`
- **Plan:** Free (recommended for testing)

**Step 3: Add Environment Variables**
Click "Environment" and add these variables:

| Key | Value |
|-----|-------|
| NODE_ENV | production |
| MONGODB_URI | `mongodb+srv://username:password@cluster...` |
| JWT_SECRET | Generate a random string (min 32 chars) |
| JWT_EXPIRES_IN | 7d |
| FRONTEND_URL | `https://your-frontend-domain.vercel.app` |
| CLOUDINARY_CLOUD_NAME | Your cloud name from Cloudinary |
| CLOUDINARY_API_KEY | Your API key from Cloudinary |
| CLOUDINARY_API_SECRET | Your API secret from Cloudinary |

**Step 4: Deploy**
1. Click "Create Web Service"
2. Render will clone your repository and build
3. Wait for the build to complete (5-10 minutes)
4. If it fails, check the logs for specific errors
5. Copy your backend URL once it's deployed: `https://anpc-yard-backend.onrender.com`

**Note:** Free tier instances go to sleep after 15 minutes of inactivity. For production, upgrade to Starter plan.

---

## Phase 4: Frontend Deployment (Vercel)

### Step 1: Create Vercel Project
1. Go to https://vercel.com and log in
2. Click "Add New" → "Project"
3. Connect your GitHub repository
4. Select the branch (usually `main`)

### Step 2: Configure Vercel Project
Fill in the following:
- **Project Name:** `anpc-yard-frontend`
- **Framework:** React
- **Root Directory:** `./frontend`
- **Build Command:** `npm run build`
- **Output Directory:** `build`

### Step 3: Add Environment Variables
Under "Environment Variables", add:

| Key | Value |
|-----|-------|
| REACT_APP_API_URL | `https://anpc-yard-backend.onrender.com/api` |

### Step 4: Deploy
1. Click "Deploy"
2. Vercel will automatically build and deploy
3. Wait for the deployment to complete (3-5 minutes)
4. Get your frontend URL: `https://your-project-name.vercel.app`

---

## Phase 5: Update Backend CORS (Important!)

After getting your Vercel frontend URL:

1. Go back to Render
2. Go to your backend service
3. Update the `FRONTEND_URL` environment variable with your actual Vercel URL
4. Click "Manual Deploy" to redeploy with the new URL

---

## Phase 6: Test the Deployment

1. Open your Vercel frontend URL
2. Try to log in with demo credentials:
   - Email: `admin@anpc.com`
   - Password: `admin123`

**If login fails:**
- Check browser console for errors (F12)
- Go to Render → Logs to see backend errors
- Verify all environment variables are set correctly
- Check that MongoDB Atlas IP whitelist allows all IPs

---

## Troubleshooting

### "Backend directory not found" error on Render
**This error means Render can't find the `backend/` folder in the cloned repository.**

**Solution - Try these in order:**

1. **First, verify the code is in GitHub:**
   - Go to: https://github.com/brayney/ANPCSystem
   - You should see a `backend` folder listed
   - If it's missing, push code again:
     ```bash
     git add backend/
     git commit -m "Add backend code"
     git push
     ```

2. **Use render.yaml automatically (Easiest):**
   - Delete your failed Render service
   - Start over with "Public Git Repository" method
   - Render will auto-detect and use `render.yaml`
   - You don't need to manually enter build commands

3. **If render.yaml still doesn't work:**
   - Make sure repository is **public** (not private)
   - In Render, manually specify start commands:
     - Build: `cd backend && npm install`
     - Start: `cd backend && npm start`
   - This should work even if render.yaml fails

4. **Last resort - Clone locally first:**
   - Go to Render → failed service → Logs
   - Look for the exact clone error
   - If you see permission errors, make your GitHub repo **public**
   - If files don't exist, verify with: `git ls-tree HEAD backend/package.json`

### "CORS error" when trying to use the app
- Verify `FRONTEND_URL` is set in backend environment variables
- Verify `REACT_APP_API_URL` is set in frontend environment variables
- Redeploy both services after updating URLs

### "Build failed" on Render
- Go to Render → Logs
- Check the error message
- Ensure all dependencies are listed in `backend/package.json`
- Push fixes to GitHub and redeploy

### "Build failed" on Vercel
- Go to Vercel → Deployments → Failed deployment
- Check the error message
- Ensure all dependencies are in `frontend/package.json`
- Make sure `.env.example` exists

### Application loads but nothing works
- Open browser DevTools (F12)
- Check Console tab for errors
- Check Network tab to see API calls
- Verify backend URL in frontend is correct

---

## Production Recommendations

1. **Upgrade Plan:** Free tier instances may be too slow for production
   - Render: Upgrade to at least Starter plan ($7/month)
   - Vercel: Pro plan for better performance and support

2. **Enable Monitoring:** Use Render and Vercel dashboards to monitor:
   - Error rates
   - Response times
   - Deployment history

3. **Backup Database:** Set up automated backups in MongoDB Atlas

4. **Security:**
   - Keep JWT_SECRET secret and change it regularly
   - Use strong database passwords
   - Enable Cloudinary security features

5. **Domain Setup:**
   - Buy a custom domain
   - Update CORS and API URLs to use your domain
   - Enable HTTPS (automatic with Vercel and Render)

---

## Updating the Application

When you make changes:

1. Push code to GitHub
2. Render and Vercel will automatically redeploy
3. Changes should be live in 2-5 minutes

---

## Environment Variable Reference

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env.local)
```
REACT_APP_API_URL=https://your-backend.onrender.com/api
```

---

## Support & Additional Resources

- **Render Docs:** https://render.com/docs
- **Vercel Docs:** https://vercel.com/docs
- **MongoDB Atlas Docs:** https://docs.atlas.mongodb.com
- **Cloudinary Docs:** https://cloudinary.com/documentation

---

**Deployment completed! Your system is now live and accessible from anywhere.** 🚀
