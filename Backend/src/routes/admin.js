const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database.js');
const { superAdminMiddleware } = require('../middleware/jwt.js');

const router = express.Router();

// Apply superAdminMiddleware to all routes in this router
router.use(superAdminMiddleware);

/**
 * GET /api/admin/users
 * Returns list of all registered users with administrative metrics.
 * Note: Strictly excludes anime list details for privacy.
 */
router.get('/users', async (req, res) => {
  try {
    const [users] = await db.promise().query(`
      SELECT 
        id, 
        name, 
        email, 
        role, 
        is_active, 
        COALESCE(login_count, 0) AS login_count, 
        last_login, 
        created 
      FROM users 
      ORDER BY id ASC
    `);

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users.map(u => ({
        ...u,
        is_active: u.is_active === 1 || u.is_active === true,
      })),
    });
  } catch (error) {
    console.error('Error fetching users for admin:', error);
    return res.status(500).json({ message: 'Failed to fetch users', error: error.message });
  }
});

/**
 * GET /api/admin/stats
 * Aggregate system-wide user metrics.
 */
router.get('/stats', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT 
        COUNT(*) AS total_users,
        SUM(CASE WHEN is_active = 1 OR is_active IS TRUE THEN 1 ELSE 0 END) AS active_users,
        SUM(CASE WHEN is_active = 0 OR is_active IS FALSE THEN 1 ELSE 0 END) AS inactive_users,
        SUM(COALESCE(login_count, 0)) AS total_logins
      FROM users
    `);

    const stats = rows[0] || { total_users: 0, active_users: 0, inactive_users: 0, total_logins: 0 };

    return res.status(200).json({
      success: true,
      data: {
        totalUsers: Number(stats.total_users),
        activeUsers: Number(stats.active_users),
        inactiveUsers: Number(stats.inactive_users),
        totalLogins: Number(stats.total_logins),
      },
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    return res.status(500).json({ message: 'Failed to fetch admin statistics', error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id/password
 * Direct MySQL password update for a user.
 */
router.put('/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const password = typeof req.body.password === 'string' ? req.body.password : '';

  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  if (!password || password.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters long' });
  }

  try {
    const [userCheck] = await db.promise().query(
      'SELECT id, name, email FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const [updateResult] = await db.promise().query(
      'UPDATE users SET password = ?, updated = NOW() WHERE id = ?',
      [hashedPassword, id]
    );

    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ message: 'Failed to update user password' });
    }

    return res.status(200).json({
      success: true,
      message: `Password for user ${userCheck[0].name} (${userCheck[0].email}) updated successfully in MySQL database.`,
    });
  } catch (error) {
    console.error('Error updating user password:', error);
    return res.status(500).json({ message: 'Failed to update password', error: error.message });
  }
});

/**
 * PUT /api/admin/users/:id/status
 * Toggle active / inactive status of a user.
 */
router.put('/users/:id/status', async (req, res) => {
  const { id } = req.params;
  const { is_active, isActive } = req.body;

  const targetStatus = is_active !== undefined ? is_active : isActive;

  if (targetStatus === undefined) {
    return res.status(400).json({ message: 'is_active boolean is required' });
  }

  const numericStatus = (targetStatus === true || targetStatus === 1 || targetStatus === '1') ? 1 : 0;

  try {
    const [userCheck] = await db.promise().query(
      'SELECT id, name, email, role FROM users WHERE id = ? LIMIT 1',
      [id]
    );

    if (userCheck.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deactivating own superadmin account
    if (userCheck[0].id === req.user.id && numericStatus === 0) {
      return res.status(400).json({ message: 'You cannot deactivate your own Super Admin account' });
    }

    await db.promise().query(
      'UPDATE users SET is_active = ?, updated = NOW() WHERE id = ?',
      [numericStatus, id]
    );

    const statusLabel = numericStatus === 1 ? 'activated' : 'deactivated';

    return res.status(200).json({
      success: true,
      message: `User ${userCheck[0].name} has been ${statusLabel} successfully in database.`,
      is_active: numericStatus === 1,
    });
  } catch (error) {
    console.error('Error updating user status:', error);
    return res.status(500).json({ message: 'Failed to update user status', error: error.message });
  }
});

module.exports = router;
