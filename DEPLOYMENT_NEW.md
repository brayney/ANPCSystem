# ANPC Yard System - Fresh Deployment Guide

**Last Updated:** 2026-06-12  
**Status:** Clean setup for new GitHub account deployment

This guide covers deploying the ANPC Yard system to **Render** (backend) and **Vercel** (frontend) from your new GitHub account.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1: External Services Setup](#phase-1-external-services-setup)
3. [Phase 2: Backend Deployment (Render)](#phase-2-backend-deployment-render)
4. [Phase 3: Frontend Deployment (Vercel)](#phase-3-frontend-deployment-vercel)
5. [Phase 4: Post-Deployment Testing](#phase-4-post-deployment-testing)
6. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- ✅ Code pushed to your new GitHub account
- ✅ All files in the repository (backend/, frontend/, render.yaml, build.sh, start.sh)
- ✅ Accounts created on:
  - Render (https://render.com)
  - Vercel (https://vercel.com)
  - MongoDB Atlas (https://www.mongodb.com/cloud/atlas)
  - Cloudinary (https://cloudinary.com)

---

## Phase 1: External Services Setup

### Step 1: MongoDB Atlas (Database)

**Create Cluster:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create a **Free M0 Cluster**
3. Select your preferred region

**Create Database User:**
1. Navigate to "Database Access"
2. Click "Add New Database User"
3. Select "Password" authentication
4. Enter username: `anpc_admin` (or your preference)
5. Generate secure password (save it!)
6. Assign role: "Atlas admin"
7. Click "Add User"

**Configure Network Access:**
1. Go to "Network Access"
2. Click "Add IP Address"
3. Select "Allow access from anywhere" (0.0.0.0/0)
   - This allows Render to connect

**Get Connection String:**
1. Click "Clusters" → "Connect"
2. Choose "Connect your application"
3. Copy the connection string
4. Replace `<username>`, `<password>`, `<dbname>`:
   - Username: your database user
   - Password: your database password
   - dbname: `anpc-yard`

**Final MongoDB URI Format:**
```
mongodb+srv://anpc_admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/anpc-yard?retryWrites=true&w=majority
```

---

### Step 2: Cloudinary (Image Storage)

1. Go to https://cloudinary.com and sign up
2. Go to Dashboard
3. Copy these values:
   - **Cloud Name** (under Account)
   - **API Key** (under API Keys)
   - **API Secret** (under Settings → API Keys)

---

## Phase 2: Backend Deployment (Render)

### Step 1: Connect GitHub to Render

1. Go to https://render.com and log in
2. Click "Dashboard" → "New +"
3. Select "Web Service"
4. Choose "Public Git Repository"
5. Paste your GitHub URL: `https://github.com/YOUR_USERNAME/ANPCSystem.git`
6. Click "Connect"

### Step 2: Configure the Service

Render will auto-detect `render.yaml`. Verify these settings:

**Service Settings:**
- Name: `anpc-yard-backend`
- Environment: `Node`
- Region: Choose closest to you
- Plan: `Free`

**Build & Deploy:**
- Build Command: `npm install` (auto-detected from render.yaml)
- Start Command: `npm start` (auto-detected from render.yaml)
- Root Directory: `backend` (auto-detected from render.yaml)

### Step 3: Add Environment Variables

In the Render dashboard, add these environment variables:

| Key | Value | Notes |
|-----|-------|-------|
| `NODE_ENV` | `production` | Pre-filled |
| `MONGODB_URI` | Your MongoDB connection string | From MongoDB Atlas |
| `JWT_SECRET` | Generate random 32+ char string | Use `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | `7d` | Pre-filled |
| `FRONTEND_URL` | `https://your-frontend.vercel.app` | Update after Vercel deployment |
| `CLOUDINARY_CLOUD_NAME` | Your Cloudinary cloud name | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Your Cloudinary API key | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | Your Cloudinary API secret | From Cloudinary settings |

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment (5-10 minutes)
3. Check logs for errors
4. When complete, Render will show your backend URL: `https://anpc-yard-backend-xxxxx.onrender.com`

**Save your backend URL** - you'll need it for the frontend.

---

## Phase 3: Frontend Deployment (Vercel)

### Step 1: Connect GitHub to Vercel

1. Go to https://vercel.com and log in
2. Click "Add New..." → "Project"
3. Click "Import Git Repository"
4. Paste: `https://github.com/YOUR_USERNAME/ANPCSystem.git`
5. Click "Continue"

### Step 2: Configure Project

**Project Settings:**
- Framework: `Create React App` (auto-detected)
- Root Directory: `frontend` (IMPORTANT!)
- Build Command: `npm run build` (auto-detected)
- Output Directory: `build` (auto-detected)

### Step 3: Add Environment Variables

In Vercel environment settings, add:

| Key | Value |
|-----|-------|
| `REACT_APP_API_URL` | Your Render backend URL from Phase 2 |

Example: `https://anpc-yard-backend-xxxxx.onrender.com`

### Step 4: Deploy

1. Click "Deploy"
2. Wait for build (3-5 minutes)
3. Vercel will show your frontend URL: `https://your-project-name.vercel.app`

**Save your frontend URL**.

---

## Phase 4: Post-Deployment Testing

### Step 1: Backend Health Check

1. Open your Render backend URL in browser
2. You should see: `API server is running`
3. Check Render logs for any errors

### Step 2: Frontend Load Test

1. Open your Vercel frontend URL
2. Page should load without console errors
3. Open browser Developer Tools (F12)
4. Go to Console tab
5. Check for CORS or API errors

### Step 3: Authentication Test

1. Go to login page
2. Try logging in with test credentials:
   - Email: `admin@example.com`
   - Password: `password123`
3. Should redirect to dashboard
4. Check API calls in Network tab

### Step 4: Equipment Management Test

1. Navigate to Cranes page
2. Try adding a new crane
3. Try importing CSV file
4. Upload should work and save to Cloudinary

### Step 5: Update Backend Environment

If you deployed the frontend after the backend:

1. Go to Render dashboard
2. Find `anpc-yard-backend` service
3. Edit environment variables
4. Update `FRONTEND_URL` with your Vercel URL
5. Click "Save"
6. Render will auto-redeploy with new settings

---

## Environment Variables Reference

### Backend (Render)

```
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/anpc-yard
JWT_SECRET=<32+ character random string>
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend.vercel.app
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (Vercel)

```
REACT_APP_API_URL=https://your-backend.onrender.com
```

---

## Troubleshooting

### Backend shows "backend folder not found" error

**Solution:** 
- Verify `render.yaml` has `root: backend` 
- Make sure all files are committed to GitHub
- Check that backend/ folder is in the repository root
- Trigger a manual redeploy on Render

### Frontend shows blank page or 404

**Solution:**
- Verify `Root Directory` is set to `frontend` in Vercel
- Check that vercel.json exists in frontend/
- Verify build command is `npm run build`
- Check Vercel build logs for errors

### CORS errors when frontend calls backend API

**Solution:**
- Make sure `FRONTEND_URL` is set correctly in Render
- Restart backend service on Render
- Check backend logs for CORS configuration errors
- Verify REACT_APP_API_URL is set correctly in Vercel

### Login fails with "Invalid credentials"

**Solution:**
- Run database seed: `npm run seed` in backend
- Creates test user: `admin@example.com` / `password123`
- Contact your MongoDB Atlas cluster
- Check MongoDB connection string in MONGODB_URI

### Images not uploading

**Solution:**
- Verify Cloudinary credentials are correct
- Check Cloudinary dashboard for API errors
- Make sure CLOUDINARY_API_SECRET is exactly correct (copy-paste from dashboard)
- Check browser console for upload errors

### Render deployment keeps failing

**Solution:**
1. Check Render logs for specific error
2. Verify all backend dependencies in package.json
3. Ensure Node version compatible (Node 18+)
4. Check database connectivity with test MongoDB connection
5. Try manual redeploy from Render dashboard

---

## Quick Reference Links

- Render Dashboard: https://dashboard.render.com
- Vercel Dashboard: https://vercel.com/dashboard
- MongoDB Atlas: https://cloud.mongodb.com
- Cloudinary: https://cloudinary.com/console

---

## Next Steps After Deployment

1. ✅ Test all features in production
2. ✅ Set up monitoring/alerts
3. ✅ Configure custom domain (optional)
4. ✅ Set up SSL certificates (automatic on Render/Vercel)
5. ✅ Plan database backups
6. ✅ Document admin procedures

---

**Questions?** Check logs in Render and Vercel dashboards for detailed error messages.
