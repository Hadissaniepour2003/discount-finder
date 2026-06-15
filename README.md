# Discount Finder (MVP)

A price comparison + crowdsourced discount code app. This is a working
prototype with two halves:

- **Backend** (`/backend`) — Node/Express API with a local SQLite database
  (using Node's built-in `node:sqlite`, no native build tools required).
- **Frontend** (`/frontend`) — React app (Vite) with two tabs: price
  comparison search and the discount code feed (trending, submit, vote).

**Live demo:**
- App: https://discount-finder-frontend-grzodcyr2-hadis-saniepour-s-projects.vercel.app/
- Backend API: https://discount-finder.onrender.com

The backend free tier sleeps when idle — the first request after a period of
inactivity may take 30-60 seconds to respond.

## What's real vs. mocked

- **Price comparison** uses a generated catalog of mock products covering
  10 colors × 10 clothing items (~330 listings across Shein, Amazon,
  Zalando, and Temu), plus a small "Calvin Klein" brand example. Search
  matches on exact "`<color> <item>`" combinations (e.g. "blue dress",
  "olive jacket").
  - For combinations outside the curated catalog (extra colors like navy,
    orange, olive, or extra items like scarf, boots, bag), results are
    generated on the fly deterministically — same search always returns the
    same fake prices, without needing every combination pre-seeded.
  - This is all mock data with placeholder URLs. Real retailer data (Amazon
    Product Advertising API, etc.) would replace this layer — see
    `backend/src/db/seedProducts.js` for where it plugs in.
- **Discount codes** are fully functional: submit a code, vote it up/down,
  and the trending list + price comparison automatically use the
  highest-success-rate active code for each retailer (60%+ success rate
  required before a code gets auto-applied).
- **AI code parsing** (`/api/parse-code`) calls the real Anthropic API to
  extract a structured code from pasted text (e.g. a screenshot caption or
  social post). Requires an `ANTHROPIC_API_KEY`.

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# optionally add your ANTHROPIC_API_KEY to .env for code parsing
npm run dev
```

Runs on `http://localhost:3001`. A `data.db` SQLite file is created
automatically and seeded with sample products and codes on first run.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173` and proxies `/api/*` requests to the backend
during local development. In production (Vercel), `frontend/src/api.js`
points at the deployed backend URL directly (configurable via the
`VITE_API_URL` environment variable).

## Deployment notes

- **Backend (Render)**: free Web Service, root directory `backend`, build
  command `npm install`, start command `npm start`. Free tier has an
  ephemeral filesystem, so `data.db` resets to seed data on redeploy — fine
  for a demo, not for persisting real user submissions.
- **Frontend (Vercel)**: free project, root directory `frontend`, framework
  preset Vite (auto-detected).

## API endpoints

- `GET /api/search?q=blue+dress` — price comparison results, sorted by final
  price after best applicable code. Response includes `source`: `"seed"`
  (curated catalog), `"generated"` (dynamic fallback), or `"none"` (no match).
- `GET /api/codes` — all submitted codes
- `GET /api/codes/trending` — top codes by success rate
- `GET /api/codes/retailer/:retailer` — active codes for one retailer
- `POST /api/codes` — submit a new code
  `{ retailer, code, discount_type, discount_value, description, source }`
- `POST /api/codes/:id/vote` — `{ direction: "up" | "down" }`
- `POST /api/parse-code` — `{ text }` → extracts code info via Claude

## Next steps (real product)

1. Swap the keyword-based product matcher for real retailer integrations
   (Amazon Product Advertising API first — it's free and official).
2. Add image-based search (visual similarity model / reverse image search
   API) for "find me this dress from a photo".
3. Move from SQLite to Postgres for production, add a `users` table and
   auth so votes/submissions are tied to accounts (prevents spam voting).
4. Add scheduled jobs to re-verify codes periodically and expire stale ones.
5. Consider a browser extension that reads the current product page and
   surfaces comparisons + codes automatically.

