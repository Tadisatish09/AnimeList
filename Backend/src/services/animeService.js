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
        genre: (item.genres || []).map((g) => g.name).join(', '),
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
          genre: 'Anime',
          year: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
        };
      });
    }
  } catch (kitsuErr) {
    console.error('All anime search APIs failed:', kitsuErr.message);
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
 * Fetches ongoing / currently airing anime with pagination.
 * @param {number} page 
 * @param {number} limit 
 * @returns {Promise<{ data: Array, pagination: Object }>}
 */
async function getOngoingAnime(page = 1, limit = 10) {
  const safePage = Math.max(1, parseInt(page, 10) || 1);
  const safeLimit = Math.min(25, Math.max(1, parseInt(limit, 10) || 10));

  // 1. Try Jikan Seasons Now API
  try {
    const jikanRes = await axios.get('https://api.jikan.moe/v4/seasons/now', {
      params: { page: safePage, limit: safeLimit },
      timeout: 4500,
      headers: { 'User-Agent': 'AnimeTracker/1.0' },
    });

    if (jikanRes.data && Array.isArray(jikanRes.data.data)) {
      const items = jikanRes.data.data.map((item) => ({
        mal_id: item.mal_id,
        title: item.title_english || item.title || 'Unknown Title',
        original_title: item.title,
        image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        rating: item.score || 0,
        episodes: item.episodes || null,
        status: item.status || 'Currently Airing',
        synopsis: item.synopsis || '',
        genres: (item.genres || []).map((g) => g.name),
        genre: (item.genres || []).map((g) => g.name).join(', '),
        year: item.year || (item.aired?.from ? new Date(item.aired.from).getFullYear() : null),
      }));

      const pag = jikanRes.data.pagination || {};
      return {
        data: items,
        pagination: {
          current_page: pag.current_page || safePage,
          has_next_page: pag.has_next_page ?? true,
          last_visible_page: pag.last_visible_page || safePage + 1,
          total_items: pag.items?.total || null,
        },
      };
    }
  } catch (jikanErr) {
    console.warn('Jikan seasons now failed, falling back to Kitsu ongoing:', jikanErr.message);
  }

  // 2. Fallback to Kitsu Ongoing Anime
  try {
    const offset = (safePage - 1) * safeLimit;
    const kitsuRes = await axios.get('https://kitsu.io/api/edge/anime', {
      params: {
        'filter[status]': 'current',
        'page[limit]': safeLimit,
        'page[offset]': offset,
        sort: '-userCount',
      },
      timeout: 5000,
    });

    if (kitsuRes.data && Array.isArray(kitsuRes.data.data)) {
      const totalCount = kitsuRes.data.meta?.count || 400;
      const totalPages = Math.ceil(totalCount / safeLimit);
      const items = kitsuRes.data.data.map((item) => {
        const attr = item.attributes || {};
        const score = attr.averageRating ? Math.round((parseFloat(attr.averageRating) / 10) * 10) / 10 : 0;
        return {
          mal_id: parseInt(item.id, 10),
          title: attr.canonicalTitle || attr.titles?.en || attr.titles?.en_jp || 'Unknown Title',
          original_title: attr.titles?.ja_jp || attr.canonicalTitle,
          image_url: attr.posterImage?.large || attr.posterImage?.medium || '',
          rating: score,
          episodes: attr.episodeCount || null,
          status: 'Currently Airing',
          synopsis: attr.synopsis || '',
          genres: [],
          genre: 'Anime',
          year: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
        };
      });

      return {
        data: items,
        pagination: {
          current_page: safePage,
          has_next_page: safePage < totalPages,
          last_visible_page: totalPages,
          total_items: totalCount,
        },
      };
    }
  } catch (kitsuErr) {
    console.error('Failed to fetch ongoing anime from Kitsu fallback:', kitsuErr.message);
  }

  return {
    data: [],
    pagination: {
      current_page: safePage,
      has_next_page: false,
      last_visible_page: safePage,
      total_items: 0,
    },
  };
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
        genre: (item.genres || []).map((g) => g.name).join(', '),
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
        genre: 'Anime',
        year: attr.startDate ? new Date(attr.startDate).getFullYear() : null,
      };
    }
  } catch (kitsuError) {
    console.error(`Kitsu fallback also failed for ID ${malId}:`, kitsuError.message);
  }

  return null;
}
/**
 * Helper to calculate start & end unix timestamps for a given weekday of current week
 */
function getDayTimestamps(targetDayName) {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const targetIndex = days.indexOf(targetDayName.toLowerCase());
  const safeIndex = targetIndex >= 0 ? targetIndex : 1; // default Monday

  const now = new Date();
  const currentDayIndex = now.getDay();
  const diffDays = safeIndex - currentDayIndex;

  const targetDate = new Date(now);
  targetDate.setDate(now.getDate() + diffDays);
  targetDate.setHours(0, 0, 0, 0);

  const startTimestamp = Math.floor(targetDate.getTime() / 1000);
  const endTimestamp = startTimestamp + 86400;

  return {
    startTimestamp,
    endTimestamp,
    formattedDate: targetDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
  };
}

