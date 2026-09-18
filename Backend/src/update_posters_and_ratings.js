const axios = require('axios');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('./config/database.js');

function cleanSearch(title) {
  return title
    .replace(/^\d+[\.\,\:\;\s]+/, '')
    .replace(/\b(all episodes|s2|till now only \d+ seasons|zero two|we can live without regrets)\b/gi, '')
    .replace(/[\(\)]/g, '')
    .trim();
}

const aliases = {
  "Aot": "Attack on Titan",
  "shikkmari San Is not just cute": "Shikimori's Not Just a Cutie",
  "Bongo stray dogs": "Bungou Stray Dogs",
  "Tonikawa kawaii": "Tonikaku Kawaii",
  "Silent voice": "Koe no Katachi",
  "My star": "Oshi no Ko",
  "Darling in Fran x xx": "Darling in the Franxx",
  "orange": "Orange",
  "Dangers in my heart": "Boku no Kokoro no Yabai Yatsu",
  "Rascals don't dream of bunny girl": "Seishun Buta Yarou",
  "Violet ever garden": "Violet Evergarden",
  "my dress up darling": "My Dress-Up Darling",
  "Anoha the flower we saw that day": "Anohana",
  "Kimi ne todoke from me to you": "Kimi ni Todoke",
  "The hero is very cautious": "Cautious Hero",
  "Fruit basket prelauge": "Fruits Basket: Prelude",
  "Grave of flies": "Grave of the Fireflies",
  "I don't want to get hurt so I'll my out my defense": "BOFURI",
  "Takopi": "Takopi's Original Sin",
  "Itakiss": "Itazura na Kiss",
  "Jelly fish can't swin at night": "Jellyfish Can't Swim in the Night",
  "Sword art online": "Sword Art Online",
  "Dan da dan": "Dandadan",
  "Tearsome Empire": "Tearmoon Empire",
  "Over lord": "Overlord",
  "King's game": "Kings Game",
  "kotoura san": "Kotoura-san",
  "chivalry of the failed knights": "Chivalry of a Failed Knight",
  "My oni girl": "My Oni Girl",
  "Tomochan is a girl": "Tomo-chan Is a Girl!",
  "Protocol: rain": "Protocol: Rain",
  "Oresuki": "Ore o Suki na no wa Omae dake ka yo",
  "My happy marriage": "My Happy Marriage",
  "The dreaming boy is a realistic": "The Dreaming Boy Is a Realist",
  "Seven knights revolution:Hero successor": "Seven Knights Revolution: Eiyuu no Keishousha",
  "Remake our life": "Remake Our Life!",
  "Let this greiving soul retire": "Let This Grieving Soul Retire",
  "easy going territory defence by the optimistic lord": "Easygoing Territory Defense by the Optimistic Lord",
  "This art club had a serious problem": "This Art Club Has a Problem!"
};

async function fetchPoster(title) {
  const cleaned = cleanSearch(title);
  const q = aliases[cleaned] || aliases[title] || cleaned;

  // 1. Try Kitsu
  try {
    const res = await axios.get(`https://kitsu.io/api/edge/anime`, {
      params: { 'filter[text]': q, 'page[limit]': 1 },
      timeout: 5000
    });
    if (res.data?.data && res.data.data.length > 0) {
      const anime = res.data.data[0];
      const poster = anime.attributes?.posterImage?.large ||
                     anime.attributes?.posterImage?.medium ||
                     anime.attributes?.posterImage?.small ||
                     anime.attributes?.posterImage?.original;
      const desc = anime.attributes?.synopsis || '';
      if (poster) {
        return {
          imageUrl: poster,
          description: desc.slice(0, 1000)
        };
      }
    }
  } catch (err) {
    // Kitsu fallback
  }

  // 2. Try Jikan
  try {
    const res = await axios.get(`https://api.jikan.moe/v4/anime`, {
      params: { q, limit: 1 },
      timeout: 5000
    });
    if (res.data?.data && res.data.data.length > 0) {
      const anime = res.data.data[0];
      const poster = anime.images?.webp?.large_image_url ||
                     anime.images?.jpg?.large_image_url ||
                     anime.images?.jpg?.image_url;
      const desc = anime.synopsis || '';
      const genre = (anime.genres || []).map(g => g.name).join(', ');
      if (poster) {
        return {
          imageUrl: poster,
          description: desc.slice(0, 1000),
          genre: genre || 'Anime'
        };
      }
    }
  } catch (err) {
    // Jikan fallback
  }

  return null;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('Fetching user satish...');
  const [users] = await db.promise().query("SELECT id FROM users WHERE email = 'satish09@gmail.com'");
  if (users.length === 0) {
    console.error('User satish not found');
    process.exit(1);
  }
  const userId = users[0].id;

  const [items] = await db.promise().query(
    'SELECT id, title, image_url, rating FROM watched WHERE user_id = ?',
    [userId]
  );
  console.log(`Found ${items.length} completed anime items for satish.`);

  let updatedCount = 0;
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    console.log(`[${i + 1}/${items.length}] Processing: "${item.title}"...`);
    
    const posterData = await fetchPoster(item.title);
    const imageUrl = posterData?.imageUrl || item.image_url;
    const description = posterData?.description || null;
    const genre = posterData?.genre || null;

    await db.promise().query(
      `UPDATE watched 
       SET rating = 8, 
           image_url = COALESCE(?, image_url),
           description = COALESCE(?, description),
           genre = COALESCE(?, genre, 'Anime')
       WHERE id = ?`,
      [imageUrl, description, genre, item.id]
    );

    if (imageUrl) {
      console.log(`  -> Poster OK: ${imageUrl}`);
    } else {
      console.log(`  -> No poster found.`);
    }
    updatedCount++;
    await sleep(250); // slight throttle
  }

  console.log(`\nUpdated all ${updatedCount} items with default rating 8 and posters!`);
  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
