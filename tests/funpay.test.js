import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { filterOffers, normalizeQuery, parseListing } from "../src/lib/funpay.js";

const here = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(here, "fixtures/funpay-sample.html"), "utf8");

test("parses every tc-item row, including lazyload-hidden ones", () => {
  const offers = parseListing(html);
  assert.equal(offers.length, 4);
  const [emerald, unranked, platinum, rentedPlatinum] = offers;
  assert.equal(emerald.rank, "emerald");
  assert.equal(emerald.type, "sale");
  assert.equal(emerald.server, "Russia");
  assert.equal(emerald.price, 24.58);
  assert.equal(emerald.currency, "USD");
  assert.equal(emerald.level, 68);
  assert.equal(emerald.champions, 144);
  assert.equal(emerald.skins, 48);
  assert.equal(emerald.autoDelivery, true);
  assert.equal(emerald.seller.name, "Vladik11113");
  assert.equal(emerald.seller.rating, 5);
  assert.equal(emerald.seller.reviews, 23);
  assert.match(emerald.url, /^https:\/\/funpay\.com\/en\/lots\/offer\?id=\d+$/);

  assert.equal(unranked.rank, "unranked");
  assert.equal(platinum.rank, "platinum");
  assert.equal(platinum.server, "EU West");
  assert.equal(rentedPlatinum.type, "rent");
});

test("filter keeps only SALE offers of the requested ranks under the price cap", () => {
  const offers = parseListing(html);
  assert.equal(filterOffers(offers, { maxPrice: 15 }).length, 0);
  const under30 = filterOffers(offers, { maxPrice: 30 });
  assert.deepEqual(
    under30.map((o) => [o.rank, o.type]),
    [["emerald", "sale"]],
  );
  const wide = filterOffers(offers, { maxPrice: 100, ranks: ["platinum"] });
  assert.equal(wide.length, 1);
  assert.equal(wide[0].type, "sale", "rent offers must never pass");
});

test("normalizeQuery sanitizes user input", () => {
  assert.deepEqual(normalizeQuery({}), { maxPrice: 15, ranks: ["platinum", "emerald"], servers: [] });
  assert.deepEqual(normalizeQuery({ max: "abc", ranks: "gold,bogus", servers: "405,1" }), {
    maxPrice: 15,
    ranks: ["gold"],
    servers: [405],
  });
  assert.equal(normalizeQuery({ max: "99999" }).maxPrice, 500);
});

test("parseListing tolerates garbage input", () => {
  assert.deepEqual(parseListing(""), []);
  assert.deepEqual(parseListing(null), []);
  assert.deepEqual(parseListing("<html>nothing here</html>"), []);
});