/**
 * Fetches anime release schedule for a specific day of the week.
 * Primary: Jikan API (https://api.jikan.moe/v4/schedules?filter=monday)
 * Fallback: AniList GraphQL
 * @param {string} dayName - e.g. 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'
 * @param {number} page
 * @param {number} limit
 * @returns {Promise<{ data: Array, day: string, date: string, total: number }>}
 */
async function getWeeklySchedule(dayName = 'monday', page = 1, limit = 20) {
  const safeDay = (dayName || 'monday').toLowerCase();
  const { startTimestamp, endTimestamp, formattedDate } = getDayTimestamps(safeDay);

  // 1. Primary: Try Jikan Schedules endpoint (https://api.jikan.moe/v4/schedules?filter=monday)
  try {
    const jikanUrl = `https://api.jikan.moe/v4/schedules?filter=${safeDay}`;
    const jikanRes = await axios.get(jikanUrl, {
      params: { page: page || 1, limit: limit || 20 },
      timeout: 4500,
      headers: { 'User-Agent': 'AnimeWeeklySchedule/1.0' },
    });

    if (jikanRes.data && Array.isArray(jikanRes.data.data) && jikanRes.data.data.length > 0) {
      const items = jikanRes.data.data.map((item) => ({
        mal_id: item.mal_id,
        title: item.title_english || item.title || 'Unknown Title',
        original_title: item.title,
        image_url: item.images?.jpg?.large_image_url || item.images?.jpg?.image_url || '',
        rating: item.score || 0,
        episodes: item.episodes || null,
        status: item.status || 'Currently Airing',
        broadcast: item.broadcast?.string || `${safeDay.charAt(0).toUpperCase() + safeDay.slice(1)}s`,
        broadcast_time: item.broadcast?.time || '',
        broadcast_timezone: item.broadcast?.timezone || 'JST',
        airing_date: formattedDate,
        day: safeDay,
        genres: (item.genres || []).map((g) => g.name),
        genre: (item.genres || []).map((g) => g.name).join(', '),
        synopsis: item.synopsis || '',
      }));

      return {
        data: items,
        day: safeDay,
        date: formattedDate,
        total: items.length,
      };
    }
  } catch (jikanErr) {
    console.warn(`Jikan schedule for ${safeDay} failed (${jikanErr.message}), falling back to AniList schedule...`);
  }

  // 2. Fallback: AniList GraphQL Day Schedule
  try {
    const query = `
      query ($page: Int, $perPage: Int, $airingAt_greater: Int, $airingAt_lesser: Int) {
        Page(page: $page, perPage: $perPage) {
          airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
            id
            airingAt
            episode
            media {
              id
              idMal
              title { english romaji native }
              coverImage { large medium }
              genres
              averageScore
              description
              episodes
              status
            }
          }
        }
      }
    `;

    const aniRes = await axios.post('https://graphql.anilist.co', {
      query,
      variables: { page: page || 1, perPage: limit || 25, airingAt_greater: startTimestamp, airingAt_lesser: endTimestamp },
    }, { timeout: 6000 });

    const schedules = aniRes.data?.data?.Page?.airingSchedules || [];
    const items = schedules.map((item) => {
      const airDate = new Date(item.airingAt * 1000);
      return {
        mal_id: item.media.idMal || item.media.id,
        title: item.media.title.english || item.media.title.romaji || item.media.title.native || 'Unknown Title',
        original_title: item.media.title.romaji || item.media.title.native,
        image_url: item.media.coverImage?.large || item.media.coverImage?.medium || '',
        rating: item.media.averageScore ? Math.round((item.media.averageScore / 10) * 10) / 10 : 0,
        episodes: item.media.episodes || null,
        next_episode: item.episode,
        status: item.media.status || 'Currently Airing',
        broadcast: `${safeDay.charAt(0).toUpperCase() + safeDay.slice(1)}s at ${airDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`,
        broadcast_time: airDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        airing_date: formattedDate,
        day: safeDay,
        genres: item.media.genres || [],
        genre: (item.media.genres || []).join(', '),
        synopsis: (item.media.description || '').replace(/<[^>]*>/g, ''),
      };
    });

    return {
      data: items,
      day: safeDay,
      date: formattedDate,
      total: items.length,
    };
  } catch (aniErr) {
    console.error('AniList schedule fallback also failed:', aniErr.message);
  }

  return {
    data: [],
    day: safeDay,
    date: formattedDate,
    total: 0,
  };
}

module.exports = {
  searchAnime,
  getTrendingAnime,
  getOngoingAnime,
  getWeeklySchedule,
  getAnimeById,
};
