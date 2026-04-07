const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { log } = require('../middleware/logger');

// GET /api/houses
router.get('/', authenticate, async (req, res) => {
  try {
    const result = await query(
      `SELECT h.*, m.name as member_name, m.phone as member_phone
       FROM houses h
       LEFT JOIN members m ON h.member_id = m.id
       ORDER BY h.block, h.flat_no`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/houses
router.post('/', authenticate, async (req, res) => {
  const { flat_no, block, floor, type, member_id } = req.body;
  if (!flat_no) return res.status(400).json({ error: 'flat_no is required' });

  try {
    const result = await query(
      `INSERT INTO houses (flat_no, block, floor, type, member_id) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [flat_no.trim(), block || null, floor ? parseInt(floor) : null, type || null, member_id || null]
    );
    const house = result.rows[0];
    await log(req.admin.id, req.admin.name, 'ADD_HOUSE', 'house', house.id, { flat_no });
    res.status(201).json(house);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Flat number already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/houses/:id
router.put('/:id', authenticate, async (req, res) => {
  const { flat_no, block, floor, type, member_id } = req.body;
  try {
    const existing = await query('SELECT * FROM houses WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'House not found' });

    const result = await query(
      `UPDATE houses SET flat_no=$1, block=$2, floor=$3, type=$4, member_id=$5, updated_at=NOW()
       WHERE id=$6 RETURNING *`,
      [
        flat_no || existing.rows[0].flat_no,
        block !== undefined ? block : existing.rows[0].block,
        floor !== undefined ? parseInt(floor) : existing.rows[0].floor,
        type !== undefined ? type : existing.rows[0].type,
        member_id !== undefined ? member_id || null : existing.rows[0].member_id,
        req.params.id,
      ]
    );
    await log(req.admin.id, req.admin.name, 'UPDATE_HOUSE', 'house', parseInt(req.params.id), { flat_no });
    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Flat number already exists' });
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/houses/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query('DELETE FROM houses WHERE id=$1 RETURNING id, flat_no', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'House not found' });
    await log(req.admin.id, req.admin.name, 'DELETE_HOUSE', 'house', parseInt(req.params.id), { flat_no: result.rows[0].flat_no });
    res.json({ message: 'House removed' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
