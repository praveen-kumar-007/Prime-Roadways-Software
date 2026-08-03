require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initMongo } = require('./src/config/database');

const { login, getMe } = require('./src/controllers/authController');
const { getAllUsers, createUser, updateUser, deleteUser } = require('./src/controllers/usersController');
const { getTripMis, createTripMis, updateTripMis, deleteTripMis } = require('./src/controllers/tripMisController');
const { getVendorMis, createVendorMis, updateVendorMis, deleteVendorMis } = require('./src/controllers/vendorMisController');
const { authenticateToken, requireAdmin } = require('./src/middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: Allow frontend origins from env or default to localhost for development
const allowedOrigins = process.env.FRONTEND_URL 
  ? [process.env.FRONTEND_URL, 'http://localhost:5173']
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json());

// Mock endpoints for MultiMarg UI port
app.get('/api/settings/config', (req, res) => {
  res.json({ success: true, data: null });
});
app.get('/api/notifications/incomplete', (req, res) => {
  res.json({ success: true, data: [] });
});

// Initialize Database
initMongo().catch(err => {
  console.error("Failed to connect to DB on startup:", err);
});

// --- ROUTES ---

// Health
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Prime Roadways Logistics API is running' });
});

// Auth
app.post('/api/auth/login', login);
app.get('/api/auth/me', authenticateToken, getMe);

// Users (IAM)
app.get('/api/users', authenticateToken, requireAdmin, getAllUsers);
app.post('/api/users', authenticateToken, requireAdmin, createUser);
app.put('/api/users/:id', authenticateToken, requireAdmin, updateUser);
app.delete('/api/users/:id', authenticateToken, requireAdmin, deleteUser);

// Trip MIS
app.get('/api/trip-mis', authenticateToken, getTripMis);
app.post('/api/trip-mis', authenticateToken, createTripMis);
app.put('/api/trip-mis/:id', authenticateToken, updateTripMis);
app.delete('/api/trip-mis/:id', authenticateToken, deleteTripMis);

// Vendor Vehicle MIS
app.get('/api/vendor-mis', authenticateToken, getVendorMis);
app.post('/api/vendor-mis', authenticateToken, createVendorMis);
app.put('/api/vendor-mis/:id', authenticateToken, updateVendorMis);
app.delete('/api/vendor-mis/:id', authenticateToken, deleteVendorMis);

// Keep-alive self-ping to bypass free-tier inactivity sleep
const RENDER_URL = process.env.RENDER_EXTERNAL_URL || `http://localhost:${PORT}/api/health`;
setInterval(() => {
  const httpModule = RENDER_URL.startsWith('https') ? require('https') : require('http');
  httpModule.get(RENDER_URL, (res) => {
    if (res.statusCode === 200) {
      console.log(`[Keep-Alive] Self-ping successful: ${res.statusCode}`);
    } else {
      console.warn(`[Keep-Alive] Self-ping status code: ${res.statusCode}`);
    }
  }).on('error', (err) => {
    console.error(`[Keep-Alive] Self-ping error: ${err.message}`);
  });
}, 14 * 60 * 1000); // Every 14 minutes

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
