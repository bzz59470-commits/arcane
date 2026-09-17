import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { CHAMPIONS } from "../src/lib/accounts.js";
import { TRACKS } from "../src/lib/tracks.js";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root));
const manifest = JSON.parse(read("public/media/characters/manifest.json"));

function webpDimensions(bytes) {
  assert.equal(bytes.toString("ascii", 0, 4), "RIFF");
  assert.equal(bytes.toString("ascii", 8, 12), "WEBP");
  const type = bytes.toString("ascii", 12, 16);
  if (type === "VP8 ") {
    assert.equal(bytes.toString("hex", 23, 26), "9d012a");
    return [bytes.readUInt16LE(26) & 0x3fff, bytes.readUInt16LE(28) & 0x3fff];
  }
  if (type === "VP8X") return [1 + bytes.readUIntLE(24, 3), 1 + bytes.readUIntLE(27, 3)];
  throw new Error(`Unexpected WebP encoding: ${type}`);
}

test("catalogue includes ten distinct Arcane characters and preserves the original four assignments", () => {
  assert.equal(CHAMPIONS.length, 10);
  assert.equal(new Set(CHAMPIONS.map((item) => item.id)).size, 10);
  assert.deepEqual(CHAMPIONS.slice(0, 4).map((item) => item.name), ["Jinx", "Vi", "Ekko", "Jayce"]);
  for (const name of ["Caitlyn", "Viktor", "Mel", "Heimerdinger", "Warwick", "Singed"]) {
    assert.ok(CHAMPIONS.some((item) => item.name === name));
  }
  assert.equal(TRACKS[0].cover, CHAMPIONS[0].thumbnail);
});

test("all forty local variants decode as WebP with expected sizes and sensible payload budgets", () => {
  let total = 0;
  for (const item of CHAMPIONS) {
    const variants = [
      [`/media/characters/${item.id}-240.webp`, [240, 320], 50000],
      [item.image, [480, 640], 130000],
      [item.thumbnail, [160, 160], 20000],
      [item.wide, [1215, 717], 260000],
    ];
    for (const [path, dimensions, budget] of variants) {
      assert.match(path, /^\/media\/characters\/[a-z]+-(240|480|thumb|wide)\.webp$/);
      const bytes = read(`public${path}`);
      assert.deepEqual(webpDimensions(bytes), dimensions, path);
      assert.ok(bytes.length <= budget, `${path} exceeds ${budget} bytes`);
      total += bytes.length;
    }
    assert.equal(item.srcSet, `/media/characters/${item.id}-240.webp 240w, ${item.image} 480w`);
  }
  assert.ok(total < 2500000, `Collection exceeds 2.5 MB: ${total}`);
});

test("every runtime artwork has an official source, source checksum, and in-bounds crop", () => {
  assert.equal(manifest.length, CHAMPIONS.length);
  for (const item of CHAMPIONS) {
    const record = manifest.find((entry) => entry.id === item.id);
    assert.ok(record);
    for (const field of ["name", "image", "thumbnail", "wide", "srcSet", "artwork"]) {
      assert.equal(record[field], item[field]);
    }
    assert.equal(new URL(record.source).hostname, "ddragon.leagueoflegends.com");
    assert.match(record.sourceSha256, /^[a-f0-9]{64}$/);
    const [left, top, right, bottom] = record.crop;
    assert.ok(left >= 0 && top >= 0 && right <= record.sourceWidth && bottom <= record.sourceHeight);
    assert.equal((right - left) * 4, (bottom - top) * 3);
  }
});

test("no application code references the removed character files", () => {
  function inspect(directory) {
    for (const file of readdirSync(new URL(directory, root))) {
      const path = `${directory}/${file}`;
      if (statSync(new URL(path, root)).isDirectory()) inspect(path);
      else if (/\.(jsx?|css)$/.test(file)) {
        assert.doesNotMatch(read(path).toString(), /jinx-web|vi-arcane\.png|ekko-reference\.jpg|jayce-reference\.jpg/, path);
      }
    }
  }
  inspect("src");
});
