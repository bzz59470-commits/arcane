/**
 * FunPay "League of Legends → Accounts" listing (https://funpay.com/en/lots/85/)
 * parsing + filtering. Pure functions, no DOM: usable in Node (proxy) and in
 * the browser (tests / fallbacks).
 *
 * FunPay tags each offer with Russian filter values in data-attributes, even on
 * the English site. We map those to stable English identifiers here.
 */

export const FUNPAY_LOT_URL = "https://funpay.com/en/lots/85/";

export const DEFAULT_MAX_PRICE_USD = 15;
export const DEFAULT_RANKS = ["platinum", "emerald"];

const RANKS = {
  "нет ранга": "unranked",
  железо: "iron",
  бронза: "bronze",
  серебро: "silver",
  золото: "gold",
  платина: "platinum",
  изумруд: "emerald",
  алмаз: "diamond",
  "%мастер-master": "master",
  грандмастер: "grandmaster",
  "%претендент-challenger": "challenger",
};

const TYPES = {
  продажа: "sale",
  аренда: "rent",
};

export const SERVERS = {
  404: "North America",
  405: "EU West",
  406: "EU Nordic & East",
  407: "Latin America North",
  408: "Latin America South",
  410: "Turkey",
  411: "Russia",
  413: "Japan",
  9394: "Other server",
};

const ENTITIES = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#039;": "'",
  "&#39;": "'",
  "&nbsp;": " ",
};

export function decodeEntities(text) {
  return String(text ?? "")
    .replace(/&(amp|lt|gt|quot|nbsp|#0?39);/g, (m) => ENTITIES[m] ?? m)
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/\s+/g, " ")
    .trim();
}

function attrMap(fragment) {
  const map = {};
  for (const [, key, value] of fragment.matchAll(/data-([\w-]+)="([^"]*)"/g)) {
    map[key] = decodeEntities(value);
  }
  return map;
}

function pick(regex, text, index = 1) {
  const match = regex.exec(text);
  return match ? match[index] : undefined;
}

function toInt(value) {
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : null;
}

/**
 * Parse one `<a class="tc-item">…</a>` block into a normalized offer.
 * Returns null when the block is missing essential fields (id, price).
 */
export function parseOffer(href, block) {
  const idMatch = /offer\?id=(\d+)/.exec(href);
  if (!idMatch) return null;
  const head = block.slice(0, block.indexOf(">"));
  const attrs = attrMap(head);

  const price = Number.parseFloat(pick(/class="tc-price"[^>]*data-s="([^"]+)"/, block));
  if (!Number.isFinite(price)) return null;

  const currency = decodeEntities(
    pick(/class="tc-price"[\s\S]*?<span class="unit">([^<]*)<\/span>/, block) ?? "",
  );

  const serverId = toInt(attrs.server);
  const serverName =
    decodeEntities(pick(/class="tc-server[^"]*">([^<]*)</, block)) ||
    SERVERS[serverId] ||
    "Unknown";

  const rankKey = (attrs["f-rank"] ?? "").toLowerCase();
  const typeKey = (attrs["f-type"] ?? "").toLowerCase();

  const ratingClass = pick(/rating-stars rating-(\d)/, block);
  const reviews = toInt(pick(/rating-mini-count">(\d+)/, block));
  const sellerName = decodeEntities(pick(/media-user-name">\s*([\s\S]*?)<\/div>/, block));

  return {
    id: idMatch[1],
    url: `https://funpay.com/en/lots/offer?id=${idMatch[1]}`,
    server: serverName,
    serverId,
    type: TYPES[typeKey] ?? typeKey ?? "unknown",
    rank: RANKS[rankKey] ?? rankKey ?? "unknown",
    level: toInt(attrs["f-level"]),
    champions: toInt(attrs["f-hero"]),
    skins: toInt(attrs["f-skin"]),
    description: decodeEntities(pick(/tc-desc-text">([\s\S]*?)<\/div>/, block) ?? ""),
    price: Math.round(price * 100) / 100,
    currency: currency === "$" ? "USD" : currency === "€" ? "EUR" : currency || "USD",
    autoDelivery: attrs.auto === "1",
    seller: {
      name: sellerName || "Unknown seller",
      online: attrs.online === "1",
      rating: ratingClass ? Number(ratingClass) : null,
      reviews: reviews ?? 0,
      age: decodeEntities(pick(/media-user-info">([^<]*)</, block) ?? ""),
      avatar: pick(/avatar-photo[^>]*url\(([^)]+)\)/, block) ?? null,
      profileUrl: pick(/avatar-photo[^>]*data-href="([^"]+)"/, block) ?? null,
    },
  };
}

/**
 * Parse the full listing HTML. Lazily-hidden rows (`tc-item lazyload-hidden`)
 * are part of the markup, so a single request yields the whole catalogue.
 */
export function parseListing(html) {
  if (typeof html !== "string" || !html.includes("tc-item")) return [];
  const parts = html.split(/<a href="(https:\/\/funpay\.com\/[a-z]{2}\/lots\/offer\?id=\d+)" class="tc-item[^"]*"/);
  const offers = [];
  for (let i = 1; i < parts.length; i += 2) {
    const href = parts[i];
    const chunk = parts[i + 1] ?? "";
    const end = chunk.indexOf("</a>");
    const offer = parseOffer(href, end === -1 ? chunk : chunk.slice(0, end));
    if (offer) offers.push(offer);
  }
  return offers;
}

/**
 * Business filter: accounts for SALE (never rent), rank in `ranks`, price ≤ max.
 */
export function filterOffers(
  offers,
  { maxPrice = DEFAULT_MAX_PRICE_USD, ranks = DEFAULT_RANKS, servers = null } = {},
) {
  const rankSet = new Set(ranks.map((r) => r.toLowerCase()));
  const serverSet = servers && servers.length ? new Set(servers.map(Number)) : null;
  return offers
    .filter(
      (o) =>
        o.type === "sale" &&
        rankSet.has(o.rank) &&
        o.price <= maxPrice &&
        (!serverSet || serverSet.has(o.serverId)),
    )
    .sort((a, b) => a.price - b.price || b.seller.reviews - a.seller.reviews);
}

/** Sanitize query params coming from the browser. */
export function normalizeQuery(query = {}) {
  const max = Number.parseFloat(query.max);
  const maxPrice = Number.isFinite(max) ? Math.min(Math.max(max, 0.5), 500) : DEFAULT_MAX_PRICE_USD;
  const allowedRanks = new Set(Object.values(RANKS));
  const ranks = String(query.ranks ?? "")
    .split(",")
    .map((r) => r.trim().toLowerCase())
    .filter((r) => allowedRanks.has(r));
  const servers = String(query.servers ?? "")
    .split(",")
    .map((s) => Number.parseInt(s, 10))
    .filter((s) => Object.hasOwn(SERVERS, s));
  return { maxPrice, ranks: ranks.length ? ranks : DEFAULT_RANKS, servers };
}
