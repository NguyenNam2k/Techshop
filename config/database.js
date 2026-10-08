const mysql = require('mysql2/promise');
require('dotenv').config();

/**
 * MySQL Connection Pool Configuration
 * Utilizes mysql2/promise for async/await transactions and queries
 */
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'techshop_db',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  dateStrings: true,
  timezone: '+07:00'
});

/**
 * Ensure necessary auxiliary tables and default records exist.
 * - audit_logs: Needed for Transaction 2 (Product Update audit trail)
 * - Default category (id=1, "Uncategorized"): Needed for Transaction 5 (Category Cascade Reassignment)
 */
async function initDatabaseSchema() {
  let connection;
  try {
    connection = await pool.getConnection();

    // 1. Create audit_logs table if not exists
    await connection.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        \`entity_type\` VARCHAR(50) NOT NULL,
        \`entity_id\` INT UNSIGNED NOT NULL,
        \`action\` VARCHAR(50) NOT NULL,
        \`old_data\` JSON NULL,
        \`new_data\` JSON NULL,
        \`changed_by\` VARCHAR(100) NOT NULL DEFAULT 'Admin',
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX \`idx_audit_entity\` (\`entity_type\`, \`entity_id\`),
        INDEX \`idx_audit_action\` (\`action\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Ensure default "Uncategorized" category exists with id=1
    const [cats] = await connection.query(`SELECT id FROM \`categories\` WHERE \`id\` = 1 LIMIT 1`);
    if (cats.length === 0) {
      await connection.query(`
        INSERT INTO \`categories\` (\`id\`, \`name\`, \`slug\`, \`description\`)
        VALUES (1, 'Uncategorized', 'uncategorized', 'Danh mục mặc định hệ thống cho các thiết bị chưa phân loại')
        ON DUPLICATE KEY UPDATE \`name\` = \`name\`;
      `);
    }

    console.log('✅ Database schema verified (audit_logs & default category ready).');
  } catch (error) {
    console.warn('⚠️ Notice during initDatabaseSchema:', error.message);
  } finally {
    if (connection) connection.release();
  }
}

/**
 * Health check helper to test database connectivity
 */
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('🚀 MySQL Connection Pool successfully established.');
    connection.release();
    await initDatabaseSchema();
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to MySQL database:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
  initDatabaseSchema
};
