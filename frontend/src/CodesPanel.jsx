import { useEffect, useState } from 'react';
import { api } from './api.js';

const RETAILERS = ['Shein', 'Amazon', 'Calvin Klein', 'Temu', 'Zalando'];
const DISCOUNT_TYPES = [
  { value: 'percent', label: '% off' },
  { value: 'fixed', label: '$ off' },
  { value: 'shipping', label: 'Free shipping' },
  { value: 'other', label: 'Other' }
];

export default function CodesPanel() {
  const [codes, setCodes] = useState([]);
  const [trending, setTrending] = useState([]);
  const [error, setError] = useState(null);

  const [retailer, setRetailer] = useState(RETAILERS[0]);
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [description, setDescription] = useState('');
  const [source, setSource] = useState('');

  const [parseText, setParseText] = useState('');
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  async function loadAll() {
    try {
      const [codesData, trendingData] = await Promise.all([api.getCodes(), api.getTrending()]);
      setCodes(codesData);
      setTrending(trendingData);
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleVote(id, direction) {
    try {
      await api.vote(id, direction);
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!code.trim() || !description.trim()) return;
    try {
      await api.submitCode({
        retailer,
        code: code.trim(),
        discount_type: discountType,
        discount_value: discountValue ? parseFloat(discountValue) : null,
        description: description.trim(),
        source: source.trim() || 'user submitted'
      });
      setCode('');
      setDiscountValue('');
      setDescription('');
      setSource('');
      await loadAll();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleParse() {
    if (!parseText.trim()) return;
    setParsing(true);
    setParseError(null);
    try {
      const parsed = await api.parseCode(parseText);
      if (RETAILERS.includes(parsed.retailer)) setRetailer(parsed.retailer);
      if (parsed.code) setCode(parsed.code);
      if (parsed.discount_type) setDiscountType(parsed.discount_type);
      if (parsed.discount_value != null) setDiscountValue(String(parsed.discount_value));
      if (parsed.description) setDescription(parsed.description);
    } catch (err) {
      setParseError(err.message);
    } finally {
      setParsing(false);
    }
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}

      <div className="trending-box">
        <p className="section-label" style={{ marginBottom: 8 }}>
          Trending right now
        </p>
        {trending.length === 0 && <p className="section-label">No trending codes yet — submit one below.</p>}
        {trending.map((c) => (
          <div key={c.id} className="card" style={{ marginBottom: 6, padding: '8px 12px' }}>
            <div className="card-row">
              <div>
                <strong style={{ fontSize: 13 }}>{c.retailer}</strong>
                <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}> &middot; {c.description}</span>
              </div>
              <div className="row" style={{ alignItems: 'center', gap: 8 }}>
                <code>{c.code}</code>
                <span className="success-rate">{c.success_rate}%</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="submit-box">
        <p style={{ fontWeight: 500, fontSize: 14, marginTop: 0, marginBottom: 8 }}>
          Got a screenshot or post text? Paste it here to auto-fill (uses Claude)
        </p>
        <textarea
          placeholder='e.g. "use code SAVE20 for 20% off everything at Shein, ends tonight!"'
          value={parseText}
          onChange={(e) => setParseText(e.target.value)}
        />
        <div className="row" style={{ marginTop: 8 }}>
          <button onClick={handleParse} disabled={parsing}>
            {parsing ? 'Parsing...' : 'Extract code with AI'}
          </button>
        </div>
        {parseError && <p className="error">{parseError}</p>}

        <hr style={{ margin: '16px 0', border: 'none', borderTop: '1px solid var(--border)' }} />

        <p style={{ fontWeight: 500, fontSize: 14, marginTop: 0, marginBottom: 8 }}>Submit a code</p>
        <form onSubmit={handleSubmit}>
          <div className="row">
            <select value={retailer} onChange={(e) => setRetailer(e.target.value)}>
              {RETAILERS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
            <input placeholder="Code, e.g. SAVE20" value={code} onChange={(e) => setCode(e.target.value)} />
          </div>
          <div className="row">
            <select value={discountType} onChange={(e) => setDiscountType(e.target.value)}>
              {DISCOUNT_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <input
              placeholder="Value, e.g. 20"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
            />
          </div>
          <div className="row">
            <input
              placeholder="Description, e.g. 20% off orders over $50"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="row">
            <input
              placeholder="Where you found it (optional, e.g. @influencer on TikTok)"
              value={source}
              onChange={(e) => setSource(e.target.value)}
            />
          </div>
          <button className="primary" type="submit" style={{ width: '100%', marginTop: 8 }}>
            Submit code
          </button>
        </form>
      </div>

      <p className="section-label">All codes</p>
      {codes.map((c) => (
        <div key={c.id} className="card">
          <div className="card-row">
            <div>
              <strong>{c.retailer}</strong> <code>{c.code}</code>
              {c.status === 'expired' && <span className="badge" style={{ background: '#faece7', color: 'var(--danger)' }}>Expired</span>}
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{c.source}</span>
          </div>
          <p style={{ fontSize: 13, margin: '6px 0 0' }}>{c.description}</p>
          <div className="code-meta">
            <span className="success-rate">{c.success_rate}% success</span>
            <div className="row">
              <button className="vote-btn" onClick={() => handleVote(c.id, 'up')}>
                👍 {c.votes_up}
              </button>
              <button className="vote-btn" onClick={() => handleVote(c.id, 'down')}>
                👎 {c.votes_down}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
