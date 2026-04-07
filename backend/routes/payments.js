const router = require('express').Router();
const { query } = require('../config/db');
const { authenticate } = require('../middleware/auth');
const { uploadImage } = require('../middleware/upload');
const { log } = require('../middleware/logger');

// POST /api/payments — public (submit payment)
router.post('/', (req, res, next) => {
  req.uploadSubdir = 'screenshots';
  next();
}, uploadImage.single('screenshot'), async (req, res) => {
  const { name, phone, flat_no, amount, payment_type } = req.body;

  if (!name || !phone || !flat_no || !amount) {
    return res.status(400).json({ error: 'name, phone, flat_no, and amount are required' });
  }
  if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  try {
    let screenshotUrl = null, screenshotName = null;
    if (req.file) {
      screenshotUrl = `/uploads/screenshots/${req.file.filename}`;
      screenshotName = req.file.originalname;
    }

    const result = await query(
      `INSERT INTO payments (name, phone, flat_no, amount, payment_type, screenshot_url, screenshot_name)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, status, created_at`,
      [name.trim(), phone.trim(), flat_no.trim(), parseFloat(amount), payment_type || 'Membership Fee', screenshotUrl, screenshotName]
    );
    res.status(201).json({
      message: 'Payment submitted successfully. Status: Pending verification.',
      payment: result.rows[0],
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments/check?phone=xxx — public (check status by phone)
router.get('/check', async (req, res) => {
  const { phone } = req.query;
  if (!phone) return res.status(400).json({ error: 'Phone number required' });

  try {
    const result = await query(
      `SELECT id, flat_no, amount, payment_type, status, created_at, updated_at, remarks
       FROM payments WHERE phone = $1 ORDER BY created_at DESC`,
      [phone.trim()]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/payments — admin only (all payments)
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, limit = 50, offset = 0 } = req.query;
    let sql = 'SELECT * FROM payments';
    const params = [];
    const conditions = [];

    if (status && status !== 'all') {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }
    if (search) {
      params.push(`%${search}%`);
      conditions.push(`(name ILIKE $${params.length} OR phone ILIKE $${params.length} OR flat_no ILIKE $${params.length})`);
    }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY created_at DESC';
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

// PUT /api/payments/:id — admin only (approve/reject)
router.put('/:id', authenticate, async (req, res) => {
  const { status, remarks } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(status)) {
    return res.status(400).json({ error: 'Status must be approved, rejected, or pending' });
  }

  try {
    const result = await query(
      `UPDATE payments SET status=$1, remarks=$2, verified_by=$3, verified_at=NOW(), updated_at=NOW()
       WHERE id=$4 RETURNING *`,
      [status, remarks || null, req.admin.id, req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Payment not found' });

    const payment = result.rows[0];
    await log(req.admin.id, req.admin.name, `PAYMENT_${status.toUpperCase()}`, 'payment', payment.id, {
      name: payment.name,
      flat_no: payment.flat_no,
      amount: payment.amount,
      remarks,
    });
    res.json(payment);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
