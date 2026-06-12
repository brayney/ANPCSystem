# Deployment Checklist - Fresh Setup (New GitHub Account)

**Date Started:** 2026-06-12  
**Status:** New deployment configuration

---

## ✅ Pre-Deployment Checklist

### Repository Setup
- [ ] Code pushed to new GitHub account
- [ ] All files committed (including backend/, frontend/, render.yaml, build.sh, start.sh)
- [ ] No `.env` files in repository (only `.env.example`)
- [ ] Latest changes on main branch
- [ ] Repository is public (for Render/Vercel to access)

### Backend Configuration (`backend/`)
- [ ] `package.json` exists with all dependencies
- [ ] `server.js` exists and starts on port 5000
- [ ] `.env.example` created with template variables
- [ ] All controllers and models present
- [ ] MongoDB connection configured

### Frontend Configuration (`frontend/`)
- [ ] `package.json` exists with all dependencies
- [ ] `src/App.js` exists
- [ ] `build/` folder generated (from last build)
- [ ] `.env.example` created with REACT_APP_API_URL template
- [ ] `vercel.json` exists with proper configuration

### Root Configuration
- [ ] `render.yaml` properly configured with `root: backend`
- [ ] `build.sh` is executable and works
- [ ] `start.sh` is executable and works
- [ ] `.gitignore` includes `.env` files

---

## 📋 External Services Setup

### MongoDB Atlas
- [ ] Account created at https://www.mongodb.com/cloud/atlas
- [ ] Free M0 cluster created
- [ ] Database user created (username: `anpc_admin`)
- [ ] Network Access set to 0.0.0.0/0 (allow anywhere)
- [ ] Connection string copied in format: `mongodb+srv://anpc_admin:PASSWORD@cluster0.xxxxx.mongodb.net/anpc-yard`
- [ ] Database name set to `anpc-yard`
- [ ] Test connection successful

### Cloudinary
- [ ] Account created at https://cloudinary.com
- [ ] Cloud Name copied
- [ ] API Key copied
- [ ] API Secret copied
- [ ] Test API call successful

---

## 🚀 Backend Deployment (Render)

### Initial Setup
- [ ] Render account created at https://render.com
- [ ] GitHub connected to Render account
- [ ] New Web Service created from Git Repository
- [ ] Repository URL: `https://github.com/YOUR_USERNAME/ANPCSystem.git`
- [ ] Service name: `anpc-yard-backend`
- [ ] Environment: `Node`
- [ ] Plan: `Free`

### Configuration Verified
- [ ] Build Command: `npm install` (from render.yaml)
- [ ] Start Command: `npm start` (from render.yaml)
- [ ] Root Directory: `backend` (from render.yaml)

### Environment Variables Set
- [ ] `NODE_ENV` = `production`
- [ ] `MONGODB_URI` = Your MongoDB connection string
- [ ] `JWT_SECRET` = 32+ character random string
- [ ] `JWT_EXPIRES_IN` = `7d`
- [ ] `FRONTEND_URL` = (will set after Vercel deployment)
- [ ] `CLOUDINARY_CLOUD_NAME` = Your cloud name
- [ ] `CLOUDINARY_API_KEY` = Your API key
- [ ] `CLOUDINARY_API_SECRET` = Your API secret

### Deployment
- [ ] Initial deployment triggered
- [ ] Build completed successfully (5-10 minutes)
- [ ] No errors in Render logs
- [ ] Backend URL copied: `https://anpc-yard-backend-xxxxx.onrender.com`
- [ ] Backend responds to health check

---

## 🎨 Frontend Deployment (Vercel)

### Initial Setup
- [ ] Vercel account created at https://vercel.com
- [ ] GitHub connected to Vercel account
- [ ] New Project created from Git Repository
- [ ] Repository URL: `https://github.com/YOUR_USERNAME/ANPCSystem.git`

### Configuration Verified
- [ ] **Root Directory: `frontend`** (CRITICAL!)
- [ ] Framework: Create React App
- [ ] Build Command: `npm run build`
- [ ] Output Directory: `build`

