const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/reports/payments — admin only
router.get('/payments', authenticate, async (req, res) => {
  try {
    const { from, to, status, flat_no } = req.query;
    let sql = `SELECT p.*, a.name as verified_by_name
               FROM payments p
               LEFT JOIN admins a ON p.verified_by = a.id
               WHERE 1=1`;
    const params = [];

    if (from) {
      params.push(from);
      sql += ` AND p.created_at >= $${params.length}`;
    }
    if (to) {
      params.push(to + ' 23:59:59');
      sql += ` AND p.created_at <= $${params.length}`;
    }
    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND p.status = $${params.length}`;
    }
    if (flat_no) {
      params.push(`%${flat_no}%`);
      sql += ` AND p.flat_no ILIKE $${params.length}`;
    }

    sql += ' ORDER BY p.created_at DESC';
    const result = await query(sql, params);

    // Summary
    const totalAmount = result.rows
      .filter((r) => r.status === 'approved')
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    res.json({
      payments: result.rows,
      summary: {
        total: result.rows.length,
        approved: result.rows.filter((r) => r.status === 'approved').length,
        pending: result.rows.filter((r) => r.status === 'pending').length,
        rejected: result.rows.filter((r) => r.status === 'rejected').length,
        totalCollected: totalAmount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/reports/members — admin only
router.get('/members', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, h.block, h.floor, h.type as flat_type,
              (SELECT COUNT(*) FROM payments p WHERE p.phone = m.phone AND p.status = 'approved') as approved_payments,
              (SELECT COALESCE(SUM(amount), 0) FROM payments p WHERE p.phone = m.phone AND p.status = 'approved') as total_paid
       FROM members m
       LEFT JOIN houses h ON m.flat_no = h.flat_no
       WHERE m.is_active = true
       ORDER BY m.flat_no`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
