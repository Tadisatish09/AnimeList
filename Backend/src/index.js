const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const db = require('./config/database.js');
const { runMigrations } = require('./config/migrate.js');
const { authMiddleware } = require('./middleware/jwt.js');

const loginRouter = require('./routes/login.js');
const animeRouter = require('./routes/anime.js');
const watchlistRouter = require('./routes/watchlist.js');
const watchedRouter = require('./routes/watched.js');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Test database connection and ensure schema is up-to-date
db.getConnection(async (err, connection) => {
  if (err) {
    console.error('Error connecting to MySQL database:', err);
    return;
  }
  console.log('Connected to MySQL database successfully');
  connection.release();

  try {
    await runMigrations();
  } catch (migErr) {
    console.error('Migration notice:', migErr.message);
  }
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// API Health route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Anime Tracker Backend API is running successfully!' });
});

// Mounted API Routes
app.use('/api/login', loginRouter);
app.use('/api/anime', animeRouter);
app.use('/api/watchlist', watchlistRouter);
app.use('/api/watched', watchedRouter);

// User Profile Route
app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({
    message: 'Protected profile route',
    user: req.user,
  });
});

// Serve React static frontend build in production
const frontendDistPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDistPath));

// Frontend Catch-all route (SPA routing compatible with Express 5)
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'), (err) => {
    if (err) next();
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
