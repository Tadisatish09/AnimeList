const axios = require('axios');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const db = require('./config/database.js');

const rawList = [
  "1. Pokemon all episodes",
  "2. Classroom of the elite",
  "3.God of high school",
  "4. Naruto all episodes",
  "5.shikkmari San Is not just cute",
  "6 My tiny senpai",
  "7 Blue lock",
  "8 Haikyuu",
  "9 Redo of healer",
  "10 Demon king is reincarnated as a typical nobody",
  "11 master of time killing",
  "12 High school dxd",
  "13 High school prodigies",
  "14 Rent a girlfriend",
  "15 Tonikawa kawaii",
  "16 Suzume",
  "17 Weathering with you",
  "18 Your name",
  "19 Silent voice",
  "20 Horimiya",
  "21 one piece",
  "22 My star",
  "23 world's greatest assassin is reincarnated in the world of magic",
  "24. Erased",
  "25. Aot",
  "26. The garden of words",
  "27 Your lie in april",
  "28. Darling in Fran x xx(zero two)",
  "29.orange (we can live without regrets)",
  "30.the daily life of the immortal king",
  "31. Battle in 5 seconds",
  "32. The quintessential quintuplets",
  "33 Bongo stray dogs",
  "34. Loving Yamada at level 999",
  "35. Dangers in my heart",
  "36. Trapped in a Dating Sim: The World of Otome Games is Tough for Mobs",
  "37. Chilling in another world with level 2 super cheat powers",
  "38. Vinland saga",
  "39. Perfect blue",
  "40. Just because",
  "41. Hyouka",
  "42. Parasyte the maxim",
  "43. Josee the tiger and the fish",
  "44. Chainsaw man",
  "45. Akame ga kill",
  "46. Code Geass: Lelouch of the Rebellion",
  "47. Relife",
  "48.kubo won't let me be invisible",
  "49.Rascals don't dream of bunny girl",
  "50,Mushoku Tensei: Jobless Reincarnation",
  "51.To me the one who loved you",
  "52.The new gate",
  "53.Tower of god",
  "54.Shoshimin: How to Become Ordinary",
  "55,My Instant Death Ability is So Overpowered, No One in This Other World Stands a Chance Against Me!",
  "56. 86",
  "57. Violet ever garden",
  "58.my dress up darling",
  "59.Terror in resonance",
  "60. God of high school",
  "61. Whisper of the heart",
  "62. Sword art online till now only 2 seasons",
  "63. Anoha the flower we saw that day",
  "64. Charlotte",
  "65. Insomnia after school",
  "66. Pseudo harem",
  "67.Kimi ne todoke from me to you s2",
  "68. The hero is very cautious",
  "69. The genius princes guide to raising a nation out of debt",
  "70. Farming in another world",
  "71.Banished from the hero party",
  "72 Campfire cooking in another world with my absurd skill",
  "73. Berserk of gluttony",
  "74.parallel world pharmacy",
  "75. Re monster",
  "76. Chained soldier",
  "77. Death March to the parallel world Rhapsody",
  "78. Ningen fushi: adventures who don't believe in humanity save the world",
  "79. Our dating story : the experiences you and the in experienced me",
  "80. Wandering witch the journey of Elaina",
  "81. Bubble",
  "82. Look back",
  "83. The girl who leapt through time",
  "84.My oni girl",
  "85. Tomochan is a girl",
  "86. Gamers",
  "87. If it's for my daughter I'd even defeat demon lord",
  "88. Akashic records of bastard magic instructor",
  "89. 7th time loop : the villainess enjoys a carefree married to her worst enemy",
  "90. I parry everything",
  "91. Kokoro connect",
  "92. Protocol: rain",
  "93. Tsukigakirei",
  "94. Oresuki",
  "95.My happy marriage",
  "97. A galaxy next door",
  "98.wistoria : wand and magic",
  "99. Dan da dan",
  "100.the boy and the beast",
  "101. Maquia when the promised flower blooms",
  "102. Anthem of the heart",
  "103. Fruit basket prelauge",
  "104. Assassination classroom",
  "105. Ragna crimson",
  "106.The girl I like forgot her glasses",
  "107. The dreaming boy is a realistic",
  "108.kotoura san",
  "109. Seven knights revolution:Hero successor",
  "110; chivalry of the failed knights",
  "111:Black summoner",
  "112.I'm quitting heroing",
  "113. Buddy daddies",
  "114. I have a crush at work",
  "115. A nobody's way up to an exploration hero",
  "116. Failure frame",
  "117. Berserk",
  "118. Words bubble up like a soda pop",
  "119. Patima inverted",
  "120. Wolf children",
  "121. Maid sama",
  "122. Another",
  "123. One out",
  "124. Honey lemon soda",
  "125. Boarding school juliet",
  "126. Sing a bit of harmony",
  "127. Demon king academy",
  "128. Takopi",
  "129. Grandpa and grandma turns young again",
  "130. The yuzuki family of four sons",
  "131. I left my A rank party to help my former students reach dungeon deaths",
  "132. Spirit chronicles",
  "133. Black clover",
  "134. Tearsome Empire",
  "135. Can a Boy and Girl Friendship Hold Up? (No, It Can't!!)",
  "136. Days with my step sister",
  "137. No game no life",
  "138. I want to escape from the princess lessons",
  "139. Over lord",
  "140. Hero without a class : who need skills?",
  "141. King's game",
  "142. My Gift Lvl 9999 Unlimited Gacha: Backstabbed in a Backwater Dungeon, I'm Out for Revenge",
  "143. my stats is in assassin is obviously exceeds the hero",
  "144. Jelly fish can't swin at night",
  "145. The aristocrat's otherworldly adventure: serving gods who go too far",
  "146. Remake our life",
  "147. An Archdemon's Dilemma: How to Love Your Elf Bride",
  "148. Chillin' in My 30s after Getting Fired from the Demon King's Army",
  "149. Am I Actually the Strongest?",
  "150. The Hidden Dungeon Only I Can Enter",
  "151. Why Raeliana Ended up at the Duke's Mansion",
  "152. Jack-of-All-Trades, Party of None",
  "153. Itakiss",
  "154. Hell Mode: The Hardcore Gamer Dominates in Another World with Garbage Balancing",
  "155. Grimoire of zero",
  "156. You and I Are Polar Opposites",
  "157. In the Clear Moonlit Dusk",
  "158. The ossan newbie adventure",
  "159. A place further than the Universe",
  "160. Skeleton knight in another world",
  "161. Sentenced to be a hero",
  "162. Let this greiving soul retire",
  "163. The world is still beautiful",
  "164. I don't want to get hurt so I'll my out my defense",
  "165. My hero academia",
  "166. Grave of flies",
  "167. Spirited away",
  "168. Tomodachi game",
  "169. In this corner of the World",
  "170. Noble Reincarnation: Born Blessed, So I'll Obtain Ultimate Power",
  "171. The Master of Ragnarok & Blesser of Einherjar",
  "172. Didn't I Say To Make My Abilities Average In The Next Life?!",
  "173. Taisho otome fairytale",
  "174. Trapezium",
  "175. The Klutzy Class Monitor and the Girl with the Short Skirt",
  "176. Gals Can't Be Kind to Otaku!?",
  "177. I Made Friends with the Second Prettiest Girl in My Class",
  "178. Witch Hat Atelier",
  "179. I Can't Understand What My Husband Is Saying: 2nd Thread",
  "180. Kill Blue",
  "181. The Brilliant Healer’s New Life in the Shadows",
  "182. I Want to End this Love Game",
  "183. WorldEnd: What do you do at the end of the world? Are you busy? Will you save us",
  "184. This art club had a serious problem",
  "185. easy going territory defence by the optimistic lord",
  "186. From Overshadowed to Overpowered: Second Reincarnation of a Talentless Sage",
  "187. alderamin on the sky"
];

