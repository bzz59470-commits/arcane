import { test } from "node:test";
import assert from "node:assert/strict";
import { elbowPath, treeLayout, treeRows, TREE_MAX_COLS } from "../src/lib/accounts.js";

test("treeRows balances generations and never exceeds the column cap", () => {
  assert.deepEqual(treeRows(0), []);
  assert.deepEqual(treeRows(1), [1]);
  assert.deepEqual(treeRows(4), [2, 2]);
  assert.deepEqual(treeRows(5), [2, 3]);
  assert.deepEqual(treeRows(7), [2, 2, 3]);
  for (let n = 1; n <= 30; n += 1) {
    const rows = treeRows(n);
    assert.equal(rows.reduce((a, b) => a + b, 0), n);
    assert.ok(rows.every((c) => c >= 1 && c <= TREE_MAX_COLS));
  }
});

test("treeLayout keeps every node inside the canvas, centred, without overlaps", () => {
  for (let n = 1; n <= 12; n += 1) {
    const { nodes, links } = treeLayout(n);
    assert.equal(nodes.length, n);
    assert.equal(links.length, Math.max(0, n - treeRows(n)[0]));
    const seen = new Set();
    nodes.forEach((p) => {
      assert.ok(p.x > 0 && p.x < 100 && p.y > 0 && p.y < 100);
      const key = `${p.x.toFixed(3)}:${p.y.toFixed(3)}`;
      assert.ok(!seen.has(key), `duplicate slot for ${n} nodes`);
      seen.add(key);
    });
    const mean = nodes.reduce((s, p) => s + p.x, 0) / n;
    assert.ok(Math.abs(mean - 50) < 1e-9, `row centre drifted for ${n}`);
    links.forEach(([a, b]) => assert.ok(nodes[a].row === nodes[b].row - 1));
  }
});

test("elbowPath leaves clearance around both ends", () => {
  assert.equal(elbowPath({ x: 50, y: 20 }, { x: 30, y: 60 }, 5), "M 50 25 V 40 H 30 V 55");
  assert.equal(elbowPath({ x: 50, y: 20 }, { x: 50, y: 60 }), "M 50 20 V 40 H 50 V 60");
});
