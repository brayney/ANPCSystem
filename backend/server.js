const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/authRoutes');
const craneRoutes = require('./routes/craneRoutes');
const counterweightRoutes = require('./routes/counterweightRoutes');
const boomSectionRoutes = require('./routes/boomSectionRoutes');
const hookRoutes = require('./routes/hookRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const reportRoutes = require('./routes/reportRoutes');
const settingsRoutes = require('./routes/settingsRoutes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

const allowedOrigins = new Set(
  [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
  ].filter(Boolean)
);

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.has(origin)) return callback(null, true);
    return callback(null, false);
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/cranes', craneRoutes);
app.use('/api/counterweights', counterweightRoutes);
app.use('/api/boom-sections', boomSectionRoutes);
app.use('/api/hooks', hookRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);

// Root route - API status
app.get('/', (req, res) => res.json({ success: true, message: 'ANPC Yard Backend API running' }));

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'ANPC Yard API running' }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Frontend is deployed separately on Vercel, not served from this API
// This backend is API-only

// Multer error handler (before general error handler)
app.use((err, req, res, next) => {
  const multer = require('multer');
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ 
      success: false, 
      message: err.message || 'File upload error' 
    });
  }
  next(err);
});

// Error handler
app.use(errorHandler);

// DB + Server
const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    console.log(' MongoDB connected');
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

module.exports = app;
