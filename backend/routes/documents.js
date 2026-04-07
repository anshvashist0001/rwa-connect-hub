const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadDocument } = require('../middleware/upload');
const { log } = require('../middleware/logger');

// GET /api/documents — public
router.get('/', async (req, res) => {
  try {
    const { category } = req.query;
    let sql = 'SELECT * FROM documents WHERE is_active = true';
    const params = [];

    if (category) {
      params.push(category);
      sql += ` AND category = $${params.length}`;
    }

    sql += ' ORDER BY category, created_at DESC';
    const result = await query(sql, params);

    // Group by category
    const grouped = result.rows.reduce((acc, doc) => {
      if (!acc[doc.category]) acc[doc.category] = [];
      acc[doc.category].push(doc);
      return acc;
    }, {});

    res.json({ documents: result.rows, grouped });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/documents — admin only
router.post('/', authenticate, (req, res, next) => {
  req.uploadSubdir = 'documents';
  next();
}, uploadDocument.single('file'), async (req, res) => {
  const { title, category } = req.body;
  if (!title || !category) return res.status(400).json({ error: 'Title and category are required' });
  if (!req.file) return res.status(400).json({ error: 'File is required' });

  try {
    const fileUrl = `/uploads/documents/${req.file.filename}`;
    const ext = req.file.originalname.split('.').pop().toUpperCase();
    const fileSize = formatSize(req.file.size);

    const result = await query(
      `INSERT INTO documents (title, category, file_url, file_name, file_size, file_type, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [title, category, fileUrl, req.file.originalname, fileSize, ext, req.admin.id]
    );
    const doc = result.rows[0];
    await log(req.admin.id, req.admin.name, 'UPLOAD_DOCUMENT', 'document', doc.id, { title, category });
    res.status(201).json(doc);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/documents/:id — admin only
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const result = await query(
      'UPDATE documents SET is_active = false WHERE id = $1 RETURNING id, title',
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Document not found' });
    await log(req.admin.id, req.admin.name, 'DELETE_DOCUMENT', 'document', parseInt(req.params.id), { title: result.rows[0].title });
    res.json({ message: 'Document deleted' });
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
