const router = require('express').Router();
const path = require('path');
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const { log } = require('../middleware/logger');

// GET /api/notices — public
router.get('/', async (req, res) => {
  try {
    const { type, search, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM notices WHERE is_active = true';
    const params = [];

    if (type && type !== 'all') {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }
    if (search) {
      params.push(`%${search}%`);
      sql += ` AND title ILIKE $${params.length}`;
    }
    sql += ' ORDER BY created_at DESC';
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

// GET /api/notices/:id — public
router.get('/:id', async (req, res) => {
  try {
    const result = await query('SELECT * FROM notices WHERE id = $1 AND is_active = true', [req.params.id]);
    if (!result.rows[0]) return res.status(404).json({ error: 'Notice not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/notices — admin only
router.post('/', authenticate, (req, res, next) => {
  req.uploadSubdir = 'notices';
  next();
}, uploadDocument.single('file'), async (req, res) => {
  const { title, content, type } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });

  try {
    let fileUrl = null, fileName = null, fileSize = null;
    if (req.file) {
      fileUrl = `/uploads/notices/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = formatSize(req.file.size);
    }

    const result = await query(
      `INSERT INTO notices (title, content, type, file_url, file_name, file_size, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, content, type || 'general', fileUrl, fileName, fileSize, req.admin.id]
    );
    const notice = result.rows[0];
    await log(req.admin.id, req.admin.name, 'CREATE_NOTICE', 'notice', notice.id, { title });
    res.status(201).json(notice);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/notices/:id — admin only
router.put('/:id', authenticate, (req, res, next) => {
  req.uploadSubdir = 'notices';
  next();
}, uploadDocument.single('file'), async (req, res) => {
  const { title, content, type } = req.body;
  try {
    const existing = await query('SELECT * FROM notices WHERE id = $1', [req.params.id]);
    if (!existing.rows[0]) return res.status(404).json({ error: 'Notice not found' });

    let fileUrl = existing.rows[0].file_url;
    let fileName = existing.rows[0].file_name;
    let fileSize = existing.rows[0].file_size;

    if (req.file) {
      fileUrl = `/uploads/notices/${req.file.filename}`;
      fileName = req.file.originalname;
      fileSize = formatSize(req.file.size);
    }

    const result = await query(
      `UPDATE notices SET title=$1, content=$2, type=$3, file_url=$4, file_name=$5, file_size=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [title || existing.rows[0].title, content, type || existing.rows[0].type, fileUrl, fileName, fileSize, req.params.id]
    );
    await log(req.admin.id, req.admin.name, 'UPDATE_NOTICE', 'notice', parseInt(req.params.id), { title });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/notices/:id — admin only (soft delete)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE notices SET is_active = false, updated_at = NOW() WHERE id = $1 RETURNING id, title',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Notice not found' });
    await log(req.admin.id, req.admin.name, 'DELETE_NOTICE', 'notice', parseInt(req.params.id), { title: result.rows[0].title });
    res.json({ message: 'Notice deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

module.exports = router;
