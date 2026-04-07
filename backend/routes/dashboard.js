const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');

// GET /api/dashboard — admin only
router.get('/', authenticate, async (req, res) => {
  try {
    const [members, payments, notices, events] = await Promise.all([
      query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE is_active = true) as active FROM members'),
      query(`SELECT
               COUNT(*) as total,
               COUNT(*) FILTER (WHERE status = 'pending') as pending,
               COUNT(*) FILTER (WHERE status = 'approved') as approved,
               COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
               COALESCE(SUM(amount) FILTER (WHERE status = 'approved'), 0) as total_collected
             FROM payments`),
      query('SELECT COUNT(*) as total FROM notices WHERE is_active = true'),
      query('SELECT COUNT(*) as total FROM events WHERE is_active = true AND event_date >= CURRENT_DATE'),
    ]);

    const recentPayments = await query(
      'SELECT id, name, flat_no, amount, status, created_at FROM payments ORDER BY created_at DESC LIMIT 5'
    );

    const recentNotices = await query(
      'SELECT id, title, type, created_at FROM notices WHERE is_active = true ORDER BY created_at DESC LIMIT 5'
    );

    res.json({
      stats: {
        members: {
          total: parseInt(members.rows[0].total),
          active: parseInt(members.rows[0].active),
        },
        payments: {
          total: parseInt(payments.rows[0].total),
          pending: parseInt(payments.rows[0].pending),
          approved: parseInt(payments.rows[0].approved),
          rejected: parseInt(payments.rows[0].rejected),
          totalCollected: parseFloat(payments.rows[0].total_collected),
        },
        notices: parseInt(notices.rows[0].total),
        upcomingEvents: parseInt(events.rows[0].total),
      },
      recentPayments: recentPayments.rows,
      recentNotices: recentNotices.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
