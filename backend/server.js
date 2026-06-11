const path = require('path');
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

app.get('/api/health', (req, res) => res.json({ status: 'OK', message: 'ANPC Yard API running' }));
app.get('/favicon.ico', (req, res) => res.status(204).end());

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    if (req.path.startsWith('/api')) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    res.sendFile(path.join(__dirname, '../frontend/build', 'index.html'));
  });
}

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
