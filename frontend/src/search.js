import express from 'express';
import db from '../db/index.js';

const router = express.Router();

function applyBestCode(product) {
  const codes = db.prepare(`
    SELECT * FROM codes WHERE retailer = ? AND status = 'active'
  `).all(product.retailer);

  let best = null;
  let bestRate = -1;
  for (const c of codes) {
    const total = c.votes_up + c.votes_down;
    const rate = total === 0 ? 0 : (c.votes_up / total) * 100;
    // require at least a 60% success rate and some votes to trust a code
    if (total >= 1 && rate >= 60 && rate > bestRate) {
      best = c;
      bestRate = rate;
    }
  }

  let finalPrice = product.price + product.shipping;
  let appliedCode = null;

  if (best) {
    if (best.discount_type === 'percent' && best.discount_value) {
      finalPrice = product.price * (1 - best.discount_value / 100) + product.shipping;
      appliedCode = { code: best.code, description: best.description, success_rate: Math.round(bestRate) };
    } else if (best.discount_type === 'fixed' && best.discount_value) {
      finalPrice = Math.max(0, product.price - best.discount_value) + product.shipping;
      appliedCode = { code: best.code, description: best.description, success_rate: Math.round(bestRate) };
    } else if (best.discount_type === 'shipping') {
      finalPrice = product.price;
      appliedCode = { code: best.code, description: best.description, success_rate: Math.round(bestRate) };
    }
  }

  return {
    ...product,
    base_total: Math.round((product.price + product.shipping) * 100) / 100,
    final_price: Math.round(finalPrice * 100) / 100,
    applied_code: appliedCode
  };
}

// Naive keyword bucket matcher for MVP. Real version would use
// a search index / embeddings against live retailer data.
// Scores each known tag by how many of its words appear in the query,
// and only returns a match if at least one word overlaps.
function matchQueryTag(query) {
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);
  const tags = db.prepare('SELECT DISTINCT query_tag FROM products').all().map(r => r.query_tag);

  let bestTag = null;
  let bestScore = 0;

  for (const tag of tags) {
    const tagWords = tag.split(' ');
    const overlap = tagWords.filter(w => qWords.includes(w)).length;
    if (overlap > bestScore) {
      bestScore = overlap;
      bestTag = tag;
    }
  }

  return bestScore > 0 ? bestTag : null;
}

// GET /api/search?q=pink+dress
router.get('/', (req, res) => {
  const q = (req.query.q || '').trim();
  if (!q) return res.status(400).json({ error: 'query param "q" is required' });

  const tag = matchQueryTag(q);
  if (!tag) return res.json({ query: q, matched_tag: null, results: [] });

  const products = db.prepare('SELECT * FROM products WHERE query_tag = ?').all(tag);
  const withPricing = products.map(applyBestCode).sort((a, b) => a.final_price - b.final_price);

  res.json({ query: q, matched_tag: tag, results: withPricing });
});

export default router;
