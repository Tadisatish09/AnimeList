const axios = require('axios');
const path = require('path');
const db = require('../config/database.js');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

// Default endpoints from .env with fallbacks
let JIKAN_URL = process.env.JIKAN_API_URL || 'https://api.jikan.moe/v4/anime';
let KITSU_URL = process.env.KITSU_API_URL || 'https://kitsu.io/api/edge/anime';

// Helper to refresh API URLs from Database if available
async function getApiEndpoints() {
  try {
    const [rows] = await db.promise().query('SELECT provider_name, base_url, is_active FROM api_configs WHERE is_active = 1');
    rows.forEach((row) => {
      if (row.provider_name === 'jikan') JIKAN_URL = row.base_url;
      if (row.provider_name === 'kitsu') KITSU_URL = row.base_url;
    });
  } catch (err) {
    // If DB is busy, fallback to .env variables
  }
  return { JIKAN_URL, KITSU_URL };
}

/**
 * Searches for anime using configured external APIs with Jikan -> Kitsu fallback.
 * @param {string} query - The search query term.
 * @param {number} limit - Number of results to return (default 10).
 * @returns {Promise<Array>} List of standardized anime objects.
 */
async function searchAnime(query, limit = 10) {
  if (!query || typeof query !== 'string' || query.trim() === '') {
    return [];
  }

  const cleanQuery = query.trim();
  const { JIKAN_URL: jikanEndpoint, KITSU_URL: kitsuEndpoint } = await getApiEndpoints();

  // 1. Primary: Try Jikan (MyAnimeList v4)
  try {
    const jikanResponse = await axios.get(jikanEndpoint, {
      params: { q: cleanQuery, limit: limit },
      timeout: 5000,
      headers: { 'User-Agent': 'AnimeTracker/1.0' },
    });

    if (jikanResponse.data && Array.isArray(jikanResponse.data.data)) {
      return jikanResponse.data.data.map((item) => ({
        mal_id: item.mal_id,
        title: item.title_english || item.title || 'Unknown Title',
        original_title: item.title,
        title_japanese: item.title_japanese || '',
        image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        rating: item.score || 0,
        episodes: item.episodes || null,
        status: item.status || 'Unknown',
        synopsis: item.synopsis || '',
        genres: (item.genres || []).map((g) => g.name),
        year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : null),
      }));
    }
  } catch (jikanErr) {
    console.warn('Jikan API search failed/timed out, automatically falling back to Kitsu API:', jikanErr.message);
  }

  // 2. Fallback: Try Kitsu API if Jikan fails or times out
  try {
    const kitsuResponse = await axios.get(kitsuEndpoint, {
      params: {
        'filter[text]': cleanQuery,
        'page[limit]': limit,
      },
      timeout: 5000,
    });

    if (kitsuResponse.data && Array.isArray(kitsuResponse.data.data)) {
      return kitsuResponse.data.data.map((item) => {
        const attr = item.attributes || {};
        const score = attr.averageRating ? Math.round((parseFloat(attr.averageRating) / 10) * 10) / 10 : 0;
        return {
          mal_id: parseInt(item.id, 10),
          title: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || 'Unknown Title',
          original_title: attr.titles?.ja_jp || attr.canonicalTitle,
          title_japanese: attr.titles?.ja_jp || '',
          image_url: attr.posterImage?.large || attr.posterImage?.medium || attr.posterImage?.original || '',
          rating: score,
          episodes: attr.episodeCount || null,
          status: attr.status || 'Unknown',
          synopsis: attr.synopsis || '',
          genres: [],
          year: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
        };
      });
    }
  } catch (kitsuErr) {
    console.error('Both Jikan and Kitsu APIs failed:', kitsuErr.message);
    throw new Error('Failed to fetch anime results from external services');
  }

  return [];
}

/**
 * Fetches top trending/popular anime dynamically.
 * @param {number} limit 
 * @returns {Promise<Array>}
 */
