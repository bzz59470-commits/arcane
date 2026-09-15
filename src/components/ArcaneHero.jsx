import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import { animate, scrambleText } from "animejs";

const VIDEO_SRC = "/media/arcane-animation-00m08s5-to-00m22s-fullhd.mp4";
const DOODLES = {
  circle: "/media/doodles/Circle.mp4",
  explosion: "/media/doodles/Explosion.mp4",
  line: "/media/doodles/Jagged-Line.mp4",
  squiggle: "/media/doodles/Jumbled-Squiggles.mp4",
  bang: "/media/doodles/Exclamation-Mark.mp4",
};
const ACCOUNTS_KEY = "vault-index-accounts";
const HISTORY_KEY = "vault-index-history";
const seedAccounts = [
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
const seedHistory = [
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
function loadSession(key, fallback) {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}
function Brand({ onOpen }) {
  return (
    <button
      className="brand"
      type="button"
      onClick={onOpen}
      aria-label="Open Vault Index"
    >
      <img
        className="brand__riot-logo"
        src="/media/riot-games-logo.png"
        alt="Riot Games"
      />
      <span className="brand__arcane">A</span>
    </button>
  );
}
function DoodleVideo({ src, className = "" }) {
  return (
    <video
      className={`doodle-video ${className}`}
      src={src}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
      aria-hidden="true"
    />
  );
}

function Landing({ onOpenVault, soundOn, setSoundOn }) {
  const root = useRef(null);
  const titleRef = useRef(null);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    if (!titleRef.current) return;
    const animations = [...titleRef.current.querySelectorAll("span")].map(
      (letter, index) =>
        animate(letter, {
          innerHTML: scrambleText(),
          duration: 1400,
          delay: index * 130,
          loop: true,
          loopDelay: 1200,
          easing: "easeInOutQuad",
        }),
    );
    return () => animations.forEach((animation) => animation.pause());
  }, []);
  useLayoutEffect(() => {
    const context = gsap.context(() => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .fromTo(
          "[data-landing-nav]",
          { opacity: 0, y: -16 },
          { opacity: 1, y: 0, duration: 0.65, stagger: 0.08 },
        )
        .fromTo(
          "[data-hero-copy]",
          { opacity: 0, scale: 0.92, y: 24, filter: "blur(12px)" },
          { opacity: 1, scale: 1, y: 0, filter: "blur(0px)", duration: 1.15 },
          "-.25",
        )
        .fromTo(
          "[data-toast]",
          { opacity: 0, x: 90 },
          { opacity: 1, x: 0, duration: 0.8, ease: "back.out(1.35)" },
          "-.55",
        );
    }, root);
    return () => context.revert();
  }, []);
  return (
    <main className="landing" ref={root}>
      <div className="landing__media">
        <video
          src={VIDEO_SRC}
          muted={false}
          loop
          autoPlay
          playsInline
          preload="auto"
        />
      </div>
      <div className="landing__wash" />
      <header className="landing__header">
        <div className="landing__header-left" data-landing-nav>
          <Brand onOpen={onOpenVault} />
        </div>
        <nav className="landing__nav" aria-label="Main navigation">
          <div className="nav-season" data-landing-nav>
            SEASON
            <br />
            <span>02</span>
          </div>
          <button data-landing-nav>
            MONTH
            <br />
            <span>SEPT.</span> <b>09</b>
          </button>
          <button data-landing-nav>
            SALES
            <br />
            <span>READY</span> <b>04</b>
          </button>
          <button data-landing-nav>
            SALES
            <br />
            <span>VALUE</span> <b>24</b>
          </button>
        </nav>
        <div className="landing__controls">
          <button className="user-btn" aria-label="User" data-landing-nav>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>
      <section className="landing__hero">
        <div className="landing__copy" data-hero-copy>
          <h1 ref={titleRef} className="arcane-title" aria-label="ARCANE">
            <span>A</span>
            <span>R</span>
            <span>C</span>
            <span>A</span>
            <span>N</span>
            <span>E</span>
          </h1>
          <div className="hero-actions">
            <button className="btn-watch-now" onClick={onOpenVault}>
              WATCH NOW
            </button>
            <button className="btn-netflix" onClick={onOpenVault}>
              ONLY ON NETFLIX <span>↗</span>
            </button>
          </div>
        </div>
      </section>
      {!dismissed && (
        <aside className="playlist-toast" data-toast>
          <div className="playlist-label">ARCANE OFFICIAL PLAYLIST /</div>
          <div className="playlist-player">
            <img src="/media/vi-arcane.png" alt="Arcane Thumbnail" />
            <div className="playlist-info">
              <div className="playlist-text">
                <strong>
                  COME PLAY (from the series Arcane League of Legends)
                </strong>
                <span>Stray Kids, Young Miko, Tom Morello</span>
              </div>
              <div className="playlist-controls">
                <button className="play-btn" aria-label="Play">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </button>
                <div className="progress-bar">
                  <div className="progress-fill"></div>
                </div>
                <button className="skip-btn" aria-label="Skip">
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M5 4l10 8-10 8V4zm9 0h2v16h-2V4z" />
                  </svg>
                </button>
                <span className="time">02:41</span>
              </div>
            </div>
          </div>
        </aside>
      )}
    </main>
  );
}

