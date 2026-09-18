const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env') });

const isLocalhost = ['127.0.0.1', 'localhost'].includes(process.env.DB_HOST || '');

const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'new',
  port: Number(process.env.DB_PORT) || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Aiven and cloud providers require SSL
  ...(isLocalhost ? {} : { ssl: { rejectUnauthorized: false } }),
};

const db = mysql.createPool(dbConfig);

module.exports = db;