async function getTrendingAnime(limit = 6) {
  // 1. Try Jikan top anime
  try {
    const jikanRes = await axios.get('https://api.jikan.moe/v4/top/anime', {
      params: { filter: 'bypopularity', limit: limit },
      timeout: 4000,
      headers: { 'User-Agent': 'AnimeTracker/1.0' },
    });

    if (jikanRes.data && Array.isArray(jikanRes.data.data)) {
      return jikanRes.data.data.map((item) => ({
        mal_id: item.mal_id,
        title: item.title_english || item.title || 'Unknown Title',
        original_title: item.title,
        image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        rating: item.score || 0,
        episodes: item.episodes || null,
        status: item.status || 'Unknown',
        synopsis: item.synopsis || '',
        genres: (item.genres || []).map((g) => g.name),
        genre: (item.genres || []).map((g) => g.name).join(', '),
      }));
    }
  } catch (jikanErr) {
    console.warn('Jikan top anime failed, falling back to Kitsu trending:', jikanErr.message);
  }

  // 2. Fallback to Kitsu trending anime
  try {
    const kitsuRes = await axios.get('https://kitsu.io/api/edge/trending/anime', {
      params: { 'page[limit]': limit },
      timeout: 5000,
    });

    if (kitsuRes.data && Array.isArray(kitsuRes.data.data)) {
      return kitsuRes.data.data.slice(0, limit).map((item) => {
        const attr = item.attributes || {};
        const score = attr.averageRating ? Math.round((parseFloat(attr.averageRating) / 10) * 10) / 10 : 0;
        return {
          mal_id: parseInt(item.id, 10),
          title: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || 'Unknown Title',
          original_title: attr.titles?.ja_jp || attr.canonicalTitle,
          image_url: attr.posterImage?.large || attr.posterImage?.medium || '',
          rating: score,
          episodes: attr.episodeCount || null,
          status: attr.status || 'Unknown',
          synopsis: attr.synopsis || '',
          genres: [],
          genre: 'Anime',
        };
      });
    }
  } catch (kitsuErr) {
    console.error('Failed to fetch trending anime:', kitsuErr.message);
  }

  return [];
}

/**
 * Fetches single anime details by ID with Jikan -> Kitsu fallback.
 * @param {number|string} malId 
 * @returns {Promise<Object>}
 */
async function getAnimeById(malId) {
  const { JIKAN_URL: jikanEndpoint, KITSU_URL: kitsuEndpoint } = await getApiEndpoints();

  // 1. Try Jikan by ID
  try {
    const response = await axios.get(`${jikanEndpoint}/${malId}`, {
      timeout: 5000,
      headers: { 'User-Agent': 'AnimeTracker/1.0' },
    });

    const item = response.data?.data;
    if (item) {
      return {
        mal_id: item.mal_id,
        title: item.title_english || item.title || 'Unknown Title',
        original_title: item.title,
        image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        rating: item.score || 0,
        episodes: item.episodes || null,
        status: item.status || 'Unknown',
        synopsis: item.synopsis || '',
        genres: (item.genres || []).map((g) => g.name),
        year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : null),
      };
    }
  } catch (error) {
    console.warn(`Jikan fetch by ID failed for ID ${malId}, trying Kitsu:`, error.message);
  }

  // 2. Fallback to Kitsu by ID
  try {
    const kitsuRes = await axios.get(`${kitsuEndpoint}/${malId}`, { timeout: 5000 });
    const item = kitsuRes.data?.data;
    if (item) {
      const attr = item.attributes || {};
      const score = attr.averageRating ? Math.round((parseFloat(attr.averageRating) / 10) * 10) / 10 : 0;
      return {
        mal_id: parseInt(item.id, 10),
        title: attr.canonicalTitle || attr.titles?.en || 'Unknown Title',
        original_title: attr.titles?.ja_jp || attr.canonicalTitle,
        image_url: attr.posterImage?.large || attr.posterImage?.medium || '',
        rating: score,
        episodes: attr.episodeCount || null,
        status: attr.status || 'Unknown',
        synopsis: attr.synopsis || '',
        genres: [],
        year: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
      };
    }
  } catch (kitsuError) {
    console.error(`Kitsu fallback also failed for ID ${malId}:`, kitsuError.message);
  }

  return null;
}

module.exports = {
  searchAnime,
  getTrendingAnime,
  getAnimeById,
};
