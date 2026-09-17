export const ACCOUNTS_KEY = "vault-index-accounts";
export const HISTORY_KEY = "vault-index-history";

export const seedAccounts = [
  {
    id: "AC-042",
    label: "Northstar",
    email: "northstar@vaultmail.co",
    password: "northstar-482",
    type: "Workspace",
    status: "Ready",
    value: "$24",
  },
  {
    id: "AC-041",
    label: "Paperstreet",
    email: "paperstreet@vaultmail.co",
    password: "paperstreet-701",
    type: "Creator",
    status: "Ready",
    value: "$18",
  },
  {
    id: "AC-040",
    label: "Velvetline",
    email: "velvetline@vaultmail.co",
    password: "velvetline-917",
    type: "Storefront",
    status: "Reserved",
    value: "$31",
  },
  {
    id: "AC-039",
    label: "Daybreak",
    email: "daybreak@vaultmail.co",
    password: "daybreak-552",
    type: "Workspace",
    status: "Ready",
    value: "$24",
  },
];

export const seedHistory = [
  {
    label: "Northstar",
    detail: "Marked available by operator",
    time: "Today, 09:42",
    tone: "green",
  },
  {
    label: "Paperstreet",
    detail: "Marked reserved by operator",
    time: "Today, 08:18",
    tone: "green",
  },
  {
    label: "Inventory synced",
    detail: "Local workspace updated",
    time: "Yesterday, 11:08",
    tone: "blue",
  },
];

export const CHAMPIONS = [
  { name: "Jinx", image: "/media/jinx-web-cutout.png" },
  { name: "Vi", image: "/media/vi-arcane.png" },
  { name: "Ekko", image: "/media/ekko-reference.jpg" },
  { name: "Jayce", image: "/media/jayce-reference.jpg" },
];

export function loadSession(key, fallback) {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

export function accountValue(account) {
  const n = Number.parseFloat(String(account.value ?? "").replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function accountStats(accounts) {
  const ready = accounts.filter((a) => a.status === "Ready").length;
  const value = accounts.reduce((sum, a) => sum + accountValue(a), 0);
  return { total: accounts.length, ready, value };
}

/** Max portraits per generation (row) before a new row is started. */
export const TREE_MAX_COLS = 3;

/**
 * Split `count` nodes into balanced generations of at most TREE_MAX_COLS,
 * e.g. 4 → [2, 2], 5 → [2, 3], 7 → [2, 2, 3]. Rows are ordered small → large
 * so the tree widens towards the bottom like a genealogy chart.
 */
export function treeRows(count) {
  if (count <= 0) return [];
  const rows = Math.ceil(count / TREE_MAX_COLS);
  const base = Math.floor(count / rows);
  const extra = count % rows;
  return Array.from({ length: rows }, (_, r) => base + (r >= rows - extra ? 1 : 0));
}

/**
 * Deterministic "family tree" layout (percentages of the canvas). Every node
 * sits at the centre of its generation cell so the whole composition stays
 * centred; each child links to the closest parent of the previous row with an
 * orthogonal connector.
 */
export function treeLayout(count) {
  const rows = treeRows(count);
  const nodes = [];
  const links = [];
  const maxCols = rows.length ? Math.max(...rows) : 1;
  const colStep = 100 / (maxCols + 0.35);
  let index = 0;
  let previousRow = [];
  rows.forEach((cols, r) => {
    const y = ((r + 0.5) / rows.length) * 100;
    const currentRow = [];
    for (let c = 0; c < cols; c += 1) {
      const x = 50 + (c - (cols - 1) / 2) * colStep;
      nodes.push({ x, y, row: r, col: c });
      currentRow.push(index);
      if (previousRow.length) {
        const ratio = cols === 1 ? 0.5 : c / (cols - 1);
        const parent = previousRow[Math.round(ratio * (previousRow.length - 1))];
        links.push([parent, index]);
      }
      index += 1;
    }
    previousRow = currentRow;
  });
  return { nodes, links, rows: rows.length, cols: maxCols };
}

/**
 * Orthogonal connector (Dark-style elbow) between two slots. `clearance` is the
 * vertical distance (canvas %) kept free around each node centre so the line
 * leaves the parent under its details and enters the child above its portrait.
 */
export function elbowPath(a, b, clearance = 0) {
  const dir = b.y >= a.y ? 1 : -1;
  const startY = a.y + dir * clearance;
  const endY = b.y - dir * clearance;
  const midY = (startY + endY) / 2;
  return `M ${a.x} ${startY} V ${midY} H ${b.x} V ${endY}`;
}
