import express from 'express';
import db from '../db/index.js';

const router = express.Router();

function withSuccessRate(code) {
  const total = code.votes_up + code.votes_down;
  const success_rate = total === 0 ? 0 : Math.round((code.votes_up / total) * 100);
  return { ...code, success_rate };
}

// GET /api/codes - all codes, newest first
router.get('/', (req, res) => {
  const rows = db.prepare('SELECT * FROM codes ORDER BY created_at DESC').all();
  res.json(rows.map(withSuccessRate));
});

// GET /api/codes/trending - top codes by success rate, min vote threshold
router.get('/trending', (req, res) => {
  const rows = db.prepare('SELECT * FROM codes WHERE status = ?').all('active');
  const ranked = rows
    .map(withSuccessRate)
    .filter(c => (c.votes_up + c.votes_down) >= 1)
    .sort((a, b) => b.success_rate - a.success_rate || b.votes_up - a.votes_up)
    .slice(0, 5);
  res.json(ranked);
});

// GET /api/codes/retailer/:retailer - best active code for a retailer
router.get('/retailer/:retailer', (req, res) => {
  const rows = db.prepare('SELECT * FROM codes WHERE retailer = ? AND status = ?')
    .all(req.params.retailer, 'active');
  const ranked = rows.map(withSuccessRate).sort((a, b) => b.success_rate - a.success_rate);
  res.json(ranked);
});

// POST /api/codes - submit a new code
// body: { retailer, code, discount_type, discount_value, description, source }
router.post('/', (req, res) => {
  const { retailer, code, discount_type, discount_value, description, source } = req.body;
  if (!retailer || !code || !description) {
    return res.status(400).json({ error: 'retailer, code, and description are required' });
  }
  const result = db.prepare(`
    INSERT INTO codes (retailer, code, discount_type, discount_value, description, source, votes_up, votes_down)
    VALUES (?, ?, ?, ?, ?, ?, 1, 0)
  `).run(retailer, code, discount_type || 'other', discount_value || null, description, source || 'user submitted');

  const created = db.prepare('SELECT * FROM codes WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(withSuccessRate(created));
});

// POST /api/codes/:id/vote - body: { direction: 'up' | 'down' }
router.post('/:id/vote', (req, res) => {
  const { direction } = req.body;
  if (!['up', 'down'].includes(direction)) {
    return res.status(400).json({ error: 'direction must be "up" or "down"' });
  }
  const column = direction === 'up' ? 'votes_up' : 'votes_down';
  db.prepare(`UPDATE codes SET ${column} = ${column} + 1 WHERE id = ?`).run(req.params.id);

  const updated = db.prepare('SELECT * FROM codes WHERE id = ?').get(req.params.id);
  if (!updated) return res.status(404).json({ error: 'code not found' });

  // Auto-expire codes that are clearly not working anymore
  const total = updated.votes_up + updated.votes_down;
  if (total >= 5 && updated.votes_down / total > 0.6) {
    db.prepare('UPDATE codes SET status = ? WHERE id = ?').run('expired', updated.id);
    updated.status = 'expired';
  }

  res.json(withSuccessRate(updated));
});

export default router;
