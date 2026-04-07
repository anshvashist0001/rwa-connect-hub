const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/logs — admin only
router.get('/', authenticate, async (req, res) => {
  try {
    const { action, entity_type, limit = 100, offset = 0 } = req.query;
    let sql = `SELECT al.*, a.username
               FROM admin_logs al
               LEFT JOIN admins a ON al.admin_id = a.id
               WHERE 1=1`;
    const params = [];

    if (action) {
      params.push(`%${action}%`);
      sql += ` AND al.action ILIKE $${params.length}`;
    }
    if (entity_type) {
      params.push(entity_type);
      sql += ` AND al.entity_type = $${params.length}`;
    }

    sql += ' ORDER BY al.created_at DESC';
    params.push(parseInt(limit));
    sql += ` LIMIT $${params.length}`;
    params.push(parseInt(offset));
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
