/**
 * Server-side fetch of the FunPay LoL accounts listing.
 *
 * FunPay has no public API and blocks browser cross-origin requests, so the
 * page is fetched from the server, parsed with `src/lib/funpay.js`, cached
 * briefly and exposed as JSON. Used by the Vite dev/preview middleware
 * (`vite.config.js`) and by the serverless entry (`api/funpay.js`).
 */
import {
  FUNPAY_LOT_URL,
  filterOffers,
  normalizeQuery,
  parseListing,
} from "../src/lib/funpay.js";

const CACHE_TTL_MS = 45_000;
const FETCH_TIMEOUT_MS = 12_000;

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

let cache = { at: 0, offers: null, promise: null };

async function fetchListing() {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(FUNPAY_LOT_URL, {
      signal: controller.signal,
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
        "accept-language": "en-US,en;q=0.9",
        // FunPay stores the display currency in the `cy` cookie.
        cookie: "cy=usd",
      },
    });
    if (!response.ok) {
      throw new Error(`FunPay responded with HTTP ${response.status}`);
    }
    const html = await response.text();
    const offers = parseListing(html);
    if (!offers.length) {
      throw new Error("FunPay listing parsed to zero offers (markup change?)");
    }
    return offers;
  } finally {
    clearTimeout(timer);
  }
}

async function getOffers() {
  const fresh = cache.offers && Date.now() - cache.at < CACHE_TTL_MS;
  if (fresh) return { offers: cache.offers, fetchedAt: cache.at, stale: false };
  if (!cache.promise) {
    cache.promise = fetchListing()
      .then((offers) => {
        cache = { at: Date.now(), offers, promise: null };
        return offers;
      })
      .catch((error) => {
        cache.promise = null;
        throw error;
      });
  }
  try {
    const offers = await cache.promise;
    return { offers, fetchedAt: cache.at, stale: false };
  } catch (error) {
    // Serve the last good snapshot if we have one, flagged as stale.
    if (cache.offers) {
      return { offers: cache.offers, fetchedAt: cache.at, stale: true, error };
    }
    throw error;
  }
}

/**
 * @param {Record<string, string | undefined>} query
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function buildFeedResponse(query) {
  const filters = normalizeQuery(query);
  try {
    const { offers, fetchedAt, stale, error } = await getOffers();
    const matches = filterOffers(offers, filters);
    return {
      status: 200,
      body: {
        ok: true,
        source: FUNPAY_LOT_URL,
        fetchedAt: new Date(fetchedAt).toISOString(),
        stale,
        warning: stale ? `Serving cached data: ${error?.message ?? "refresh failed"}` : undefined,
        filters,
        total: offers.length,
        count: matches.length,
        offers: matches,
      },
    };
  } catch (error) {
    return {
      status: 502,
      body: {
        ok: false,
        source: FUNPAY_LOT_URL,
        filters,
        error: error?.name === "AbortError" ? "FunPay request timed out" : String(error?.message ?? error),
      },
    };
  }
}

/** Node `http` style handler (Vite middleware / Node servers). */
export async function handleFeedRequest(req, res) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const query = Object.fromEntries(url.searchParams.entries());
  const { status, body } = await buildFeedResponse(query);
  res.statusCode = status;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.setHeader("cache-control", "no-store");
  res.end(JSON.stringify(body));
}
