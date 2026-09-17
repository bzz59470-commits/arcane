import { useEffect, useMemo, useState } from "react";
import { Brand } from "./Brand.jsx";
import { Landing } from "./Landing.jsx";
import { AccountTree } from "./AccountTree.jsx";
import { BuyingFeed } from "./BuyingFeed.jsx";
import {
  ACCOUNTS_KEY,
  HISTORY_KEY,
  accountStats,
  loadSession,
  seedAccounts,
  seedHistory,
} from "../lib/accounts.js";

const ACCOUNT_TYPES = ["Workspace", "Creator", "Storefront"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function TopBannerForm({ account, onClose, onSave }) {
  const [form, setForm] = useState(account || { label: "", email: "", password: "", type: "Workspace" });
  const [error, setError] = useState("");
  const submit = (e) => {
    e.preventDefault();
    const label = form.label.trim();
    const email = form.email.trim();
    const password = form.password.trim();
    if (!label || !email || !password) return setError("Complete all fields before saving.");
    if (label.length > 40) return setError("Name is too long (40 characters max).");
    if (!EMAIL_RE.test(email)) return setError("Enter a valid email address.");
    if (!ACCOUNT_TYPES.includes(form.type)) return setError("Pick a valid type.");
    onSave({ ...form, label, email, password });
  };
  return (
    <form className="top-banner" onSubmit={submit}>
      <div className="top-banner__title">
        <span>{account ? "EDIT SIGNAL" : "NEW SIGNAL"}</span>
        <b>{account ? account.label : "Add account"}</b>
      </div>
      <label>
        Name
        <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} autoFocus maxLength={40} />
      </label>
      <label>
        Email
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" />
      </label>
      <label>
        Password
        <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} maxLength={80} />
      </label>
      <label>
        Type
        <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
          {ACCOUNT_TYPES.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      {error && <small className="top-banner__error">{error}</small>}
      <button className="banner-save" type="submit">
        Save ↗
      </button>
      <button className="banner-close" type="button" onClick={onClose} aria-label="Close">
        ×
      </button>
    </form>
  );
}

function AccountDrawer({ account, onClose, onEdit }) {
  if (!account) return null;
  return (
    <aside className="account-drawer">
      <button className="drawer-close" onClick={onClose} aria-label="Close">
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

const VIEWS = [
  { id: "current", label: "Accounts" },
  { id: "buying", label: "Buying" },
  { id: "history", label: "History" },
];

function VaultIndex({ accounts, events, onBack, onAdd, onEdit, onSelect, selected }) {
  const [view, setView] = useState("current");
  return (
    <main className={`vault-page vault-page--${view}`}>
      <div className="vault-page__texture" />
      <header className="vault-header">
        <Brand onOpen={onBack} />
        <nav aria-label="Vault sections">
          {VIEWS.map((item) => (
            <button
              key={item.id}
              className={view === item.id ? "is-active" : ""}
              onClick={() => setView(item.id)}
              aria-pressed={view === item.id}
            >
              {item.label}
            </button>
          ))}
        </nav>
        <div className="vault-header__right">
          {view === "current" && (
            <button className="vault-add" onClick={onAdd} aria-label="Add account" title="Add account">
              +
            </button>
          )}
          <button className="back-link" onClick={onBack}>
            Back to city ↗
          </button>
        </div>
      </header>
      {view === "current" && <AccountTree accounts={accounts} selectedId={selected?.id} onSelect={onSelect} />}
      {view === "buying" && <BuyingFeed />}
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
      <AccountDrawer account={selected} onClose={() => onSelect(null)} onEdit={onEdit} />
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
  const [accounts, setAccounts] = useState(() => loadSession(ACCOUNTS_KEY, seedAccounts));
  const [events, setEvents] = useState(() => loadSession(HISTORY_KEY, seedHistory));
  const [selected, setSelected] = useState(null);
  const [banner, setBanner] = useState(null);
  const [toast, setToast] = useState("");
  const stats = useMemo(() => accountStats(accounts), [accounts]);

  const navigate = (nextPage) => {
    if (transitioning || nextPage === page) return;
    setTransitioning(true);
    window.setTimeout(() => {
      setPage(nextPage);
      window.setTimeout(() => setTransitioning(false), 90);
    }, 620);
  };
  useEffect(() => {
    try {
      window.sessionStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      /* storage unavailable (private mode / quota) — keep in-memory state */
    }
  }, [accounts]);
  useEffect(() => {
    try {
      window.sessionStorage.setItem(HISTORY_KEY, JSON.stringify(events));
    } catch {
      /* see above */
    }
  }, [events]);
  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(""), 4200);
    return () => clearTimeout(t);
  }, [toast]);

  const saveAccount = (form) => {
    if (banner?.account) {
      setAccounts(accounts.map((item) => (item.id === banner.account.id ? { ...item, ...form } : item)));
      setToast(`${form.label} updated`);
    } else {
      const n = Math.max(42, ...accounts.map((item) => Number(item.id.slice(3)) || 0)) + 1;
      const next = { ...form, id: `AC-${String(n).padStart(3, "0")}`, status: "Ready", value: "$24" };
      setAccounts([next, ...accounts]);
      setEvents([{ label: next.label, detail: "Added to current inventory", time: "Just now", tone: "blue" }, ...events]);
      setToast(`${next.label} added to inventory`);
    }
    setBanner(null);
    setSelected(null);
  };

  return (
    <>
      {page === "landing" ? (
        <Landing onOpenVault={() => navigate("vault")} stats={stats} />
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
          {banner && <TopBannerForm account={banner.account} onClose={() => setBanner(null)} onSave={saveAccount} />}
          {toast && (
            <div className="action-toast">
              {toast}
              <button onClick={() => setToast("")} aria-label="Dismiss">
                ×
              </button>
            </div>
          )}
        </>
      )}
      <PageTransition active={transitioning} />
    </>
  );
}
