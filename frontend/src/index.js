import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

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

const productCount = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
if (productCount === 0) {
  const insertProduct = db.prepare(`
    INSERT INTO products (query_tag, retailer, title, price, shipping, url, image_url)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const seedProducts = [
    ['pink dress', 'Shein', 'Pink wrap midi dress', 18.99, 4.99, 'https://shein.com/example', null],
    ['pink dress', 'Amazon', 'Floral pink wrap dress', 27.50, 0, 'https://amazon.com/example', null],
    ['pink dress', 'Zalando', 'Pink belted midi dress', 39.99, 0, 'https://zalando.com/example', null],
    ['pink dress', 'Temu', 'Pink V-neck wrap dress', 12.30, 3.50, 'https://temu.com/example', null],

    ['blue dress', 'Shein', 'Blue floral summer dress', 16.50, 4.99, 'https://shein.com/example-blue-dress', null],
    ['blue dress', 'Amazon', 'Navy blue A-line dress', 29.99, 0, 'https://amazon.com/example-blue-dress', null],
    ['blue dress', 'Zalando', 'Blue maxi dress', 44.95, 0, 'https://zalando.com/example-blue-dress', null],
    ['blue dress', 'Temu', 'Light blue slip dress', 13.80, 3.50, 'https://temu.com/example-blue-dress', null],

    ['black dress', 'Shein', 'Black bodycon mini dress', 14.99, 4.99, 'https://shein.com/example-black-dress', null],
    ['black dress', 'Amazon', 'Classic black midi dress', 32.00, 0, 'https://amazon.com/example-black-dress', null],
    ['black dress', 'Zalando', 'Black tailored dress', 49.99, 0, 'https://zalando.com/example-black-dress', null],
    ['black dress', 'Temu', 'Black ribbed slip dress', 11.20, 3.50, 'https://temu.com/example-black-dress', null],

    ['white sneakers', 'Amazon', 'Classic white leather sneakers', 45.00, 0, 'https://amazon.com/example-white-sneakers', null],
    ['white sneakers', 'Shein', 'White low-top sneakers', 22.99, 4.99, 'https://shein.com/example-white-sneakers', null],
    ['white sneakers', 'Zalando', 'White canvas sneakers', 39.95, 0, 'https://zalando.com/example-white-sneakers', null],
    ['white sneakers', 'Temu', 'White platform sneakers', 18.40, 3.50, 'https://temu.com/example-white-sneakers', null],

    ['denim jacket', 'Amazon', 'Classic blue denim jacket', 38.00, 0, 'https://amazon.com/example-denim-jacket', null],
    ['denim jacket', 'Shein', 'Oversized denim jacket', 24.99, 4.99, 'https://shein.com/example-denim-jacket', null],
    ['denim jacket', 'Zalando', 'Cropped denim jacket', 54.95, 0, 'https://zalando.com/example-denim-jacket', null],
    ['denim jacket', 'Temu', 'Light wash denim jacket', 19.99, 3.50, 'https://temu.com/example-denim-jacket', null],

    ['black hoodie', 'Amazon', 'Plain black pullover hoodie', 25.99, 0, 'https://amazon.com/example-black-hoodie', null],
    ['black hoodie', 'Shein', 'Oversized black hoodie', 15.50, 4.99, 'https://shein.com/example-black-hoodie', null],
    ['black hoodie', 'Zalando', 'Cotton fleece hoodie', 34.95, 0, 'https://zalando.com/example-black-hoodie', null],
    ['black hoodie', 'Temu', 'Fleece-lined black hoodie', 12.90, 3.50, 'https://temu.com/example-black-hoodie', null],

    ['calvin klein', 'Calvin Klein', 'CK logo cotton t-shirt', 39.90, 5.95, 'https://calvinklein.com/example', null],
    ['calvin klein', 'Amazon', 'Calvin Klein logo tee (same SKU)', 32.99, 0, 'https://amazon.com/example', null],
    ['calvin klein', 'Zalando', 'Calvin Klein cotton t-shirt', 35.00, 0, 'https://zalando.com/example', null]
  ];
  for (const p of seedProducts) insertProduct.run(...p);
}

export default db;
