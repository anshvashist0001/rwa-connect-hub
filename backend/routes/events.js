const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const { log } = require('../middleware/logger');

// GET /api/events — public
router.get('/', async (req, res) => {
  try {
    const { upcoming, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM events WHERE is_active = true';
    const params = [];

    if (upcoming === 'true') {
      sql += ' AND event_date >= CURRENT_DATE';
    }

    sql += ' ORDER BY event_date ASC';
    params.push(parseInt(limit));
    sql += ` LIMIT $${params.length}`;
    params.push(parseInt(offset));
    sql += ` OFFSET $${params.length}`;

    const result = await query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/events/:id — public
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM events WHERE id = $1 AND is_active = true', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Event not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/events — admin only
router.post('/', authenticate, (req, res, next) => {
  req.uploadSubdir = 'events';
  next();
}, uploadDocument.single('brochure'), async (req, res) => {
  const { title, description, event_date, start_time, end_time, location } = req.body;
  if (!title || !event_date) {
    return res.status(400).json({ error: 'Title and event_date are required' });
  }

  try {
    let brochureUrl = null, brochureName = null;
    if (req.file) {
      brochureUrl = `/uploads/events/${req.file.filename}`;
      brochureName = req.file.originalname;
    }

    const result = await query(
      `INSERT INTO events (title, description, event_date, start_time, end_time, location, brochure_url, brochure_name, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [title, description, event_date, start_time, end_time, location, brochureUrl, brochureName, req.admin.id]
    );
    const event = result.rows[0];
    await log(req.admin.id, req.admin.name, 'CREATE_EVENT', 'event', event.id, { title });
    res.status(201).json(event);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/events/:id — admin only
router.put('/:id', authenticate, (req, res, next) => {
  req.uploadSubdir = 'events';
  next();
}, uploadDocument.single('brochure'), async (req, res) => {
  try {
    const existing = await query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Event not found' });

    const { title, description, event_date, start_time, end_time, location } = req.body;
    let brochureUrl = existing.rows[0].brochure_url;
    let brochureName = existing.rows[0].brochure_name;

    if (req.file) {
      brochureUrl = `/uploads/events/${req.file.filename}`;
      brochureName = req.file.originalname;
    }

    const result = await query(
      `UPDATE events SET title=$1, description=$2, event_date=$3, start_time=$4, end_time=$5,
       location=$6, brochure_url=$7, brochure_name=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [
        title || existing.rows[0].title,
        description,
        event_date || existing.rows[0].event_date,
        start_time,
        end_time,
        location,
        brochureUrl,
        brochureName,
        req.params.id,
      ]
    );
    await log(req.admin.id, req.admin.name, 'UPDATE_EVENT', 'event', parseInt(req.params.id), { title });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/events/:id — admin only
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE events SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, title',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Event not found' });
    await log(req.admin.id, req.admin.name, 'DELETE_EVENT', 'event', parseInt(req.params.id), { title: result.rows[0].title });
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
