const db = require('./database.js');

async function checkAndAddColumn(tableName, columnName, columnDefinition) {
  try {
    const [columns] = await db.promise().query(
      `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?`,
      [tableName, columnName]
    );

    if (columns.length === 0) {
      console.log(`Adding column '${columnName}' to table '${tableName}'...`);
      await db.promise().query(
        `ALTER TABLE \`${tableName}\` ADD COLUMN \`${columnName}\` ${columnDefinition}`
      );
      console.log(`Column '${columnName}' added to '${tableName}'.`);
    }
  } catch (error) {
    console.error(`Error checking/adding column '${columnName}' to '${tableName}':`, error.message);
  }
}

async function runMigrations() {
  console.log('Running database schema migrations...');

  try {
    // 1. Create users table if not exists
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(50) NOT NULL,
        email VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 2. Create watch_list table if not exists
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS watch_list (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        name VARCHAR(75) NULL,
        image_url TEXT NULL,
        mal_id INT NULL,
        genre VARCHAR(255) NULL,
        description TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Create watched table if not exists
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS watched (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NULL,
        title VARCHAR(75) NULL,
        rating INT NOT NULL,
        start_date DATE NULL,
        completed_date DATE NULL,
        notes TEXT NULL,
        mal_id INT NULL,
        image_url TEXT NULL,
        genre VARCHAR(255) NULL,
        description TEXT NULL
      )
    `);

    // 4. Create api_configs table if not exists
    await db.promise().query(`
      CREATE TABLE IF NOT EXISTS api_configs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        provider_name VARCHAR(50) NOT NULL UNIQUE,
        base_url VARCHAR(255) NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // 5. Ensure missing columns exist
    await checkAndAddColumn('watch_list', 'user_id', 'INT NULL');
    await checkAndAddColumn('watch_list', 'mal_id', 'INT NULL');
    await checkAndAddColumn('watch_list', 'genre', 'VARCHAR(255) NULL');
    await checkAndAddColumn('watch_list', 'description', 'TEXT NULL');

    await checkAndAddColumn('watched', 'user_id', 'INT NULL');
    await checkAndAddColumn('watched', 'image_url', 'TEXT NULL');
    await checkAndAddColumn('watched', 'genre', 'VARCHAR(255) NULL');
    await checkAndAddColumn('watched', 'description', 'TEXT NULL');

    // 6. Seed default API configurations if empty
    const [existingConfigs] = await db.promise().query('SELECT id FROM api_configs LIMIT 1');
    if (existingConfigs.length === 0) {
      await db.promise().query(`
        INSERT INTO api_configs (provider_name, base_url, is_active) VALUES
        ('jikan', 'https://api.jikan.moe/v4/anime', 1),
        ('kitsu', 'https://kitsu.io/api/edge/anime', 1)
      `);
      console.log('Seeded default API providers into `api_configs` table.');
    }

    console.log('Database migrations completed successfully.');
  } catch (err) {
    console.error('Migration error:', err.message);
  }
}

module.exports = { runMigrations };

if (require.main === module) {
  runMigrations()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Migration failed:', err);
      process.exit(1);
    });
}
