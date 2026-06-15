import { useState } from 'react';
import { api } from './api.js';

export default function SearchPanel() {
  const [query, setQuery] = useState('pink dress');
  const [results, setResults] = useState([]);
  const [matchedTag, setMatchedTag] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.search(query);
      setResults(data.results);
      setMatchedTag(data.matched_tag);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div className="row" style={{ marginBottom: 16 }}>
        <input
          style={{ flex: 1 }}
          placeholder="e.g. pink dress, Calvin Klein"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && runSearch()}
        />
        <button className="primary" onClick={runSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {matchedTag && (
        <p className="section-label">
          Matched category: <strong>{matchedTag}</strong> (MVP keyword matching — real version uses
          retailer APIs + visual search)
        </p>
      )}

      {results.map((r, i) => (
        <a
          key={r.id}
          href={r.url || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className={`card result-link ${i === 0 ? 'cheapest' : ''}`}
        >
          <div className="card-row">
            <div>
              {i === 0 && <span className="badge">Cheapest</span>}
              <strong>{r.retailer}</strong>
              <span style={{ color: 'var(--text-secondary)' }}> &middot; {r.title}</span>
              {r.applied_code && (
                <div className="code-applied">
                  Code <code>{r.applied_code.code}</code> applied ({r.applied_code.description},{' '}
                  {r.applied_code.success_rate}% success rate)
                </div>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div>
                <p className="price">${r.final_price.toFixed(2)}</p>
                <p className="price-sub">
                  ${r.price.toFixed(2)} + ${r.shipping.toFixed(2)} ship
                </p>
              </div>
              <span className="go-arrow" aria-hidden="true">↗</span>
            </div>
          </div>
        </a>
      ))}

      {!loading && results.length === 0 && !error && (
        <p className="section-label">No results yet. Try searching for "pink dress" or "calvin klein".</p>
      )}
    </div>
  );
}
