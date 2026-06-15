const BASE = `${import.meta.env.VITE_API_URL || 'https://discount-finder.onrender.com'}/api`;

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  search: (q) => request(`/search?q=${encodeURIComponent(q)}`),
  getCodes: () => request('/codes'),
  getTrending: () => request('/codes/trending'),
  submitCode: (payload) => request('/codes', { method: 'POST', body: JSON.stringify(payload) }),
  vote: (id, direction) => request(`/codes/${id}/vote`, { method: 'POST', body: JSON.stringify({ direction }) }),
  parseCode: (text) => request('/parse-code', { method: 'POST', body: JSON.stringify({ text }) })
};
