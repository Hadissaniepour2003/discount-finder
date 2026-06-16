import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import { SEED_PRODUCTS } from './seedProducts.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new DatabaseSync(path.join(__dirname, '../../data.db'));

db.exec(`
CREATE TABLE IF NOT EXISTS codes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  retailer TEXT NOT NULL,
  code TEXT NOT NULL,
  discount_type TEXT NOT NULL DEFAULT 'unknown',
  discount_value REAL,
  description TEXT,
  source TEXT DEFAULT 'user submitted',
  votes_up INTEGER NOT NULL DEFAULT 0,
  votes_down INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_verified_at TEXT
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_tag TEXT NOT NULL,
  retailer TEXT NOT NULL,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  shipping REAL NOT NULL DEFAULT 0,
  url TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_products_query_tag ON products(query_tag);
CREATE INDEX IF NOT EXISTS idx_codes_retailer ON codes(retailer);
`);

// Seed data if empty
const codeCount = db.prepare('SELECT COUNT(*) as c FROM codes').get().c;
if (codeCount === 0) {
  const insertCode = db.prepare(`
    INSERT INTO codes (retailer, code, discount_type, discount_value, description, source, votes_up, votes_down, last_verified_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);
  const seedCodes = [
    ['Shein', 'SHEIN25', 'percent', 25, '25% off orders over $50', '@fashionwithlea on TikTok', 41, 3],
    ['Temu', 'TEMU10NEW', 'fixed', 10, '$10 off first order', 'user submitted', 18, 1],
    ['Amazon', 'PRIME5OFF', 'percent', 5, '5% off select fashion', '@dealsdaily on YouTube', 9, 4],
    ['Zalando', 'Z20WELCOME', 'percent', 20, '20% off first purchase', 'user submitted', 27, 2],
    ['Calvin Klein', 'CKFRIENDS15', 'percent', 15, '15% off + free shipping', '@styleguy on Instagram', 33, 6]
  ];
  for (const c of seedCodes) insertCode.run(...c);
}

const BRAND_PRODUCTS = [
  ['calvin klein', 'Calvin Klein', 'CK logo cotton t-shirt', 39.90, 5.95, 'https://calvinklein.com/example', null],
  ['calvin klein', 'Amazon', 'Calvin Klein logo tee (same SKU)', 32.99, 0, 'https://amazon.com/example', null],
  ['calvin klein', 'Zalando', 'Calvin Klein cotton t-shirt', 35.00, 0, 'https://zalando.com/example', null]
];

const ALL_SEED_PRODUCTS = [...SEED_PRODUCTS, ...BRAND_PRODUCTS];

// Always wipe and reseed the products table on startup. This is demo/seed
// data only (no real user-submitted products), so we always want it to
// reflect the current seedProducts.js catalog rather than whatever was
// persisted from a previous deploy.
db.exec('DELETE FROM products');
const insertProduct = db.prepare(`
  INSERT INTO products (query_tag, retailer, title, price, shipping, url, image_url)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);
for (const p of ALL_SEED_PRODUCTS) insertProduct.run(...p);

export default db;
