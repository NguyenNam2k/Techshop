const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const backendEnv = path.join(__dirname, '../..', '.env');
const rootEnv = path.join(__dirname, '../../..', '.env');
const envPath = fs.existsSync(backendEnv) ? backendEnv : rootEnv;
require('dotenv').config({ path: envPath });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number.parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : '',
  database: process.env.DB_NAME || 'techshop_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00'
});

module.exports = pool;
