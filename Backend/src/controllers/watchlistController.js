const db = require('../config/database.js');

/**
 * Add an anime to the user's watch list.
 */
async function addToWatchlist(req, res) {
  try {
    const userId = req.user?.id;
    const name = req.body.name || req.body.title;
    const imageUrl = req.body.image_url || req.body.imageUrl || null;
    const malId = req.body.mal_id || req.body.malId || null;

    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ message: 'Anime name/title is required' });
    }

    const trimmedName = name.trim().slice(0, 75);

    // Check if already in watchlist for this user
    if (userId) {
      const [existing] = await db.promise().query(
        'SELECT id FROM watch_list WHERE user_id = ? AND (mal_id = ? OR name = ?) LIMIT 1',
        [userId, malId || -1, trimmedName]
      );
      if (existing.length > 0) {
        return res.status(409).json({ message: 'Anime is already in your watchlist' });
      }
    }

    const [result] = await db.promise().query(
      'INSERT INTO watch_list (name, image_url, mal_id, user_id) VALUES (?, ?, ?, ?)',
      [trimmedName, imageUrl, malId, userId || null]
    );

    const [newItem] = await db.promise().query(
      'SELECT * FROM watch_list WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Anime added to watchlist successfully',
      data: newItem[0],
    });
  } catch (error) {
    console.error('Error adding to watchlist:', error);
    return res.status(500).json({
      message: 'Failed to add anime to watchlist',
      error: error.message,
    });
  }
}

/**
 * Get all watchlist items for the authenticated user.
 */
async function getWatchlist(req, res) {
  try {
    const userId = req.user?.id;
    let query = 'SELECT * FROM watch_list';
    let params = [];

    if (userId) {
      query += ' WHERE user_id = ? OR user_id IS NULL ORDER BY created_at DESC';
      params.push(userId);
    } else {
      query += ' ORDER BY created_at DESC';
    }

    const [items] = await db.promise().query(query, params);

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching watchlist:', error);
    return res.status(500).json({
      message: 'Failed to fetch watchlist',
      error: error.message,
    });
  }
}

/**
 * Remove an item from the watchlist.
 */
async function removeFromWatchlist(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Watchlist item ID is required' });
    }

    let query = 'DELETE FROM watch_list WHERE id = ?';
    let params = [id];

    if (userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(userId);
    }

    const [result] = await db.promise().query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Watchlist item not found or unauthorized' });
    }

    return res.status(200).json({
      success: true,
      message: 'Anime removed from watchlist successfully',
    });
  } catch (error) {
    console.error('Error removing from watchlist:', error);
    return res.status(500).json({
      message: 'Failed to remove anime from watchlist',
      error: error.message,
    });
  }
}

module.exports = {
  addToWatchlist,
  getWatchlist,
  removeFromWatchlist,
};
