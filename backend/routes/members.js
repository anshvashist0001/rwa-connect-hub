const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { log } = require('../middleware/logger');

// All member routes require admin auth

// GET /api/members
router.get('/', authenticate, async (req, res) => {
  try {
    const { search, limit = 100, offset = 0 } = req.query;
    let sql = 'SELECT * FROM members';
    const params = [];

    if (search) {
      params.push(`%${search}%`);
      sql += ` WHERE (name ILIKE $1 OR phone ILIKE $1 OR flat_no ILIKE $1)`;
    }

    sql += ' ORDER BY flat_no, name';
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

// GET /api/members/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('SELECT * FROM members WHERE id = $1', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Member not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/members
router.post('/', authenticate, (req, res, next) => {
  req.uploadSubdir = 'members';
  next();
}, uploadImage.single('photo'), async (req, res) => {
  const { name, phone, flat_no, email } = req.body;
  if (!name || !phone || !flat_no) {
    return res.status(400).json({ error: 'name, phone, and flat_no are required' });
  }

  try {
    let photoUrl = null;
    if (req.file) photoUrl = `/uploads/members/${req.file.filename}`;

    const result = await query(
      `INSERT INTO members (name, phone, flat_no, email, photo_url)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [name.trim(), phone.trim(), flat_no.trim(), email || null, photoUrl]
    );
    const member = result.rows[0];
    await log(req.admin.id, req.admin.name, 'ADD_MEMBER', 'member', member.id, { name, flat_no });
    res.status(201).json(member);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Phone number already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/members/:id
router.put('/:id', authenticate, (req, res, next) => {
  req.uploadSubdir = 'members';
  next();
}, uploadImage.single('photo'), async (req, res) => {
  try {
    const existing = await query('SELECT * FROM members WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Member not found' });

    const { name, phone, flat_no, email, is_active } = req.body;
    let photoUrl = existing.rows[0].photo_url;
    if (req.file) photoUrl = `/uploads/members/${req.file.filename}`;

    const result = await query(
      `UPDATE members SET name=$1, phone=$2, flat_no=$3, email=$4, photo_url=$5, is_active=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [
        name || existing.rows[0].name,
        phone || existing.rows[0].phone,
        flat_no || existing.rows[0].flat_no,
        email !== undefined ? email : existing.rows[0].email,
        photoUrl,
        is_active !== undefined ? is_active : existing.rows[0].is_active,
        req.params.id,
      ]
    );
    await log(req.admin.id, req.admin.name, 'UPDATE_MEMBER', 'member', parseInt(req.params.id), { name });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Phone number already registered' });
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/members/:id (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE members SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Member not found' });
    await log(req.admin.id, req.admin.name, 'DELETE_MEMBER', 'member', parseInt(req.params.id), { name: result.rows[0].name });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
