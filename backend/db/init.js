require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

async function init() {
  const client = await pool.connect();
  try {
    console.log('Running schema...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('Schema applied.');

    // Seed default admin
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const name = process.env.ADMIN_NAME || 'RWA Administrator';

    const exists = await client.query('SELECT id FROM admins WHERE username = $1', [username]);
    if (exists.rows.length === 0) {
      const hash = await bcrypt.hash(password, 12);
      await client.query(
        'INSERT INTO admins (username, password_hash, name, role) VALUES ($1, $2, $3, $4)',
        [username, hash, name, 'superadmin']
      );
      console.log(`Admin created: ${username} / ${password}`);
    } else {
      console.log('Admin already exists, skipping seed.');
    }

    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Init failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
