const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database.js');
const { generateToken } = require('../middleware/jwt.js');

const router = express.Router();

// User Login
router.post('/', async (req, res) => {
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!email || !password || email.length > 254 || password.length > 256) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    const [rows] = await db.promise().execute(
      'SELECT id, name, email, password, role, is_active, login_count, last_login FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const passwordMatches = typeof user.password === 'string'
      ? await bcrypt.compare(password, user.password)
      : false;

    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check if user is active
    if (user.is_active === 0 || user.is_active === false) {
      return res.status(403).json({
        message: 'Your account has been deactivated by the administrator. Please contact support.',
      });
    }

    // Update login count and last login timestamp
    await db.promise().query(
      'UPDATE users SET login_count = COALESCE(login_count, 0) + 1, last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const role = user.role || 'user';

    const token = generateToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role,
    });

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        is_active: user.is_active !== 0,
        login_count: (user.login_count || 0) + 1,
        last_login: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Login failed:', error);
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

// User Registration
router.post('/newuser', async (req, res) => {
  const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
  const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long' });
  }

  try {
    const [existing] = await db.promise().query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      'INSERT INTO users (name, email, password, role, is_active, login_count, last_login) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [name, email, hashedPassword, 'user', 1, 1]
    );

    const token = generateToken({
      id: result.insertId,
      name,
      email,
      role: 'user',
    });

    return res.status(201).json({
      message: 'User created successfully',
      token,
      user: {
        id: result.insertId,
        name,
        email,
        role: 'user',
        is_active: true,
        login_count: 1,
      },
    });
  } catch (err) {
    console.error('Error creating user:', err);
    return res.status(500).json({ message: 'Error creating user', error: err.message });
  }
});

module.exports = router;