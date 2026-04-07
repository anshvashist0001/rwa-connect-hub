const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { log } = require('../middleware/logger');

// GET /api/committee — public
router.get('/', async (req, res) => {
  try {
    const result = await query(
      'SELECT * FROM committee_members WHERE is_active = true ORDER BY display_order, id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/committee — admin only
router.post('/', authenticate, (req, res, next) => {
  req.uploadSubdir = 'committee';
  next();
}, uploadImage.single('photo'), async (req, res) => {
  const { name, designation, phone, email, bio, display_order } = req.body;
  if (!name || !designation) return res.status(400).json({ error: 'name and designation are required' });

  try {
    let photoUrl = null;
    if (req.file) photoUrl = `/uploads/committee/${req.file.filename}`;

    const result = await query(
      `INSERT INTO committee_members (name, designation, phone, email, bio, photo_url, display_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name.trim(), designation, phone || null, email || null, bio || null, photoUrl, parseInt(display_order) || 99]
    );
    const member = result.rows[0];
    await log(req.admin.id, req.admin.name, 'ADD_COMMITTEE_MEMBER', 'committee', member.id, { name, designation });
    res.status(201).json(member);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/committee/:id — admin only
router.put('/:id', authenticate, (req, res, next) => {
  req.uploadSubdir = 'committee';
  next();
}, uploadImage.single('photo'), async (req, res) => {
  try {
    const existing = await query('SELECT * FROM committee_members WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Member not found' });

    const { name, designation, phone, email, bio, display_order, is_active } = req.body;
    let photoUrl = existing.rows[0].photo_url;
    if (req.file) photoUrl = `/uploads/committee/${req.file.filename}`;

    const result = await query(
      `UPDATE committee_members SET name=$1, designation=$2, phone=$3, email=$4, bio=$5,
       photo_url=$6, display_order=$7, is_active=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
      [
        name || existing.rows[0].name,
        designation || existing.rows[0].designation,
        phone || null,
        email || null,
        bio || null,
        photoUrl,
        parseInt(display_order) || existing.rows[0].display_order,
        is_active !== undefined ? is_active : existing.rows[0].is_active,
        req.params.id,
      ]
    );
    await log(req.admin.id, req.admin.name, 'UPDATE_COMMITTEE_MEMBER', 'committee', parseInt(req.params.id), { name });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/committee/:id — admin only
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE committee_members SET is_active = false WHERE id = $1 RETURNING id, name',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Member not found' });
    await log(req.admin.id, req.admin.name, 'DELETE_COMMITTEE_MEMBER', 'committee', parseInt(req.params.id), { name: result.rows[0].name });
    res.json({ message: 'Member removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
