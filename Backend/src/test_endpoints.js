const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function runTests() {
  console.log('--- Starting Backend API Test Suite ---');
  const testEmail = `testuser_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let authToken = '';

  try {
    // 1. Health check
    console.log('\n1. Testing GET / ...');
    const healthRes = await axios.get(`${BASE_URL}/`);
    console.log('✔ Health check:', healthRes.data);

    // 2. Register User
    console.log('\n2. Testing POST /api/login/newuser ...');
    const registerRes = await axios.post(`${BASE_URL}/api/login/newuser`, {
      name: 'Anime Tester',
      email: testEmail,
      password: testPassword,
    });
    console.log('✔ User Registered:', registerRes.data.user);
    authToken = registerRes.data.token;

    // 3. User Login
    console.log('\n3. Testing POST /api/login ...');
    const loginRes = await axios.post(`${BASE_URL}/api/login`, {
      email: testEmail,
      password: testPassword,
    });
    console.log('✔ Login successful, token received:', !!loginRes.data.token);
    authToken = loginRes.data.token;

    const authHeaders = {
      headers: { Authorization: `Bearer ${authToken}` },
    };

    // 4. Anime Search
    console.log('\n4. Testing GET /api/anime/search?q=Attack on Titan ...');
    const searchRes = await axios.get(`${BASE_URL}/api/anime/search?q=Attack on Titan&limit=3`);
    console.log(`✔ Found ${searchRes.data.count} anime.`);
    const sampleAnime = searchRes.data.data[0];
    console.log('Sample anime found:', {
      mal_id: sampleAnime?.mal_id,
      title: sampleAnime?.title,
      rating: sampleAnime?.rating,
      image_url: sampleAnime?.image_url?.slice(0, 50) + '...',
    });

    // 5. Add to Watchlist
    console.log('\n5. Testing POST /api/watchlist ...');
    const addWatchlistRes = await axios.post(
      `${BASE_URL}/api/watchlist`,
      {
        name: sampleAnime.title,
        image_url: sampleAnime.image_url,
        mal_id: sampleAnime.mal_id,
      },
      authHeaders
    );
    console.log('✔ Added to Watchlist:', addWatchlistRes.data.data);
    const watchlistId = addWatchlistRes.data.data.id;

    // 6. Get Watchlist
    console.log('\n6. Testing GET /api/watchlist ...');
    const getWatchlistRes = await axios.get(`${BASE_URL}/api/watchlist`, authHeaders);
    console.log(`✔ Current Watchlist count: ${getWatchlistRes.data.count}`);

    // 7. Add / Move to Watched
    console.log('\n7. Testing POST /api/watched ...');
    const addWatchedRes = await axios.post(
      `${BASE_URL}/api/watched`,
      {
        title: sampleAnime.title,
        rating: 9,
        start_date: '2026-01-01',
        completed_date: '2026-02-01',
        notes: 'Masterpiece anime!',
        mal_id: sampleAnime.mal_id,
        image_url: sampleAnime.image_url,
        remove_from_watchlist: true,
      },
      authHeaders
    );
    console.log('✔ Added to Watched:', addWatchedRes.data.data);
    const watchedId = addWatchedRes.data.data.id;

    // 8. Verify Watchlist was cleaned up after move
    const afterWatchlist = await axios.get(`${BASE_URL}/api/watchlist`, authHeaders);
    console.log(`✔ Watchlist count after move to watched: ${afterWatchlist.data.count}`);

    // 9. Update Watched entry
    console.log('\n9. Testing PUT /api/watched/:id ...');
    const updateWatchedRes = await axios.put(
      `${BASE_URL}/api/watched/${watchedId}`,
      {
        rating: 10,
        notes: 'Updated note: 10/10 incredible soundtrack and story.',
      },
      authHeaders
    );
    console.log('✔ Updated Watched item rating & notes:', {
      rating: updateWatchedRes.data.data.rating,
      notes: updateWatchedRes.data.data.notes,
    });

    // 10. Get Watched List
    console.log('\n10. Testing GET /api/watched ...');
    const getWatchedRes = await axios.get(`${BASE_URL}/api/watched?sort=rating_desc`, authHeaders);
    console.log(`✔ Watched list count: ${getWatchedRes.data.count}, highest rating: ${getWatchedRes.data.data[0]?.rating}`);

    console.log('\n===========================================');
    console.log('🎉 ALL BACKEND API TESTS PASSED SUCCESSFULLY!');
    console.log('===========================================\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.response ? err.response.data : err.message);
    process.exit(1);
  }
}

// Allow server to be started if testing standalone
runTests();
