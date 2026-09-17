import { useMemo, useState } from "react";
import { useFunpayFeed } from "../hooks/useFunpayFeed.js";
import { DEFAULT_MAX_PRICE_USD, FUNPAY_LOT_URL, SERVERS } from "../lib/funpay.js";

const RANK_OPTIONS = [
  { id: "platinum", label: "Platinum" },
  { id: "emerald", label: "Emerald" },
];

function ago(timestamp) {
  if (!timestamp) return "—";
  const s = Math.max(0, Math.round((Date.now() - timestamp) / 1000));
  if (s < 5) return "just now";
  if (s < 60) return `${s}s ago`;
  return `${Math.floor(s / 60)}m ago`;
}

function Stars({ rating, reviews }) {
  if (!rating) return <small className="fp-seller__reviews">no reviews</small>;
  return (
    <small className="fp-seller__reviews" title={`${rating}/5`}>
      {"★".repeat(rating)}
      {"☆".repeat(5 - rating)} {reviews}
    </small>
  );
}

function Offer({ offer, index }) {
  return (
    <a
      className={`fp-offer fp-offer--${offer.rank}`}
      href={offer.url}
      target="_blank"
      rel="noopener noreferrer nofollow"
      style={{ "--d": `${Math.min(index, 12) * 40}ms` }}
    >
      <div className="fp-offer__server">
        <b>{offer.server}</b>
        <span className={`fp-rank fp-rank--${offer.rank}`}>{offer.rank}</span>
      </div>
      <div className="fp-offer__body">
        <p>{offer.description}</p>
        <ul className="fp-offer__facts">
          {offer.level != null && <li>LVL {offer.level}</li>}
          {offer.champions != null && <li>{offer.champions} champs</li>}
          {offer.skins != null && <li>{offer.skins} skins</li>}
          {offer.autoDelivery && <li className="fp-auto">⚡ auto delivery</li>}
        </ul>
      </div>
      <div className="fp-seller">
        {offer.seller.avatar ? (
          <img src={offer.seller.avatar} alt="" loading="lazy" referrerPolicy="no-referrer" />
        ) : (
          <i className="fp-seller__avatar-fallback" />
        )}
        <div>
          <b>
            {offer.seller.name}
            <i className={`fp-dot${offer.seller.online ? " is-online" : ""}`} />
          </b>
          <Stars rating={offer.seller.rating} reviews={offer.seller.reviews} />
          <small>{offer.seller.age}</small>
        </div>
      </div>
      <div className="fp-offer__price">
        <b>
          {offer.price.toFixed(2)} <span>{offer.currency === "USD" ? "$" : offer.currency}</span>
        </b>
        <small>BUY ↗</small>
      </div>
    </a>
  );
}

/**
 * Live FunPay feed: LoL accounts for SALE, Platinum/Emerald, ≤ $15 by default.
 * Data only — the visual language stays the vault's own.
 */
export function BuyingFeed() {
  const [maxPrice, setMaxPrice] = useState(DEFAULT_MAX_PRICE_USD);
  const [ranks, setRanks] = useState(RANK_OPTIONS.map((r) => r.id));
  const [server, setServer] = useState("");
  const [priceDraft, setPriceDraft] = useState(String(DEFAULT_MAX_PRICE_USD));

  const feed = useFunpayFeed({
    maxPrice,
    ranks: ranks.length ? ranks : RANK_OPTIONS.map((r) => r.id),
    servers: server ? [Number(server)] : [],
  });

  const offers = feed.data?.offers ?? [];
  const grouped = useMemo(() => {
    const map = new Map();
    for (const offer of offers) {
      if (!map.has(offer.rank)) map.set(offer.rank, []);
      map.get(offer.rank).push(offer);
    }
    return map;
  }, [offers]);

  const commitPrice = () => {
    const n = Number.parseFloat(priceDraft);
    const next = Number.isFinite(n) ? Math.min(500, Math.max(0.5, n)) : DEFAULT_MAX_PRICE_USD;
    setPriceDraft(String(next));
    setMaxPrice(next);
  };

  const toggleRank = (id) =>
    setRanks((current) => (current.includes(id) ? current.filter((r) => r !== id) : [...current, id]));

  return (
    <section className="fp-feed" aria-live="polite">
      <header className="fp-feed__bar">
        <div className="fp-feed__status">
          <i className={`fp-live${feed.loading ? " is-loading" : ""}${feed.error ? " is-error" : ""}`} />
          <span>
            {feed.error
              ? "FEED OFFLINE"
              : feed.data?.stale
                ? "CACHED"
                : feed.loading && !feed.data
                  ? "SYNCING"
                  : "LIVE"}
          </span>
          <small>
            {feed.data ? (
              <>
                {feed.data.count} / {feed.data.total} offers · updated {ago(feed.updatedAt)}
              </>
            ) : (
              "FunPay · League of Legends accounts"
            )}
          </small>
        </div>
        <div className="fp-feed__filters">
          {RANK_OPTIONS.map((rank) => (
            <button
              key={rank.id}
              type="button"
              className={`fp-chip fp-chip--${rank.id}${ranks.includes(rank.id) ? " is-on" : ""}`}
              onClick={() => toggleRank(rank.id)}
              aria-pressed={ranks.includes(rank.id)}
            >
              {rank.label}
            </button>
          ))}
          <label className="fp-field">
            MAX $
            <input
              type="number"
              min="0.5"
              max="500"
              step="0.5"
              inputMode="decimal"
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              onBlur={commitPrice}
              onKeyDown={(e) => e.key === "Enter" && commitPrice()}
            />
          </label>
          <label className="fp-field">
            SERVER
            <select value={server} onChange={(e) => setServer(e.target.value)}>
              <option value="">All</option>
              {Object.entries(SERVERS).map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <button type="button" className="fp-refresh" onClick={feed.refresh} disabled={feed.loading}>
            ↻
          </button>
        </div>
      </header>

      {feed.error && !feed.data && (
        <div className="fp-empty">
          <p>Couldn’t reach FunPay.</p>
          <small>{feed.error}</small>
        </div>
      )}
      {feed.data && !offers.length && (
        <div className="fp-empty">
          <p>No {ranks.join(" / ")} accounts for sale ≤ ${maxPrice.toFixed(0)} right now.</p>
          <small>Auto-refreshing every 30 s. Raise the price cap to see more.</small>
        </div>
      )}
      {[...grouped.entries()].map(([rank, list]) => (
        <div className="fp-group" key={rank}>
          <h2 className={`fp-group__title fp-group__title--${rank}`}>
            {rank} <b>{list.length}</b>
          </h2>
          <div className="fp-list">
            {list.map((offer, index) => (
              <Offer key={offer.id} offer={offer} index={index} />
            ))}
          </div>
        </div>
      ))}
      <footer className="fp-feed__foot">
        <a href={FUNPAY_LOT_URL} target="_blank" rel="noopener noreferrer">
          Source: funpay.com/en/lots/85 · sale only · prices in USD
        </a>
      </footer>
    </section>
  );
}
