const { query } = require('../config/db');

const log = async (adminId, adminName, action, entityType, entityId, details) => {
  try {
    await query(
      `INSERT INTO admin_logs (admin_id, admin_name, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [adminId, adminName, action, entityType, entityId, details ? JSON.stringify(details) : null]
    );
  } catch (err) {
    console.error('Failed to write log:', err.message);
  }
};

module.exports = { log };
