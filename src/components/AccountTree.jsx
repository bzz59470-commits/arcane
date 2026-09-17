import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { CHAMPIONS, elbowPath, treeLayout } from "../lib/accounts.js";

const NODE_MIN = 156;
const NODE_MAX = 240;
const PORTRAIT_RATIO = 4 / 3;
/* Details block (champion, label, login, secret, meta) measured height. */
const DETAILS_PX = 138;
const ROW_GAP_PX = 30;
const COL_GAP_PX = 36;

/**
 * Node width (px) so that `cols` nodes fit side by side and `rows` nodes fit
 * vertically in a `width`×`height` canvas. Returns the canvas height actually
 * required — larger than `height` when the viewport is too short, in which
 * case the stage scrolls instead of letting rows overlap.
 */
export function fitNodes({ width, height, rows, cols }) {
  if (!width || !height || !rows || !cols) {
    return { nodeWidth: NODE_MIN, canvasHeight: height || 0 };
  }
  const byCols = (width - COL_GAP_PX * (cols + 1)) / cols;
  const rowHeight = height / rows;
  const byRows = (rowHeight - DETAILS_PX - ROW_GAP_PX) / PORTRAIT_RATIO;
  const nodeWidth = Math.round(Math.max(NODE_MIN, Math.min(NODE_MAX, byCols, byRows)));
  const needed = rows * (nodeWidth * PORTRAIT_RATIO + DETAILS_PX + ROW_GAP_PX);
  return { nodeWidth, canvasHeight: Math.max(height, Math.ceil(needed)) };
}

/** Clipboard write with a legacy fallback for contexts without the async API. */
async function writeClipboard(text) {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      /* fall through to the legacy path */
    }
  }
  try {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    document.body.removeChild(area);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Centre-stage "family tree" (Netflix DARK reference): only the collage
 * portraits, orthogonal connectors and each account's credentials — no page
 * chrome. The canvas follows the pointer with a soft parallax and nodes scale
 * with the viewport so the tree always fills the stage.
 */
export function AccountTree({ accounts, selectedId, onSelect }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(null);
  const [box, setBox] = useState({ width: 0, height: 0 });
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const { nodes, links, rows, cols } = treeLayout(accounts.length);
  const { nodeWidth, canvasHeight } = fitNodes({ ...box, rows, cols });
  /* Half a row minus a little air, so connectors never cross the cards. */
  const linkClearance = (50 / Math.max(1, rows)) * 0.86;

  /* Measure the available canvas so node sizes are exact, not vw/vh guesses. */
  useLayoutEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof ResizeObserver === "undefined") return undefined;
    const measure = () => {
      const stage = stageRef.current;
      if (!stage) return;
      const style = window.getComputedStyle(canvas);
      const padY = parseFloat(style.top) + parseFloat(style.bottom);
      setBox({
        width: canvas.clientWidth,
        height: Math.max(0, stage.clientHeight - (Number.isFinite(padY) ? padY : 0)),
      });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(stageRef.current);
    return () => observer.disconnect();
  }, [accounts.length]);

  useEffect(() => {
    if (!copied) return undefined;
    const t = window.setTimeout(() => setCopied(null), 1400);
    return () => window.clearTimeout(t);
  }, [copied]);

  const copyAccount = async (event, account) => {
    event.stopPropagation();
    const ok = await writeClipboard(`${account.email}\n${account.password}`);
    setCopied(ok ? account.id : `failed:${account.id}`);
  };

  const onPointerMove = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setPan({
      x: ((event.clientX - rect.left) / rect.width - 0.5) * -48,
      y: ((event.clientY - rect.top) / rect.height - 0.5) * -34,
    });
  };

  if (!accounts.length) {
    return (
      <div className="tree-stage tree-stage--empty" ref={stageRef}>
        <p>No accounts yet — add one with “+”.</p>
      </div>
    );
  }

  return (
    <div
      className="tree-stage"
      ref={stageRef}
      onPointerMove={onPointerMove}
      onPointerLeave={() => setPan({ x: 0, y: 0 })}
      style={{
        "--pan-x": `${pan.x}px`,
        "--pan-y": `${pan.y}px`,
        "--node-w": `${nodeWidth}px`,
        "--canvas-h": box.height && canvasHeight > box.height ? `${canvasHeight}px` : "auto",
      }}
    >
      <div className="tree-stage__canvas" ref={canvasRef}>
        <svg className="tree-stage__links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {links.map(([a, b]) => (
            <path key={`${a}-${b}`} d={elbowPath(nodes[a], nodes[b], linkClearance)} />
          ))}
        </svg>
        {accounts.map((account, index) => {
          const champion = CHAMPIONS.find((item) => item.id === account.championId) || CHAMPIONS[index % CHAMPIONS.length];
          const slot = nodes[index];
          const isSelected = account.id === selectedId;
          return (
            <article
              className={`tree-node${isSelected ? " is-selected" : ""}${copied === account.id ? " is-copied" : ""}${copied === `failed:${account.id}` ? " is-copy-failed" : ""}`}
              key={account.id}
              style={{ "--x": `${slot.x}%`, "--y": `${slot.y}%`, "--d": `${index * 90}ms` }}
              onClick={() => onSelect(account)}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(account);
                }
              }}
              aria-label={`${account.label}, ${account.email}`}
            >
              <div className="tree-node__portrait">
                <img
                  src={champion.image}
                  srcSet={champion.srcSet}
                  sizes={`(max-width: 760px) calc((100vw - 42px) / 2), ${nodeWidth}px`}
                  width={480}
                  height={640}
                  alt={champion.artwork}
                  loading="lazy"
                  decoding="async"
                />
                <i className={`tree-node__status tree-node__status--${account.status.toLowerCase()}`} />
              </div>
              <div className="tree-node__details">
                <span className="tree-node__champion">{champion.name}</span>
                <h3>{account.label}</h3>
                <p className="tree-node__login">{account.email}</p>
                <button
                  className="tree-node__secret"
                  type="button"
                  onClick={(event) => copyAccount(event, account)}
                  title="Copy login and password"
                >
                  <code>{account.password}</code>
                  <small>
                    {copied === account.id
                      ? "COPIED"
                      : copied === `failed:${account.id}`
                        ? "COPY BLOCKED"
                        : "CLICK TO COPY"}
                  </small>
                </button>
                <span className="tree-node__meta">
                  {account.type} · {account.id} · {account.value}
                </span>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