function TopBannerForm({ account, onClose, onSave }) {
  const [form, setForm] = useState(
    account || { label: "", email: "", password: "", type: "Workspace" },
  );
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    if (!form.label || !form.email || !form.password) {
      setError("Complete all fields before saving.");
      return;
    }
    onSave(form);
  };
  return (
    <form className="top-banner" onSubmit={submit}>
      <div className="top-banner__title">
        <span>{account ? "EDIT SIGNAL" : "NEW SIGNAL"}</span>
        <b>{account ? account.label : "Add account"}</b>
      </div>
      <label>
        Name
        <input
          value={form.label}
          onChange={(e) => setForm({ ...form, label: e.target.value })}
          autoFocus
        />
      </label>
      <label>
        Email
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          type="email"
        />
      </label>
      <label>
        Password
        <input
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
      </label>
      <label>
        Type
        <select
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        >
          <option>Workspace</option>
          <option>Creator</option>
          <option>Storefront</option>
        </select>
      </label>
      {error && <small className="top-banner__error">{error}</small>}
      <button className="banner-save" type="submit">
        Save ↗
      </button>
      <button className="banner-close" type="button" onClick={onClose}>
        ×
      </button>
    </form>
  );
}
function AccountDrawer({ account, onClose, onEdit }) {
  if (!account) return null;
  return (
    <aside className="account-drawer">
      <button className="drawer-close" onClick={onClose}>
        ×
      </button>
      <span className="eyebrow">Selected credential</span>
      <h2>{account.label}</h2>
      <div>
        <small>Email</small>
        <b>{account.email}</b>
      </div>
      <div>
        <small>Password</small>
        <b>{account.password}</b>
      </div>
      <div className="drawer-meta">
        <span>{account.type}</span>
        <strong>{account.value}</strong>
      </div>
      <button className="drawer-edit" onClick={() => onEdit(account)}>
        Edit signal ↗
      </button>
    </aside>
  );
}
function AccountRow({ account, index, onSelect }) {
  const [show, setShow] = useState(false);
  return (
    <button
      className="account-row"
      type="button"
      onClick={() => onSelect(account)}
    >
      <span>0{index + 1}</span>
      <strong>
        {account.label}
        <small>{account.id}</small>
      </strong>
      <span>{account.email}</span>
      <span
        className="password"
        onClick={(e) => {
          e.stopPropagation();
          setShow(!show);
        }}
      >
        {show ? account.password : "••••••••••"} <i>{show ? "hide" : "show"}</i>
      </span>
      <em className={`status status--${account.status.toLowerCase()}`}>
        {account.status}
      </em>
      <b>{account.value}</b>
    </button>
  );
}
function AccountNetwork({ accounts, onSelect }) {
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const champions = [
    { name: "Jinx", image: "/media/jinx-web-cutout.png" },
    { name: "Vi", image: "/media/vi-arcane.png" },
    { name: "Ekko", image: "/media/ekko-reference.jpg" },
    { name: "Jayce", image: "/media/jayce-reference.jpg" },
  ];
  const positions = [
    { x: 16, y: 12 },
    { x: 68, y: 15 },
    { x: 40, y: 42 },
    { x: 56, y: 70 },
  ];
  const copyAccount = async (event, account) => {
    event.stopPropagation();
    await navigator.clipboard?.writeText(`${account.email}\n${account.password}`);
    event.currentTarget.classList.remove("is-copied");
    requestAnimationFrame(() => event.currentTarget.classList.add("is-copied"));
  };
  return (
    <div
      className="account-network dark-tree"
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setPan({
          x: ((event.clientX - rect.left) / rect.width - 0.5) * -70,
          y: ((event.clientY - rect.top) / rect.height - 0.5) * -46,
        });
      }}
      onPointerLeave={() => setPan({ x: 0, y: 0 })}
      style={{ "--pan-x": `${pan.x}px`, "--pan-y": `${pan.y}px` }}
    >
      <div className="tree-canvas">
        <svg className="tree-links" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          <path d="M 22 23 C 29 23 33 48 45 48" />
          <path d="M 74 26 C 66 26 62 48 48 48" />
          <path d="M 47 56 C 47 63 54 65 59 72" />
        </svg>
        {accounts.map((account, index) => {
          const champion = champions[index % champions.length];
          const position = positions[index % positions.length];
          return (
            <article
              className="account-node dark-tree-node"
              key={account.id}
              onClick={() => onSelect(account)}
              style={{ "--node-x": `${position.x}%`, "--node-y": `${position.y}%` }}
            >
              <div className="champion-card">
                <img src={champion.image} alt={champion.name} />
              </div>
              <span className="champion-name">{champion.name}</span>
              <h3>{account.label}</h3>
              <span className="tree-platform">{account.type} · {account.id}</span>
              <p className="account-login">{account.email}</p>
              <button
                className="account-password"
                type="button"
                onClick={(event) => copyAccount(event, account)}
                title="Copy login and password"
              >
                <span>{account.password}</span>
                <small>CLICK TO COPY</small>
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function VaultIndex({
  accounts,
  events,
  onBack,
  onAdd,
  onEdit,
  onSelect,
  selected,
}) {
  const [view, setView] = useState("current");
  return (
    <main className="vault-page">
      <div className="vault-page__texture" />
      <header className="vault-header">
        <Brand onOpen={onBack} />
        <nav>
          <button
            className={view === "current" ? "is-active" : ""}
            onClick={() => setView("current")}
          >
            Current
          </button>
          <button
            className={view === "history" ? "is-active" : ""}
            onClick={() => setView("history")}
          >
            History
          </button>
          <button
            className={view === "buying" ? "is-active" : ""}
            onClick={() => setView("buying")}
          >
            Buying
          </button>
        </nav>
        <button className="back-link" onClick={onBack}>
          Back to city ↗
        </button>
      </header>
      <DoodleVideo src={DOODLES.squiggle} className="doodle-video--vault" />
      <section className="vault-content">
        <div className="vault-title">
          <span className="eyebrow">Vault Index / operator view</span>
          <h1>
            {view === "current"
              ? "Current accounts"
              : view === "history"
                ? "Movement history"
                : "Buying queue"}
          </h1>
          <p>
            {view === "current"
              ? "Credential inventory, ready when the city calls."
              : view === "history"
                ? "A trace of every signal moving through the vault."
                : "Incoming inventory is held for review."}
          </p>
        </div>
        {view === "current" && (
          <>
            <div className="vault-actions">
              <span>
                <b>{accounts.length}</b> signals /{" "}
                <b>{accounts.filter((a) => a.status === "Ready").length}</b>{" "}
                ready
              </span>
              <button onClick={onAdd}>+ Add account</button>
            </div>
            <AccountNetwork accounts={accounts} onSelect={onSelect} />
          </>
        )}
        {view === "history" && (
          <div className="history-list">
            {events.map((event, index) => (
              <div className="history-row" key={`${event.label}-${index}`}>
                <i className={event.tone} />
                <span>
                  <b>{event.label}</b>
                  <small>{event.detail}</small>
                </span>
                <time>{event.time}</time>
              </div>
            ))}
          </div>
        )}
        {view === "buying" && (
          <div className="buying-empty">
            <DoodleVideo src={DOODLES.explosion} />
            <p>No incoming accounts right now.</p>
            <small>
              New inventory can be added directly to the current account list.
            </small>
          </div>
        )}
      </section>
      <footer className="vault-footer">
        <span>RIOT GAMES / VAULT INDEX</span>
        <span>DOODLE RENDERS // 07</span>
      </footer>
      <AccountDrawer
        account={selected}
        onClose={() => onSelect(null)}
        onEdit={onEdit}
      />
    </main>
  );
}

function PageTransition({ active }) {
  return (
    <div className={`page-transition${active ? " is-active" : ""}`} aria-hidden="true">
      <div className="transition-glow" />
      <img src="/media/jinx-web-cutout.png" alt="" />
      <span>SHIFTING SIGNAL</span>
    </div>
  );
}

export function ArcaneHero() {
  const [page, setPage] = useState("landing");
  const [transitioning, setTransitioning] = useState(false);
  const [accounts, setAccounts] = useState(() =>
    loadSession(ACCOUNTS_KEY, seedAccounts),
  );
  const [events, setEvents] = useState(() =>
    loadSession(HISTORY_KEY, seedHistory),
  );
  const [selected, setSelected] = useState(null);
  const [banner, setBanner] = useState(null);
  const [soundOn, setSoundOn] = useState(false);
  const [toast, setToast] = useState("");
  const navigate = (nextPage) => {
    if (transitioning || nextPage === page) return;
    setTransitioning(true);
    window.setTimeout(() => {
      setPage(nextPage);
      window.setTimeout(() => setTransitioning(false), 90);
    }, 620);
  };
  useEffect(
    () => window.sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts)),
    [accounts],
  );
  useEffect(
    () => window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(events)),
    [events],
  );
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);
  const saveAccount = (form) => {
    if (banner?.account) {
      setAccounts(
        accounts.map((item) =>
          item.id === banner.account.id ? { ...item, ...form } : item,
        ),
      );
      setToast(`${form.label} updated`);
    } else {
      const n =
        Math.max(42, ...accounts.map((item) => Number(item.id.slice(3)))) + 1;
      const next = {
        ...form,
        id: `AC-${String(n).padStart(3, "0")}`,
        status: "Ready",
        value: "$24",
      };
      setAccounts([next, ...accounts]);
      setEvents([
        {
          label: next.label,
          detail: "Added to current inventory",
          time: "Just now",
          tone: "blue",
        },
        ...events,
      ]);
      setToast(`${next.label} added to inventory`);
    }
    setBanner(null);
    setSelected(null);
  };
  return (
    <>
      {page === "landing" ? (
        <Landing
          onOpenVault={() => navigate("vault")}
          soundOn={soundOn}
          setSoundOn={setSoundOn}
        />
      ) : (
        <>
          <VaultIndex
            accounts={accounts}
            events={events}
            onBack={() => navigate("landing")}
            onAdd={() => setBanner({})}
            onEdit={(account) => {
              setSelected(null);
              setBanner({ account });
            }}
            onSelect={setSelected}
            selected={selected}
          />
          {banner && (
            <TopBannerForm
              account={banner.account}
              onClose={() => setBanner(null)}
              onSave={saveAccount}
            />
          )}{" "}
          {toast && (
            <div className="action-toast">
              {toast}
              <button onClick={() => setToast("")}>×</button>
            </div>
          )}
        </>
      )}
      <PageTransition active={transitioning} />
    </>
  );
}
