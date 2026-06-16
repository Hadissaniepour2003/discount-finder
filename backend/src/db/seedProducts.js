// Curated seed product data: [query_tag, retailer, title, price, shipping, url, image_url]
// query_tag format is "<color> <item>" so the matcher can score color + item words independently.

const RETAILERS = ['Shein', 'Amazon', 'Zalando', 'Temu'];

// Base price ranges and shipping per retailer, used to generate realistic-looking
// curated prices for each item/color combination below.
const RETAILER_PROFILE = {
  Shein: { mult: 0.75, shipping: 4.99 },
  Amazon: { mult: 1.05, shipping: 0 },
  Zalando: { mult: 1.4, shipping: 0 },
  Temu: { mult: 0.55, shipping: 3.5 }
};

// Items with a base price and a noun used in titles
const ITEMS = [
  { item: 'dress', base: 28, noun: 'dress', styles: ['wrap midi dress', 'A-line dress', 'maxi dress', 'slip dress', 'bodycon mini dress'] },
  { item: 'hoodie', base: 24, noun: 'hoodie', styles: ['pullover hoodie', 'oversized hoodie', 'zip-up hoodie', 'cropped hoodie'] },
  { item: 'jacket', base: 40, noun: 'jacket', styles: ['denim jacket', 'bomber jacket', 'puffer jacket', 'blazer'] },
  { item: 'sneakers', base: 35, noun: 'sneakers', styles: ['low-top sneakers', 'platform sneakers', 'canvas sneakers', 'running sneakers'] },
  { item: 'jeans', base: 32, noun: 'jeans', styles: ['skinny jeans', 'straight-leg jeans', 'mom jeans', 'wide-leg jeans'] },
  { item: 'skirt', base: 22, noun: 'skirt', styles: ['pleated skirt', 'mini skirt', 'midi skirt', 'denim skirt'] },
  { item: 'shirt', base: 20, noun: 'shirt', styles: ['button-up shirt', 'oversized shirt', 'linen shirt', 'flannel shirt'] },
  { item: 'sweater', base: 26, noun: 'sweater', styles: ['knit sweater', 'turtleneck sweater', 'cardigan', 'crewneck sweater'] },
  { item: 'shorts', base: 18, noun: 'shorts', styles: ['denim shorts', 'bike shorts', 'cargo shorts', 'linen shorts'] },
  { item: 'coat', base: 55, noun: 'coat', styles: ['wool coat', 'trench coat', 'long coat', 'teddy coat'] }
];

const COLORS = ['pink', 'blue', 'black', 'white', 'red', 'green', 'beige', 'yellow', 'purple', 'grey'];

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function buildSeedProducts() {
  const products = [];

  for (const { item, base, styles } of ITEMS) {
    for (const color of COLORS) {
      const tag = `${color} ${item}`;
      // pick a deterministic-ish subset of styles/retailers so not every
      // combination has all 4 retailers (more realistic variation),
      // but every tag has at least 3 listings.
      const seedNum = (color.length * 7 + item.length * 13) % styles.length;

      RETAILERS.forEach((retailer, i) => {
        // skip one retailer per combo in a rotating pattern to vary result counts
        if ((seedNum + i) % 5 === 0 && RETAILERS.length > 3) return;

        const profile = RETAILER_PROFILE[retailer];
        const style = styles[(seedNum + i) % styles.length];
        const title = `${color.charAt(0).toUpperCase() + color.slice(1)} ${style}`;

        // deterministic-ish price variation per combo so numbers feel distinct
        const variance = ((color.length + item.length + i) % 7) - 3; // -3..3
        const price = Math.max(5, Math.round((base + variance * 2) * profile.mult * 100) / 100);

        products.push([
          tag,
          retailer,
          title,
          price,
          profile.shipping,
          `https://${retailer.toLowerCase().replace(/\s/g, '')}.com/example-${slug(tag)}-${slug(style)}`,
          null
        ]);
      });
    }
  }

  return products;
}

export const SEED_PRODUCTS = buildSeedProducts();
export { COLORS, ITEMS, RETAILERS, RETAILER_PROFILE, slug };

// --- Dynamic fallback generator ---
// Covers extra colors and items beyond the curated seed, so a wider range of
// "<color> <item>" searches return plausible (deterministic, fake) results
// without needing to pre-generate and store every combination.

export const EXTRA_COLORS = ['orange', 'brown', 'navy', 'cream', 'olive', 'maroon', 'turquoise', 'lavender'];
export const EXTRA_ITEMS = [
  { item: 'scarf', base: 14, styles: ['knit scarf', 'silk scarf', 'plaid scarf'] },
  { item: 'cap', base: 12, styles: ['baseball cap', 'bucket hat', 'beanie'] },
  { item: 'bag', base: 30, styles: ['tote bag', 'crossbody bag', 'backpack'] },
  { item: 'blouse', base: 22, styles: ['silk blouse', 'ruffle blouse', 'sleeveless blouse'] },
  { item: 'boots', base: 48, styles: ['ankle boots', 'chelsea boots', 'combat boots'] },
  { item: 'leggings', base: 16, styles: ['high-waist leggings', 'fleece leggings', 'cropped leggings'] }
];

const ALL_COLORS = [...COLORS, ...EXTRA_COLORS];
const ALL_ITEM_DEFS = [...ITEMS, ...EXTRA_ITEMS];

// Simple deterministic hash so the same query always generates the same "fake" prices
function hashString(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h * 31 + s.charCodeAt(i)) % 100000;
  }
  return h;
}

// Generates fake-but-deterministic listings for any recognized color + item
// combination that isn't already in the curated seed (e.g. extra colors/items,
// or curated items paired with extra colors and vice versa).
export function generateDynamicProducts(color, itemDef) {
  const tag = `${color} ${itemDef.item}`;
  const hash = hashString(tag);
  const styles = itemDef.styles;

  const products = [];
  RETAILERS.forEach((retailer, i) => {
    // Skip one retailer in a deterministic pattern, same idea as curated seed
    if ((hash + i) % 5 === 0) return;

    const profile = RETAILER_PROFILE[retailer];
    const style = styles[(hash + i) % styles.length];
    const title = `${color.charAt(0).toUpperCase() + color.slice(1)} ${style}`;
    const variance = ((hash + i * 3) % 7) - 3; // -3..3
    const price = Math.max(5, Math.round((itemDef.base + variance * 2) * profile.mult * 100) / 100);

    products.push({
      query_tag: tag,
      retailer,
      title,
      price,
      shipping: profile.shipping,
      url: `https://${retailer.toLowerCase().replace(/\s/g, '')}.com/example-${slug(tag)}-${slug(style)}`,
      image_url: null
    });
  });

  return products;
}

// Finds a color and item definition matching words in the query, from the
// full known lists (curated + extra), for use by the dynamic fallback.
export function matchColorAndItem(query) {
  const qWords = query.toLowerCase().split(/\s+/).filter(Boolean);

  const color = ALL_COLORS.find(c => qWords.includes(c));
  const itemDef = ALL_ITEM_DEFS.find(d => qWords.includes(d.item));

  if (color && itemDef) return { color, itemDef };
  return null;
}
