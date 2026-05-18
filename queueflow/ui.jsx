// ui.jsx — Shared primitives and atoms used across all QueueFlow screens.
// All exports are stuck onto window at the bottom so other <script type="text/babel">
// files can pick them up without an import system.

const { useState, useEffect, useRef, useMemo, useCallback, createContext, useContext } = React;

/* ═══════════════════════════════════════════════════════════════════
   Brand mark — wordmark + "queue dots" motif
   Five dots, the second from the right is teal (the active one being served).
   ═══════════════════════════════════════════════════════════════════ */
function QFLogo({ size = 18, showWord = true, animate = false, mono = false }) {
  // dots from "next" (smallest) → "active" (largest, teal)
  const dotColor = mono ? "currentColor" : "var(--ink)";
  const accent = mono ? "currentColor" : "var(--teal)";
  const dots = [3, 4, 5, 6, 7]; // diameters
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--ink)" }}>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 3, height: size }}>
        {dots.map((d, i) => (
          <span
            key={i}
            style={{
              width: d, height: d, borderRadius: "50%",
              background: i === 3 ? accent : dotColor,
              opacity: i === 3 ? 1 : 0.25 + i * 0.15,
              transition: "all .4s ease",
            }}
          />
        ))}
      </span>
      {showWord && (
        <span style={{
          fontFamily: "var(--font-sans)",
          fontWeight: 600,
          fontSize: size * 0.85,
          letterSpacing: "-0.015em",
          color: "var(--ink)",
        }}>
          queueflow
        </span>
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Inline SVG icons — stroked, 1.5px, currentColor
   Kept minimal: only what the prototype actually uses.
   ═══════════════════════════════════════════════════════════════════ */
const ICONS = {
  search:    "M11 18a7 7 0 1 1 4.95-2.05L20 20",
  chevronR:  "m9 6 6 6-6 6",
  chevronD:  "m6 9 6 6 6-6",
  chevronL:  "m15 18-6-6 6-6",
  chevronU:  "m18 15-6-6-6 6",
  plus:      "M12 5v14M5 12h14",
  minus:     "M5 12h14",
  check:     "m5 12 5 5 9-11",
  x:         "m6 6 12 12M18 6 6 18",
  user:      "M5 21a7 7 0 0 1 14 0M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  users:     "M3 21a6 6 0 0 1 12 0M21 21a5 5 0 0 0-7-4.6M9 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM16 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  bell:      "M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21a2 2 0 0 0 4 0",
  calendar:  "M3 9h18M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM8 3v4M16 3v4",
  clock:     "M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3 1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8 1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z",
  grid:      "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
  list:      "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
  trash:     "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6",
  pencil:    "m12 20 9-9-4-4-9 9v4h4zM14 7l4 4",
  link:      "M10 14a5 5 0 0 1 0-7l3-3a5 5 0 0 1 7 7l-1.5 1.5M14 10a5 5 0 0 1 0 7l-3 3a5 5 0 0 1-7-7l1.5-1.5",
  qr:        "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h3v3h-3zM20 14v3M17 20h3v1M14 18h1",
  copy:      "M9 9h11v11H9zM5 15V5a1 1 0 0 1 1-1h10",
  arrowR:    "M5 12h14m-5-5 5 5-5 5",
  arrowL:    "M19 12H5m5-5-5 5 5 5",
  phone:     "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 2 .6 2.9a2 2 0 0 1-.5 2.1L7.9 10a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.3 1.9.5 2.9.6a2 2 0 0 1 1.7 2z",
  shield:    "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  zap:       "M13 2 3 14h9l-1 8 10-12h-9z",
  send:      "m22 2-7 20-4-9-9-4 20-7z",
  qDots:     "", // unused, decorative drawn elsewhere
  building:  "M3 21h18M5 21V7l8-4 8 4v14M9 9h.01M13 9h.01M9 13h.01M13 13h.01M9 17h.01M13 17h.01",
  chair:     "M6 17v4M18 17v4M5 11V7a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4M4 11h16v6H4z",
  sparkles:  "M5 3v4M3 5h4M19 17v4M17 19h4M12 3 9 9l-6 3 6 3 3 6 3-6 6-3-6-3z",
  alert:     "M12 9v4M12 17h.01M10.3 3.86a2 2 0 0 1 3.4 0l8.1 14.14A2 2 0 0 1 20.1 21H3.9a2 2 0 0 1-1.7-3l8.1-14.14z",
  info:      "M12 16v-4M12 8h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z",
  dotsH:     "M5 12h.01M12 12h.01M19 12h.01",
  filter:    "M3 5h18l-7 8v6l-4-2v-4z",
  download:  "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  refresh:   "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  logout:    "M16 17l5-5-5-5M21 12H9M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
};
function Icon({ name, size = 16, stroke = 1.6, style, ...rest }) {
  const d = ICONS[name];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={stroke}
         strokeLinecap="round" strokeLinejoin="round"
         style={{ display: "block", flex: "none", ...style }} {...rest}>
      <path d={d} />
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Buttons
   ═══════════════════════════════════════════════════════════════════ */
function Button({ variant = "secondary", size = "md", icon, iconRight, full, children, style, ...rest }) {
  const pad = size === "sm" ? "6px 10px" : size === "lg" ? "12px 18px" : "9px 14px";
  const fz  = size === "sm" ? 12.5 : size === "lg" ? 15 : 13.5;
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
    border: "1px solid transparent", borderRadius: 8,
    padding: pad, fontSize: fz, fontWeight: 500,
    lineHeight: 1, cursor: "pointer",
    letterSpacing: "-0.005em",
    transition: "background .15s, border-color .15s, color .15s, transform .05s",
    width: full ? "100%" : "auto",
    whiteSpace: "nowrap",
  };
  const variants = {
    primary: {
      background: "var(--teal)", color: "#fff", borderColor: "var(--teal)",
    },
    secondary: {
      background: "var(--surface)", color: "var(--ink)", borderColor: "var(--line-2)",
    },
    ghost: {
      background: "transparent", color: "var(--ink-2)", borderColor: "transparent",
    },
    danger: {
      background: "var(--coral)", color: "#fff", borderColor: "var(--coral)",
    },
    "danger-ghost": {
      background: "transparent", color: "var(--coral-2)", borderColor: "transparent",
    },
    outline: {
      background: "transparent", color: "var(--ink)", borderColor: "var(--line-2)",
    },
    "teal-tint": {
      background: "var(--teal-tint)", color: "var(--teal-ink)", borderColor: "transparent",
    },
  };
  return (
    <button {...rest} style={{ ...base, ...(variants[variant] || variants.secondary), ...style }}>
      {icon && <Icon name={icon} size={fz} stroke={1.75} />}
      {children}
      {iconRight && <Icon name={iconRight} size={fz} stroke={1.75} />}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Form controls
   ═══════════════════════════════════════════════════════════════════ */
function Field({ label, hint, error, children, style }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6, ...style }}>
      {label && <span style={{ fontSize: 12.5, color: "var(--ink-2)", fontWeight: 500 }}>{label}</span>}
      {children}
      {error
        ? <span style={{ fontSize: 12, color: "var(--coral-2)" }}>{error}</span>
        : hint && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>}
    </label>
  );
}
function TextInput({ icon, style, error, ...rest }) {
  const wrap = {
    display: "flex", alignItems: "center", gap: 8,
    background: "var(--surface)",
    border: `1px solid ${error ? "var(--coral)" : "var(--line-2)"}`,
    borderRadius: 8, padding: "0 10px", height: 38,
    color: "var(--ink-3)",
    transition: "border-color .15s, box-shadow .15s",
  };
  return (
    <span style={{ ...wrap, ...style }} className="qf-input-wrap">
      {icon && <Icon name={icon} size={14} />}
      <input {...rest}
        style={{
          flex: 1, height: "100%", border: 0, background: "transparent",
          font: "inherit", color: "var(--ink)", outline: 0, padding: 0,
        }} />
    </span>
  );
}
function Select({ value, onChange, options, style }) {
  return (
    <span style={{
      display: "flex", alignItems: "center", gap: 8,
      background: "var(--surface)",
      border: "1px solid var(--line-2)",
      borderRadius: 8, padding: "0 8px 0 10px", height: 38,
      color: "var(--ink)", position: "relative",
      ...style,
    }}>
      <select value={value} onChange={(e) => onChange?.(e.target.value)}
        style={{
          flex: 1, height: "100%", border: 0, background: "transparent",
          font: "inherit", color: "var(--ink)", outline: 0, appearance: "none",
          paddingRight: 18,
        }}>
        {options.map(o =>
          typeof o === "string"
            ? <option key={o} value={o}>{o}</option>
            : <option key={o.value} value={o.value}>{o.label}</option>
        )}
      </select>
      <Icon name="chevronD" size={14} style={{ color: "var(--ink-3)" }} />
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Card / Surface / Divider
   ═══════════════════════════════════════════════════════════════════ */
function Card({ children, style, padding = 16, hover = false, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 12,
        padding,
        boxShadow: "var(--shadow-sm)",
        cursor: onClick ? "pointer" : "default",
        transition: "border-color .15s, box-shadow .15s, transform .05s",
        ...style,
      }}
      onMouseEnter={hover ? (e) => { e.currentTarget.style.borderColor = "var(--line-2)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; } : undefined}
      onMouseLeave={hover ? (e) => { e.currentTarget.style.borderColor = "var(--line)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)"; } : undefined}
    >
      {children}
    </div>
  );
}
function Divider({ vertical, style }) {
  return (
    <div style={{
      background: "var(--line)",
      ...(vertical ? { width: 1, alignSelf: "stretch" } : { height: 1, width: "100%" }),
      ...style,
    }} />
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pill / Badge / Status indicators
   ═══════════════════════════════════════════════════════════════════ */
function Pill({ tone = "neutral", icon, dot, children, style }) {
  const tones = {
    neutral: { bg: "var(--surface-2)",   fg: "var(--ink-2)",     bd: "var(--line)" },
    teal:    { bg: "var(--teal-tint)",   fg: "var(--teal-ink)",  bd: "transparent" },
    amber:   { bg: "var(--amber-tint)",  fg: "var(--amber)",     bd: "transparent" },
    blue:    { bg: "var(--blue-tint)",   fg: "var(--blue)",      bd: "transparent" },
    coral:   { bg: "var(--coral-tint)",  fg: "var(--coral-2)",   bd: "transparent" },
    success: { bg: "var(--success-tint)",fg: "var(--success)",   bd: "transparent" },
  };
  const t = tones[tone] || tones.neutral;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      background: t.bg, color: t.fg, border: `1px solid ${t.bd}`,
      borderRadius: 999, padding: "2px 8px",
      fontSize: 11.5, fontWeight: 500, lineHeight: 1.5,
      letterSpacing: "-0.003em",
      ...style,
    }}>
      {dot && <span style={{
        width: 6, height: 6, borderRadius: "50%",
        background: "currentColor", opacity: 0.85,
      }} />}
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Avatar — generated from name initials over a deterministic warm hue
   ═══════════════════════════════════════════════════════════════════ */
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function Avatar({ name = "?", size = 28, active, style }) {
  const initials = name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  const hues = [25, 200, 160, 320, 50, 280, 130]; // warm-ish, varied
  const hue = hues[hashStr(name) % hues.length];
  const bg = `oklch(0.88 0.04 ${hue})`;
  const fg = `oklch(0.32 0.05 ${hue})`;
  return (
    <span style={{ position: "relative", display: "inline-flex", flex: "none" }}>
      <span style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, color: fg,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: Math.max(10, size * 0.38), fontWeight: 600,
        letterSpacing: "-0.01em", userSelect: "none",
        boxShadow: "inset 0 0 0 1px rgba(20,18,12,.04)",
        ...style,
      }}>{initials || "?"}</span>
      {active !== undefined && (
        <span style={{
          position: "absolute", right: -1, bottom: -1,
          width: Math.max(8, size * 0.28), height: Math.max(8, size * 0.28),
          borderRadius: "50%",
          background: active ? "var(--success)" : "var(--ink-4)",
          border: "2px solid var(--surface)",
        }} />
      )}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Live values — ticking timer, "ago" timestamps
   ═══════════════════════════════════════════════════════════════════ */
function useTick(ms = 1000) {
  const [, set] = useState(0);
  useEffect(() => {
    const id = setInterval(() => set(n => n + 1), ms);
    return () => clearInterval(id);
  }, [ms]);
}
function formatHMS(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  return `${m}:${String(r).padStart(2, "0")}`;
}
function formatMS(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}
function agoLabel(ms) {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════════════════
   Layout: app sidebar + top bar
   ═══════════════════════════════════════════════════════════════════ */
function Sidebar({ items, active, onSelect, footer, orgName = "Bryanston Family Practice" }) {
  return (
    <aside style={{
      width: 232, flex: "none",
      background: "var(--surface)",
      borderRight: "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      height: "100%",
    }}>
      <div style={{ padding: "16px 16px 12px" }}>
        <QFLogo size={18} />
        <div style={{
          marginTop: 10, padding: "8px 10px",
          background: "var(--surface-2)", borderRadius: 8,
          display: "flex", alignItems: "center", gap: 8,
          border: "1px solid var(--line)",
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: 6,
            background: "var(--teal)", color: "#fff",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600,
          }}>BF</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{
              fontSize: 12.5, fontWeight: 500, color: "var(--ink)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{orgName}</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)" }}>2 locations</div>
          </div>
          <Icon name="chevronD" size={12} style={{ color: "var(--ink-3)" }} />
        </div>
      </div>
      <nav style={{ flex: 1, padding: "4px 8px", display: "flex", flexDirection: "column", gap: 1, overflow: "auto" }}>
        {items.map((it) => {
          if (it.heading) return (
            <div key={it.heading} style={{
              fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase",
              letterSpacing: "0.06em", fontWeight: 600,
              padding: "12px 10px 4px",
            }}>{it.heading}</div>
          );
          const sel = active === it.id;
          return (
            <button key={it.id} onClick={() => onSelect?.(it.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "7px 10px", border: 0,
                background: sel ? "var(--surface-2)" : "transparent",
                color: sel ? "var(--ink)" : "var(--ink-2)",
                fontSize: 13, fontWeight: sel ? 500 : 400,
                borderRadius: 6, cursor: "pointer", textAlign: "left",
                position: "relative",
              }}
              onMouseEnter={e => { if (!sel) e.currentTarget.style.background = "var(--surface-2)"; }}
              onMouseLeave={e => { if (!sel) e.currentTarget.style.background = "transparent"; }}
            >
              {sel && <span style={{
                position: "absolute", left: 0, top: 8, bottom: 8, width: 2,
                background: "var(--teal)", borderRadius: 2,
              }} />}
              <Icon name={it.icon} size={15} style={{ color: sel ? "var(--teal)" : "var(--ink-3)" }} />
              <span style={{ flex: 1 }}>{it.label}</span>
              {it.count != null && (
                <span style={{
                  fontSize: 10.5, color: "var(--ink-3)",
                  background: "var(--surface-2)",
                  border: "1px solid var(--line)",
                  borderRadius: 4, padding: "1px 5px", minWidth: 18, textAlign: "center",
                }} className="tnum">{it.count}</span>
              )}
            </button>
          );
        })}
      </nav>
      {footer && <div style={{ padding: "8px 12px 14px", borderTop: "1px solid var(--line)" }}>{footer}</div>}
    </aside>
  );
}

function TopBar({ title, subtitle, right, breadcrumb }) {
  return (
    <header style={{
      display: "flex", alignItems: "center",
      padding: "14px 24px",
      borderBottom: "1px solid var(--line)",
      background: "var(--surface)",
      gap: 16, flex: "none",
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        {breadcrumb && (
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginBottom: 2, display: "flex", alignItems: "center", gap: 4 }}>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={i}>
                {i > 0 && <Icon name="chevronR" size={10} />}
                <span style={{ color: i === breadcrumb.length - 1 ? "var(--ink-2)" : "var(--ink-3)" }}>{b}</span>
              </React.Fragment>
            ))}
          </div>
        )}
        <h1 style={{
          margin: 0, fontSize: 18, fontWeight: 600,
          color: "var(--ink)", letterSpacing: "-0.02em",
        }}>{title}</h1>
        {subtitle && <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 2 }}>{subtitle}</div>}
      </div>
      {right}
    </header>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   QR placeholder — a deterministic grid that looks like a QR code
   ═══════════════════════════════════════════════════════════════════ */
function QRPlaceholder({ size = 140, seed = "queueflow", style }) {
  const cells = 21;
  const px = size / cells;
  const data = useMemo(() => {
    let h = hashStr(seed);
    const out = [];
    for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
      h = (h * 1664525 + 1013904223) & 0xffffffff;
      out.push((h & 1) === 1);
    }
    return out;
  }, [seed]);
  const isFinder = (x, y) =>
    (x < 7 && y < 7) || (x >= cells - 7 && y < 7) || (x < 7 && y >= cells - 7);
  return (
    <div style={{
      width: size, height: size, padding: 8,
      background: "#fff",
      border: "1px solid var(--line)",
      borderRadius: 10,
      ...style,
    }}>
      <svg width={size - 16} height={size - 16} viewBox={`0 0 ${cells} ${cells}`} shapeRendering="crispEdges">
        {data.map((on, i) => {
          const x = i % cells, y = Math.floor(i / cells);
          if (isFinder(x, y)) return null;
          if (!on) return null;
          return <rect key={i} x={x} y={y} width="1" height="1" fill="var(--ink)" />;
        })}
        {/* Three finder squares */}
        {[[0,0],[cells-7,0],[0,cells-7]].map(([fx, fy], k) => (
          <g key={k}>
            <rect x={fx} y={fy} width="7" height="7" fill="var(--ink)" />
            <rect x={fx+1} y={fy+1} width="5" height="5" fill="#fff" />
            <rect x={fx+2} y={fy+2} width="3" height="3" fill="var(--ink)" />
          </g>
        ))}
      </svg>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   KPI card
   ═══════════════════════════════════════════════════════════════════ */
function Kpi({ label, value, sub, hint, tone = "neutral", style }) {
  const toneColors = {
    neutral: "var(--ink)",
    teal: "var(--teal)",
    coral: "var(--coral-2)",
    amber: "var(--amber)",
  };
  return (
    <Card style={{ padding: 14, ...style }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div style={{ fontSize: 12, color: "var(--ink-3)", fontWeight: 500 }}>{label}</div>
        {hint && <div style={{ fontSize: 11, color: "var(--ink-4)" }}>{hint}</div>}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
        <span className="tnum" style={{ fontSize: 24, fontWeight: 500, color: toneColors[tone], letterSpacing: "-0.02em" }}>{value}</span>
        {sub && <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{sub}</span>}
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Modal shell
   ═══════════════════════════════════════════════════════════════════ */
function Modal({ open, onClose, title, children, width = 480, footer }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "rgba(20,18,12,.34)",
      backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "var(--surface)",
        border: "1px solid var(--line)",
        borderRadius: 14, width, maxWidth: "100%",
        boxShadow: "var(--shadow-lg)",
        display: "flex", flexDirection: "column",
        maxHeight: "calc(100vh - 40px)",
        overflow: "hidden",
      }}>
        <div style={{
          padding: "14px 18px", borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, flex: 1, letterSpacing: "-0.01em" }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{
            border: 0, background: "transparent", cursor: "pointer",
            padding: 4, color: "var(--ink-3)", borderRadius: 6,
          }}><Icon name="x" size={16} /></button>
        </div>
        <div style={{ padding: 18, overflow: "auto", flex: 1 }} className="qf-scroll">{children}</div>
        {footer && <div style={{ padding: "12px 18px", borderTop: "1px solid var(--line)", display: "flex", gap: 8, justifyContent: "flex-end" }}>{footer}</div>}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Color palette tweak helper — applies palette tokens to a root element
   ═══════════════════════════════════════════════════════════════════ */
const PALETTES = {
  teal: {
    label: "Forest teal",
    "--teal":      "#0f6e56",
    "--teal-2":    "#0a4f3e",
    "--teal-tint": "#e3efe9",
    "--teal-ink":  "#084a39",
  },
  cobalt: {
    label: "Clinical blue",
    "--teal":      "#1f5fc1",
    "--teal-2":    "#174a98",
    "--teal-tint": "#e3ecf9",
    "--teal-ink":  "#103b7e",
  },
  plum: {
    label: "Quiet plum",
    "--teal":      "#7341a8",
    "--teal-2":    "#5a317e",
    "--teal-tint": "#efe7f5",
    "--teal-ink":  "#4b2867",
  },
};

/* ═══════════════════════════════════════════════════════════════════
   Export to window
   ═══════════════════════════════════════════════════════════════════ */
Object.assign(window, {
  QFLogo, Icon, Button, Field, TextInput, Select, Card, Divider, Pill,
  Avatar, Sidebar, TopBar, QRPlaceholder, Kpi, Modal,
  useTick, formatHMS, formatMS, agoLabel, hashStr,
  PALETTES,
});