function cleanTitle(raw) {
  // Remove starting numbers like "1. ", "50,", "110;", "3." etc.
  let cleaned = raw.replace(/^\d+[\.\,\:\;\s]+/, '').trim();
  return cleaned;
}

function searchKeyword(title) {
  // Aliases and search-friendly terms
  const map = {
    "Aot": "Attack on Titan",
    "shikkmari San Is not just cute": "Shikimori's Not Just a Cutie",
    "Bongo stray dogs": "Bungou Stray Dogs",
    "Tonikawa kawaii": "Tonikaku Kawaii",
    "Silent voice": "Koe no Katachi",
    "My star": "Oshi no Ko",
    "Darling in Fran x xx(zero two)": "Darling in the Franxx",
    "orange (we can live without regrets)": "Orange",
    "Dangers in my heart": "Boku no Kokoro no Yabai Yats",
    "Rascals don't dream of bunny girl": "Seishun Buta Yarou",
    "Violet ever garden": "Violet Evergarden",
    "my dress up darling": "Sono Bisque Doll wa Koi wo Suru",
    "Anoha the flower we saw that day": "Ano Hi Mita Hana no Namae wo Bokutachi wa Mada Shiranai",
    "Kimi ne todoke from me to you s2": "Kimi ni Todoke",
    "The hero is very cautious": "Cautious Hero",
    "Fruit basket prelauge": "Fruits Basket: Prelude",
    "Grave of flies": "Grave of the Fireflies",
    "I don't want to get hurt so I'll my out my defense": "BOFURI",
    "Takopi": "Takopi's Original Sin",
    "Itakiss": "Itazura na Kiss",
    "Jelly fish can't swin at night": "Jellyfish Can't Swim in the Night",
    "Sword art online till now only 2 seasons": "Sword Art Online",
    "Pokemon all episodes": "Pokemon",
    "Naruto all episodes": "Naruto"
  };

  return map[title] || title;
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchJikanMetadata(query) {
  try {
    const res = await axios.get('https://api.jikan.moe/v4/anime', {
      params: { q: query, limit: 1 },
      timeout: 6000
    });
    if (res.data?.data && res.data.data.length > 0) {
      const anime = res.data.data[0];
      return {
        mal_id: anime.mal_id,
        title: anime.title_english || anime.title,
        image_url: anime.images?.webp?.large_image_url || anime.images?.jpg?.large_image_url || anime.images?.jpg?.image_url,
        genre: (anime.genres || []).map(g => g.name).join(', ') || 'Anime',
        description: (anime.synopsis || '').slice(0, 1000)
      };
    }
  } catch (err) {
    // ignore fetch error
  }
  return null;
}

async function main() {
  console.log('--- Starting User Creation & Watched Anime Seeding ---');

  // Ensure DB columns can handle larger titles if needed
  try {
    await db.promise().query('ALTER TABLE `watched` MODIFY `title` VARCHAR(255) NULL');
    await db.promise().query('ALTER TABLE `watch_list` MODIFY `name` VARCHAR(255) NULL');
  } catch (e) {
    console.log('Column resize note:', e.message);
  }

  // 1. Create or update user 'satish'
  const email = 'satish09@gmail.com';
  const name = 'satish';
  const plainPassword = 'rama&maya';

  const [existingUser] = await db.promise().query(
    'SELECT id, name, email FROM users WHERE email = ? LIMIT 1',
    [email]
  );

  let userId;
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  if (existingUser.length > 0) {
    userId = existingUser[0].id;
    console.log(`User already exists with ID: ${userId}. Updating password...`);
    await db.promise().query(
      'UPDATE users SET password = ?, name = ? WHERE id = ?',
      [hashedPassword, name, userId]
    );
  } else {
    console.log(`Creating user ${name} (${email})...`);
    const [createRes] = await db.promise().query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    userId = createRes.insertId;
    console.log(`Created user with ID: ${userId}`);
  }

  // 2. Fetch existing watched list for satish
  const [existingWatched] = await db.promise().query(
    'SELECT id, title, mal_id FROM watched WHERE user_id = ?',
    [userId]
  );
  const existingTitles = new Set(existingWatched.map(w => (w.title || '').toLowerCase().trim()));

  console.log(`Found ${existingTitles.size} already completed items for user ID: ${userId}`);

  const todayStr = new Date().toISOString().slice(0, 10);
  let addedCount = 0;

  for (let i = 0; i < rawList.length; i++) {
    const raw = rawList[i];
    const clean = cleanTitle(raw);
    if (!clean) continue;

    const lowerClean = clean.toLowerCase();
    if (existingTitles.has(lowerClean)) {
      console.log(`[${i + 1}/${rawList.length}] Already in watched: "${clean}"`);
      continue;
    }

    const searchQuery = searchKeyword(clean);
    console.log(`[${i + 1}/${rawList.length}] Querying metadata for "${clean}" (search: "${searchQuery}")...`);

    let metadata = await fetchJikanMetadata(searchQuery);
    await sleep(350); // throttle for Jikan rate limit

    const titleToSave = metadata?.title || clean;
    const imageUrl = metadata?.image_url || null;
    const malId = metadata?.mal_id || null;
    const genre = metadata?.genre || 'Anime';
    const description = metadata?.description || null;
    const rating = Math.floor(Math.random() * 3) + 8; // Random score 8, 9, or 10

    await db.promise().query(
      `INSERT INTO watched (user_id, title, rating, completed_date, notes, mal_id, image_url, genre, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, titleToSave, rating, todayStr, 'Completed', malId, imageUrl, genre, description]
    );

    existingTitles.add(lowerClean);
    addedCount++;
    console.log(`  -> Successfully saved: "${titleToSave}" (Rating: ${rating}/10, ID: ${malId || 'N/A'})`);
  }

  console.log(`\n=== SEEDING COMPLETED ===`);
  console.log(`User: ${name} (${email})`);
  console.log(`Total new anime added: ${addedCount}`);
  const [totalRes] = await db.promise().query(
    'SELECT COUNT(*) as count FROM watched WHERE user_id = ?',
    [userId]
  );
  console.log(`Total completed anime in user's profile: ${totalRes[0].count}`);

  process.exit(0);
}

main().catch(err => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
