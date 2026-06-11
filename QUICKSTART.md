# Quick Start Guide

Get the ANPC Yard system up and running in minutes!

## 🚀 Quick Start (5 minutes)

### Prerequisites
- Node.js 16+ installed
- Git installed
- MongoDB running locally (or MongoDB Atlas account)

### Step 1: Clone & Install
```bash
git clone <repository-url>
cd anpc-yard

# Backend
cd backend
npm install
cd ..

# Frontend
cd frontend
npm install
cd ..
```

### Step 2: Configure Environment

**Backend (.env)**
```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:
```
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/anpc-yard
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=dev
CLOUDINARY_API_KEY=dev
CLOUDINARY_API_SECRET=dev
FRONTEND_URL=http://localhost:3000
```

**Frontend (.env.local)**
```bash
cp frontend/.env.example frontend/.env.local
```

Edit `frontend/.env.local` (optional - defaults work for local dev):
```
REACT_APP_API_URL=http://localhost:5000/api
```

### Step 3: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```
✅ Backend runs on http://localhost:5000

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```
✅ Frontend runs on http://localhost:3000

### Step 4: Login
Open http://localhost:3000 in your browser

**Default Credentials:**
- Email: `admin@anpc.com`
- Password: `admin123`

---

## 📋 Common Tasks

### Import Sample Data
```bash
cd backend
npm run seed
```

### Start Backend Only
```bash
cd backend
npm start
```

### Build Frontend for Production
```bash
cd frontend
npm run build
```

Output goes to `frontend/build/`

### View Backend Logs
Already running with `npm run dev` - logs print to console

### Access MongoDB Locally
```bash
# If using local MongoDB
mongo

# Or with MongoDB Compass GUI
# Download from https://www.mongodb.com/products/compass
```

---

## 🔧 Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000 (frontend)
lsof -i :3000
kill -9 <PID>

# Find process using port 5000 (backend)
lsof -i :5000
kill -9 <PID>
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
mongosh

# If not installed, install it:
# macOS: brew install mongodb-community
# Windows: Download installer from mongodb.com
# Linux: apt-get install mongodb
```

### Dependencies Error
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
npm install
```

### Frontend won't connect to Backend
- Check Backend is running: http://localhost:5000/api/health
- Check `REACT_APP_API_URL` in frontend/.env.local
- Check browser console (F12) for CORS errors

---

## 📚 Next Steps

1. **Read the Full README**
   ```bash
   cat README.md
   ```

2. **For Deployment**
   ```bash
   cat DEPLOYMENT.md
   cat DEPLOYMENT_CHECKLIST.md
   ```

3. **Explore the Code**
   - Backend: `backend/routes/` and `backend/controllers/`
   - Frontend: `frontend/src/pages/` and `frontend/src/components/`

4. **Import Test Data**
   - Use CSV templates in `frontend/public/templates/`
   - Or run `npm run seed` in backend

---

## 🎯 System Features Ready to Explore

✅ Cranes Management
✅ Hooks Management
✅ Counterweights Management
✅ Boom Sections Management
✅ CSV Import
✅ User Authentication
✅ Dashboard
✅ Reports

---

## 📞 Need Help?

1. Check browser console for errors (F12)
2. Check backend terminal for logs
3. Review DEPLOYMENT.md for detailed guides
4. Check DEPLOYMENT_CHECKLIST.md for common issues

---

**Happy tracking! 🎉**