### Environment Variables Set
- [ ] `REACT_APP_API_URL` = Your Render backend URL

### Deployment
- [ ] Initial deployment triggered
- [ ] Build completed successfully (3-5 minutes)
- [ ] No errors in Vercel logs
- [ ] Frontend URL obtained: `https://your-project-name.vercel.app`
- [ ] Frontend loads without errors

---

## 🔄 Post-Deployment Configuration

### Update Backend Environment
- [ ] Go to Render dashboard
- [ ] Edit `anpc-yard-backend` environment variables
- [ ] Update `FRONTEND_URL` with Vercel frontend URL
- [ ] Save changes (triggers redeploy)
- [ ] Wait for redeploy to complete

### Verify Cross-Origin Access
- [ ] Backend CORS allows frontend URL
- [ ] Frontend can call backend API endpoints
- [ ] No CORS errors in browser console

---

## ✅ Testing Phase

### Backend Tests
- [ ] Backend URL responds with "API server is running"
- [ ] Render logs show no errors
- [ ] MongoDB connection successful
- [ ] Test API endpoint (e.g., GET /api/cranes)

### Frontend Tests
- [ ] Frontend URL loads without errors
- [ ] No console errors or warnings
- [ ] All pages load correctly
- [ ] Navigation works between pages
- [ ] Images load properly

### Authentication Tests
- [ ] Login page loads
- [ ] Can log in with test credentials (admin@example.com / password123)
- [ ] Can log out
- [ ] Protected pages require login

### Feature Tests
- [ ] Can view equipment lists (Cranes, Hooks, etc.)
- [ ] Can add new equipment
- [ ] Can edit existing equipment
- [ ] Can delete/archive equipment
- [ ] Can upload images (via Cloudinary)
- [ ] Can import CSV files
- [ ] Can export data
- [ ] Dashboard displays statistics

### API Tests (Network Tab)
- [ ] All API calls return 200/201 status
- [ ] No 403 Forbidden errors
- [ ] No 500 Server errors
- [ ] Response times reasonable (<500ms)

---

## 🔐 Production Readiness

### Security
- [ ] JWT_SECRET is 32+ characters, random
- [ ] No sensitive data in logs
- [ ] CORS properly restricted to frontend domain
- [ ] API validates all user inputs
- [ ] Passwords hashed with bcryptjs

### Performance
- [ ] Frontend bundle optimized
- [ ] Images optimized (via Cloudinary)
- [ ] Database queries optimized
- [ ] API response times < 500ms

### Monitoring
- [ ] Render monitoring dashboard reviewed
- [ ] Vercel analytics enabled
- [ ] Error tracking configured
- [ ] Database backup plan created

---

## 📝 Documentation

- [ ] Updated README.md with new deployment info
- [ ] DEPLOYMENT_NEW.md completed
- [ ] Environment variable requirements documented
- [ ] Troubleshooting guide available
- [ ] Admin procedures documented

---

## ⚠️ Common Issues to Watch For

If deployment fails:

1. **Backend folder not found**
   - Verify `render.yaml` has `root: backend`
   - Ensure backend/ directory exists in repo

2. **Frontend shows blank page**
   - Check Root Directory is set to `frontend` in Vercel
   - Verify REACT_APP_API_URL is set in Vercel

3. **API calls fail with CORS**
   - Make sure FRONTEND_URL is set correctly in Render
   - Trigger manual redeploy on Render

4. **Database connection fails**
   - Verify MongoDB URI format
   - Check IP whitelist is set to 0.0.0.0/0
   - Test connection string locally

5. **Image uploads fail**
   - Verify Cloudinary credentials
   - Check API keys are correct
   - Test upload endpoint in postman

---

## 🎉 Deployment Complete!

Once all checkboxes are ✅:

1. Your system is deployed and live
2. Users can access the frontend
3. Backend API handles requests
4. Database stores all data
5. Images upload to Cloudinary
6. System is production-ready

---

**Next Review Date:** After first week of production use

**Contact:** For issues, check logs in Render and Vercel dashboards first.
