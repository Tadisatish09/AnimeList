const db = require('../config/database.js');

/**
 * Add or move an anime to the Watched / Completed list.
 */
async function addToWatched(req, res) {
  try {
    const userId = req.user?.id;
    const title = req.body.title || req.body.name;
    const rating = parseInt(req.body.rating, 10);
    const startDate = req.body.start_date || req.body.startDate || null;
    const completedDate = req.body.completed_date || req.body.completedDate || new Date().toISOString().slice(0, 10);
    const notes = req.body.notes || null;
    const malId = req.body.mal_id || req.body.malId || null;
    const imageUrl = req.body.image_url || req.body.imageUrl || null;
    const genre = Array.isArray(req.body.genres || req.body.genre)
      ? (req.body.genres || req.body.genre).join(', ')
      : (req.body.genre || req.body.genres || null);
    const description = req.body.description || req.body.synopsis || null;
    const removeFromWatchlist = req.body.remove_from_watchlist === true || req.body.removeFromWatchlist === true;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ message: 'Anime title is required' });
    }

    if (isNaN(rating) || rating < 1 || rating > 10) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 10' });
    }

    const trimmedTitle = title.trim().slice(0, 75);

    const [result] = await db.promise().query(
      `INSERT INTO watched (title, rating, start_date, completed_date, notes, mal_id, user_id, image_url, genre, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [trimmedTitle, rating, startDate, completedDate, notes, malId, userId || null, imageUrl, genre, description]
    );

    // If requested, clean up matching entry from watch_list
    if (removeFromWatchlist && userId) {
      await db.promise().query(
        'DELETE FROM watch_list WHERE user_id = ? AND (mal_id = ? OR name = ?)',
        [userId, malId || -1, trimmedTitle]
      );
    }

    const [newItem] = await db.promise().query(
      'SELECT * FROM watched WHERE id = ?',
      [result.insertId]
    );

    return res.status(201).json({
      message: 'Anime added to watched list successfully',
      data: newItem[0],
    });
  } catch (error) {
    console.error('Error adding to watched:', error);
    return res.status(500).json({
      message: 'Failed to add anime to watched list',
      error: error.message,
    });
  }
}

/**
 * Get all watched anime for the user with optional genre filtering and sorting.
 */
async function getWatched(req, res) {
  try {
    const userId = req.user?.id;
    const sort = req.query.sort || 'recent';
    const genreFilter = req.query.genre;
    const searchTerm = req.query.search;

    let orderBy = 'ORDER BY completed_date DESC, id DESC';
    if (sort === 'rating_desc') {
      orderBy = 'ORDER BY rating DESC, completed_date DESC';
    } else if (sort === 'rating_asc') {
      orderBy = 'ORDER BY rating ASC, completed_date DESC';
    } else if (sort === 'title') {
      orderBy = 'ORDER BY title ASC';
    }

    let whereClauses = [];
    let params = [];

    if (userId) {
      whereClauses.push('(user_id = ? OR user_id IS NULL)');
      params.push(userId);
    }

    if (genreFilter && genreFilter !== 'all') {
      whereClauses.push('genre LIKE ?');
      params.push(`%${genreFilter}%`);
    }

    if (searchTerm) {
      whereClauses.push('(title LIKE ? OR description LIKE ? OR notes LIKE ?)');
      params.push(`%${searchTerm}%`, `%${searchTerm}%`, `%${searchTerm}%`);
    }

    let query = 'SELECT * FROM watched';
    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    query += ` ${orderBy}`;

    const [items] = await db.promise().query(query, params);

    return res.status(200).json({
      success: true,
      count: items.length,
      data: items,
    });
  } catch (error) {
    console.error('Error fetching watched list:', error);
    return res.status(500).json({
      message: 'Failed to fetch watched list',
      error: error.message,
    });
  }
}

/**
 * Update rating, notes, dates, genre, or description of a watched anime.
 */
async function updateWatched(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const { rating, notes, start_date, completed_date, genre, description } = req.body;

    if (!id) {
      return res.status(400).json({ message: 'Watched item ID is required' });
    }

    // Build update query dynamically
    const fields = [];
    const values = [];

    if (rating !== undefined) {
      const parsedRating = parseInt(rating, 10);
      if (isNaN(parsedRating) || parsedRating < 1 || parsedRating > 10) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 10' });
      }
      fields.push('rating = ?');
      values.push(parsedRating);
    }

    if (notes !== undefined) {
      fields.push('notes = ?');
      values.push(notes);
    }

    if (start_date !== undefined) {
      fields.push('start_date = ?');
      values.push(start_date || null);
    }

    if (completed_date !== undefined) {
      fields.push('completed_date = ?');
      values.push(completed_date || null);
    }

    if (genre !== undefined) {
      fields.push('genre = ?');
      values.push(genre || null);
    }

    if (description !== undefined) {
      fields.push('description = ?');
      values.push(description || null);
    }

    if (fields.length === 0) {
      return res.status(400).json({ message: 'No valid fields provided for update' });
    }

    let query = `UPDATE watched SET ${fields.join(', ')} WHERE id = ?`;
    values.push(id);

    if (userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      values.push(userId);
    }

    const [result] = await db.promise().query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Watched item not found or unauthorized' });
    }

    const [updatedItem] = await db.promise().query(
      'SELECT * FROM watched WHERE id = ?',
      [id]
    );

    return res.status(200).json({
      message: 'Watched anime updated successfully',
      data: updatedItem[0],
    });
  } catch (error) {
    console.error('Error updating watched anime:', error);
    return res.status(500).json({
      message: 'Failed to update watched anime',
      error: error.message,
    });
  }
}

/**
 * Delete a watched item.
 */
async function deleteWatched(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Watched item ID is required' });
    }

    let query = 'DELETE FROM watched WHERE id = ?';
    let params = [id];

    if (userId) {
      query += ' AND (user_id = ? OR user_id IS NULL)';
      params.push(userId);
    }

    const [result] = await db.promise().query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Watched item not found or unauthorized' });
    }

    return res.status(200).json({
      success: true,
      message: 'Anime removed from watched list successfully',
    });
  } catch (error) {
    console.error('Error removing from watched list:', error);
    return res.status(500).json({
      message: 'Failed to remove anime from watched list',
      error: error.message,
    });
  }
}

module.exports = {
  addToWatched,
  getWatched,
  updateWatched,
  deleteWatched,
};
