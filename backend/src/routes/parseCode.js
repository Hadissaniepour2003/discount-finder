import express from 'express';

const router = express.Router();

// POST /api/parse-code
// body: { text: "raw text from a screenshot, social post, or description" }
// Uses the Anthropic API to extract structured code info from messy text.
// Requires ANTHROPIC_API_KEY in environment.
router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'ANTHROPIC_API_KEY not configured on the server. Set it in backend/.env'
    });
  }

  const prompt = `Extract discount code information from the following text. The text may come from a screenshot caption, social media post, or pasted description.

Return ONLY a JSON object (no markdown, no preamble) with this exact shape:
{
  "retailer": string,            // e.g. "Shein", "Amazon", "Calvin Klein", "Temu", "Zalando", or "Unknown"
  "code": string,                 // the actual discount code, e.g. "SAVE20", or "" if none found
  "discount_type": "percent" | "fixed" | "shipping" | "other",
  "discount_value": number|null,  // numeric value, e.g. 20 for "20% off", 10 for "$10 off"
  "description": string,          // short human-readable summary, e.g. "20% off orders over $50"
  "confidence": "high" | "medium" | "low"
}

Text:
"""
${text}
"""`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      return res.status(502).json({ error: 'Anthropic API request failed', detail: errBody });
    }

    const data = await response.json();
    const textBlock = data.content.find(b => b.type === 'text');
    if (!textBlock) return res.status(502).json({ error: 'No text response from model' });

    const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: 'Could not parse model output as JSON', raw: cleaned });
    }

    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Request to Anthropic API failed', detail: err.message });
  }
});

export default router;
