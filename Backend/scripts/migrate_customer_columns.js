const pool = require('../config/db');

async function migrate() {
  const [cols] = await pool.query('DESCRIBE customers');
  const existing = new Set(cols.map((c) => c.Field));

  const needed = [
    { name: 'birth_date', type: 'DATE NULL' },
    { name: 'bio', type: 'TEXT NULL' },
    { name: 'gender', type: "VARCHAR(20) DEFAULT 'male'" },
    { name: 'two_factor_enabled', type: 'TINYINT(1) DEFAULT 0' },
    { name: 'notification_preferences', type: 'JSON NULL' },
    { name: 'saved_addresses', type: 'JSON NULL' },
    { name: 'saved_payment_methods', type: 'JSON NULL' },
    { name: 'wishlist', type: 'JSON NULL' },
    { name: 'pc_builds', type: 'JSON NULL' },
    { name: 'points', type: 'INT DEFAULT 0' },
    { name: 'saved_vouchers', type: 'JSON NULL' },
    { name: 'password_changed_at', type: 'TIMESTAMP NULL' }
  ];

  for (const col of needed) {
    if (!existing.has(col.name)) {
      console.log('Adding column to customers:', col.name);
      await pool.query(`ALTER TABLE customers ADD COLUMN \`${col.name}\` ${col.type}`);
    }
  }
  console.log('✅ All customer columns migrated successfully!');
  process.exit(0);
}

migrate().catch((e) => {
  console.error('Migration failed:', e);
  process.exit(1);
});
