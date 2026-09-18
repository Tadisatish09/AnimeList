const animeService = require('../services/animeService.js');

async function search(req, res) {
  try {
    const query = req.query.q || req.query.query;
    const limit = parseInt(req.query.limit, 10) || 10;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ message: 'Search query parameter (q) is required' });
    }

    const results = await animeService.searchAnime(query, limit);
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error searching anime:', error);
    return res.status(500).json({
      success: false,
      message: 'Error searching anime from external service',
      error: error.message,
    });
  }
}

async function getTrending(req, res) {
  try {
    const limit = parseInt(req.query.limit, 10) || 6;
    const results = await animeService.getTrendingAnime(limit);
    return res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('Error fetching trending anime:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching trending anime',
      error: error.message,
    });
  }
}

async function getOngoing(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const results = await animeService.getOngoingAnime(page, limit);
    return res.status(200).json({
      success: true,
      data: results.data,
      pagination: results.pagination,
    });
  } catch (error) {
    console.error('Error fetching ongoing anime:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching ongoing anime',
      error: error.message,
    });
  }
}

async function getSchedule(req, res) {
  try {
    const day = req.query.day || 'monday';
    const weekOffset = parseInt(req.query.weekOffset ?? req.query.week_offset, 10) || 0;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const results = await animeService.getWeeklySchedule(day, weekOffset, page, limit);
    return res.status(200).json({
      success: true,
      day: results.day,
      date: results.date,
      weekOffset: results.weekOffset,
      count: results.data.length,
      data: results.data,
    });
  } catch (error) {
    console.error('Error fetching anime weekly schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching anime weekly schedule',
      error: error.message,
    });
  }
}

async function getDetails(req, res) {
  try {
    const { malId } = req.params;
    if (!malId) {
      return res.status(400).json({ message: 'Anime ID is required' });
    }

    const details = await animeService.getAnimeById(malId);
    if (!details) {
      return res.status(404).json({ message: 'Anime details not found' });
    }

    return res.status(200).json({
      success: true,
      data: details,
    });
  } catch (error) {
    console.error('Error fetching anime details:', error);
    return res.status(500).json({
      success: false,
      message: 'Error fetching anime details',
      error: error.message,
    });
  }
}

module.exports = {
  search,
  getTrending,
  getOngoing,
  getSchedule,
  getDetails,
};
