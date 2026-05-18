// screens-client.jsx — Client flow shown as a phone-framed prototype centered on desktop
// Steps: phone → OTP → slot picker → request confirmation (auto-advances) → live status

const { useState: useStateC, useEffect: useEffectC, useMemo: useMemoC, useRef: useRefC } = React;

/* ───────────────── Phone frame ───────────────── */
function PhoneFrame({ children, screen }) {
  const W = 392;
  const H = 800;
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)",
      display: "grid",
      gridTemplateColumns: "1fr",
      placeItems: "center",
      padding: "40px 24px",
      backgroundImage:
        "radial-gradient(circle at 50% 50%, transparent, color-mix(in oklab, var(--ink) 4%, transparent))",
    }}>
      {/* Side info rail */}
      <div style={{
        position: "fixed", left: 32, top: 80, width: 240,
        display: "flex", flexDirection: "column", gap: 14,
        color: "var(--ink-2)",
      }}>
        <QFLogo size={18} />
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em" }}>Client portal</h3>
        <p style={{ margin: 0, fontSize: 12.5, color: "var(--ink-3)", lineHeight: 1.55 }}>
          The mobile-first flow a client sees when they scan a QR or open a shared link.
          No password — just a phone number and an OTP.
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
          {[
            ["Phone",      "client-phone"],
            ["OTP verify", "client-otp"],
            ["Pick a slot","client-slot"],
            ["Live status","client-status"],
          ].map(([l, id]) => (
            <span key={id} style={{
              fontSize: 12, padding: "5px 8px", borderRadius: 6,
              background: screen === id ? "var(--teal-tint)" : "transparent",
              color: screen === id ? "var(--teal-ink)" : "var(--ink-3)",
              fontWeight: screen === id ? 500 : 400,
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>
              {screen === id ? "•" : "·"} {l}
            </span>
          ))}
        </div>
      </div>

      {/* Phone */}
      <div style={{
        width: W, height: H,
        background: "var(--ink)", borderRadius: 44,
        padding: 11,
        boxShadow: "0 30px 80px rgba(20,18,12,.18), 0 0 0 1px rgba(20,18,12,.05)",
        position: "relative",
      }}>
        <div style={{
          width: "100%", height: "100%", borderRadius: 34,
          background: "var(--surface)", overflow: "hidden",
          display: "flex", flexDirection: "column",
          position: "relative",
        }}>
          {/* Status bar */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 24px 6px",
            fontSize: 13, fontWeight: 600,
            color: "var(--ink)",
            position: "relative", zIndex: 2,
          }}>
            <span className="tnum">14:38</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11 }}>
              <SignalIcon /><WifiIcon /><BatteryIcon />
            </span>
          </div>
          {/* Dynamic island */}
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            width: 96, height: 26, background: "var(--ink)", borderRadius: 14,
            zIndex: 3,
          }} />
          <div style={{ flex: 1, minHeight: 0, overflow: "auto" }} className="qf-scroll">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
function SignalIcon() {
  return <svg width="14" height="9" viewBox="0 0 14 9" fill="currentColor"><rect x="0" y="6" width="2" height="3" rx="0.5"/><rect x="4" y="4" width="2" height="5" rx="0.5"/><rect x="8" y="2" width="2" height="7" rx="0.5"/><rect x="12" y="0" width="2" height="9" rx="0.5"/></svg>;
}
function WifiIcon() {
  return <svg width="13" height="9" viewBox="0 0 13 9" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M1 3.5 a8 8 0 0 1 11 0M3 5.5 a5 5 0 0 1 7 0M5 7.5 a2 2 0 0 1 3 0"/></svg>;
}
function BatteryIcon() {
  return <svg width="22" height="10" viewBox="0 0 22 10" fill="none"><rect x="0.5" y="0.5" width="18" height="9" rx="2" stroke="currentColor" opacity="0.4"/><rect x="2" y="2" width="14" height="6" rx="1" fill="currentColor"/><rect x="19.5" y="3.5" width="1.5" height="3" rx="0.5" fill="currentColor" opacity="0.4"/></svg>;
}

/* ───────────────── Step 1: Phone ───────────────── */
function ClientPhoneScreen({ onContinue }) {
  const [phone, setPhone] = useStateC("82 414 4521");
  const [returning, setReturning] = useStateC(false);

  return (
    <PhoneFrame screen="client-phone">
      <div style={{ padding: "28px 24px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 9,
            background: "var(--teal)", color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 13, fontWeight: 600,
          }}>BF</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>Bryanston Family Practice</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>General · Dental · Peds</div>
          </div>
        </div>

        <h1 style={{ margin: "32px 0 6px", fontSize: 24, fontWeight: 500, letterSpacing: "-0.02em", lineHeight: 1.2, textWrap: "balance" }}>
          Skip the waiting room.<br />
          Get notified when it's your turn.
        </h1>
        <p style={{ margin: "0 0 22px", color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.5 }}>
          Enter your phone number to join. We'll text you a code and a live link to your spot in the queue.
        </p>

        <Field label="Phone number">
          <div style={{
            display: "flex", alignItems: "center", gap: 8,
            background: "var(--surface)",
            border: "1px solid var(--line-2)",
            borderRadius: 10, padding: "0 10px 0 12px", height: 50,
          }}>
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              paddingRight: 8, borderRight: "1px solid var(--line)",
              height: "60%",
            }}>
              <span style={{ fontSize: 16 }}>🇿🇦</span>
              <span className="mono tnum" style={{ fontSize: 14 }}>+27</span>
              <Icon name="chevronD" size={11} style={{ color: "var(--ink-3)" }} />
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="82 123 4567"
              inputMode="tel"
              style={{
                flex: 1, height: "100%", border: 0, background: "transparent",
                font: "inherit", fontSize: 16, color: "var(--ink)", outline: 0,
              }} />
          </div>
        </Field>

        <Button variant="primary" size="lg" full style={{ marginTop: 18, height: 52 }} onClick={onContinue} iconRight="arrowR">
          Continue
        </Button>

        <button onClick={() => setReturning(!returning)} style={{
          marginTop: 18, width: "100%", padding: "12px 14px",
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: 10, cursor: "pointer", textAlign: "left",
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Icon name="refresh" size={15} style={{ color: "var(--ink-3)" }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>I've been here before</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Verify with the same phone — we'll skip the details.</div>
          </div>
        </button>

        <div style={{
          marginTop: 26,
          padding: "12px 14px",
          background: "var(--surface-2)",
          borderRadius: 10,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Icon name="shield" size={14} style={{ color: "var(--ink-3)", marginTop: 2 }} />
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", lineHeight: 1.5 }}>
            We use your number only to send queue updates. Stored securely; not shared with third parties.
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ───────────────── Step 2: OTP ───────────────── */
function ClientOTPScreen({ onContinue, onBack }) {
  const [digits, setDigits] = useStateC(["4", "8", "2", "", "", ""]);
  const [cd, setCd] = useStateC(30);
  useEffectC(() => {
    if (cd <= 0) return;
    const id = setTimeout(() => setCd(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cd]);

  const setDigit = (i, v) => {
    if (!/^\d?$/.test(v)) return;
    const nd = [...digits];
    nd[i] = v;
    setDigits(nd);
    if (v && i < 5) {
      const next = document.getElementById(`qf-otp-${i + 1}`);
      next?.focus();
    }
  };

  return (
    <PhoneFrame screen="client-otp">
      <div style={{ padding: "28px 24px 24px" }}>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "transparent", border: 0, padding: 0,
          color: "var(--ink-2)", fontSize: 13, cursor: "pointer", marginBottom: 22,
        }}>
          <Icon name="chevronL" size={14} /> Back
        </button>

        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
          Enter the code we sent you
        </h1>
        <p style={{ margin: "0 0 24px", color: "var(--ink-3)", fontSize: 13.5 }}>
          We sent a 6-digit code to <span className="mono tnum" style={{ color: "var(--ink)" }}>+27 82 ••• 4521</span>.
        </p>

        <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
          {digits.map((d, i) => (
            <input
              key={i}
              id={`qf-otp-${i}`}
              value={d}
              onChange={(e) => setDigit(i, e.target.value)}
              maxLength={1}
              inputMode="numeric"
              style={{
                width: 50, height: 60,
                textAlign: "center", fontSize: 22,
                fontFamily: "var(--font-mono)",
                background: "var(--surface)",
                border: `1.5px solid ${d ? "var(--teal)" : "var(--line-2)"}`,
                borderRadius: 10, outline: 0,
                color: "var(--ink)",
              }} />
          ))}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 18, justifyContent: "space-between" }}>
          <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Didn't get a code?</span>
          {cd > 0 ? (
            <span style={{ fontSize: 12.5, color: "var(--ink-4)" }}>Resend in <span className="mono tnum">{cd}s</span></span>
          ) : (
            <button style={{ fontSize: 12.5, color: "var(--teal-ink)", background: "transparent", border: 0, fontWeight: 500, cursor: "pointer" }}>Resend code</button>
          )}
        </div>

        <Button variant="primary" size="lg" full onClick={onContinue} style={{ marginTop: 28, height: 52 }} iconRight="arrowR">
          Verify
        </Button>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button style={{ background: "transparent", border: 0, color: "var(--ink-3)", fontSize: 12.5, cursor: "pointer" }}>
            Use a different number
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}

/* ───────────────── Step 3: Slot picker ───────────────── */
const PROVIDERS = [
  { id: "a", name: "Dr. Amara Okonkwo", role: "GP · Room 1", queue: 3, next: "15:00",
    slots: [
      { time: "15:00", today: true, type: "Consult", duration: 30 },
      { time: "15:30", today: true, type: "Consult", duration: 30 },
      { time: "16:00", today: true, type: "Follow-up", duration: 15 },
      { time: "09:00", today: false, type: "Consult", duration: 30 },
      { time: "10:00", today: false, type: "Follow-up", duration: 15 },
    ]
  },
  { id: "b", name: "Dr. Sipho Dlamini", role: "GP · Room 2", queue: 1, next: "14:55",
    slots: [
      { time: "14:55", today: true, type: "Follow-up", duration: 15 },
      { time: "15:30", today: true, type: "Consult", duration: 30 },
    ]
  },
  { id: "c", name: "Nurse Lerato Smith", role: "Triage · Desk", queue: 8, next: "15:10",
    slots: [
      { time: "15:10", today: true, type: "Triage", duration: 10 },
      { time: "15:20", today: true, type: "Triage", duration: 10 },
    ]
  },
];

function ClientSlotPickerScreen({ onSelect, onBack }) {
  const [tab, setTab] = useStateC("specific");
  const [expanded, setExpanded] = useStateC("a");

  return (
    <PhoneFrame screen="client-slot">
      <div style={{ padding: "24px 20px 80px" }}>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "transparent", border: 0, padding: 0,
          color: "var(--ink-2)", fontSize: 13, cursor: "pointer", marginBottom: 16,
        }}>
          <Icon name="chevronL" size={14} /> Back
        </button>

        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
          Welcome back, Sarah.
        </h1>
        <p style={{ margin: "0 0 18px", color: "var(--ink-3)", fontSize: 13.5 }}>
          Choose how you'd like to be seen. Your last visit was 12 March.
        </p>

        {/* Tabs */}
        <div style={{
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4,
          background: "var(--surface-2)", padding: 4, borderRadius: 10,
          marginBottom: 14,
        }}>
          {[
            ["specific", "Pick a person"],
            ["any", "Any available"],
          ].map(([id, l]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              padding: "9px 8px", border: 0, borderRadius: 7,
              background: tab === id ? "var(--surface)" : "transparent",
              color: tab === id ? "var(--ink)" : "var(--ink-3)",
              fontSize: 13, fontWeight: 500, cursor: "pointer",
              boxShadow: tab === id ? "var(--shadow-sm)" : "none",
            }}>{l}</button>
          ))}
        </div>

        {tab === "specific" ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {PROVIDERS.map((p) => (
              <ProviderTile key={p.id} p={p} open={expanded === p.id} onToggle={() => setExpanded(expanded === p.id ? null : p.id)} onSelect={onSelect} />
            ))}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{
              padding: 16,
              background: "var(--teal-tint)",
              border: "1px solid color-mix(in oklab, var(--teal) 25%, transparent)",
              borderRadius: 12,
            }}>
              <Pill tone="teal" dot>Earliest available</Pill>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 12 }}>
                <Avatar name="Sipho Dlamini" size={36} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>Dr. Sipho Dlamini</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Follow-up · 15 min</div>
                </div>
                <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500, color: "var(--teal-ink)" }}>14:55</div>
              </div>
              <Button variant="primary" full style={{ marginTop: 14, height: 48 }} onClick={() => onSelect({ providerId: "b", slot: "14:55" })}>
                Take this slot
              </Button>
            </div>
            <div style={{ marginTop: 4, fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Other options today
            </div>
            {[
              ["Dr. Okonkwo", "15:00", "Consult · 30 min"],
              ["Nurse L. Smith", "15:10", "Triage · 10 min"],
              ["Dr. Okonkwo", "15:30", "Consult · 30 min"],
            ].map(([n, t, l], i) => (
              <button key={i} onClick={() => onSelect({ providerId: "a", slot: t })} style={{
                background: "var(--surface)", border: "1px solid var(--line-2)",
                borderRadius: 10, padding: 12, textAlign: "left", cursor: "pointer",
                display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 10,
              }}>
                <Avatar name={n} size={28} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
                  <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{l}</div>
                </div>
                <div className="mono tnum" style={{ fontSize: 16, fontWeight: 500, color: "var(--ink)" }}>{t}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}

function ProviderTile({ p, open, onToggle, onSelect }) {
  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${open ? "var(--teal)" : "var(--line-2)"}`,
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: open ? "0 0 0 3px var(--teal-tint)" : "var(--shadow-sm)",
      transition: "border-color .15s, box-shadow .15s",
    }}>
      <button onClick={onToggle} style={{
        width: "100%", padding: 12,
        background: "transparent", border: 0, cursor: "pointer", textAlign: "left",
        display: "grid", gridTemplateColumns: "auto 1fr auto", alignItems: "center", gap: 12,
      }}>
        <Avatar name={p.name} size={40} active />
        <div>
          <div style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{p.role} · {p.queue} in queue</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="mono tnum" style={{ fontSize: 16, fontWeight: 500 }}>{p.next}</div>
          <div style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            next slot
          </div>
        </div>
      </button>
      {open && (
        <div style={{ borderTop: "1px solid var(--line)", padding: 12 }}>
          <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 8 }}>
            Today
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
            {p.slots.filter(s => s.today).map((s, i) => (
              <button key={i} onClick={() => onSelect({ providerId: p.id, slot: s.time, type: s.type, duration: s.duration })} style={{
                padding: "10px 4px",
                background: "var(--surface)",
                border: "1px solid var(--line-2)",
                borderRadius: 8, cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              }}>
                <span className="mono tnum" style={{ fontSize: 14, fontWeight: 500 }}>{s.time}</span>
                <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{s.duration}m</span>
              </button>
            ))}
          </div>
          {p.slots.some(s => !s.today) && <>
            <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, margin: "10px 0 8px" }}>
              Tomorrow
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
              {p.slots.filter(s => !s.today).map((s, i) => (
                <button key={i} onClick={() => onSelect({ providerId: p.id, slot: s.time })} style={{
                  padding: "10px 4px",
                  background: "var(--surface)",
                  border: "1px solid var(--line-2)",
                  borderRadius: 8, cursor: "pointer",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                }}>
                  <span className="mono tnum" style={{ fontSize: 14, fontWeight: 500 }}>{s.time}</span>
                  <span style={{ fontSize: 10, color: "var(--ink-3)" }}>{s.duration}m</span>
                </button>
              ))}
            </div>
          </>}
        </div>
      )}
    </div>
  );
}

/* ───────────────── Step 4: Client status page ───────────────── */
function ClientStatusScreen({ onCancel }) {
  const [pos, setPos] = useStateC(3);
  const [eta, setEta] = useStateC(18 * 60 + 4); // 18:04 until called
  useEffectC(() => {
    const id = setInterval(() => {
      setEta(e => Math.max(0, e - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneFrame screen="client-status">
      <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7,
            background: "var(--teal)", color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 11, fontWeight: 600,
          }}>BF</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Bryanston Family Practice</div>
            <div style={{ fontSize: 10.5, color: "var(--ink-3)", display: "flex", alignItems: "center", gap: 5 }}>
              <span className="qf-live-dot" style={{ width: 5, height: 5 }} />
              Live status · updated 3s ago
            </div>
          </div>
          <button style={{
            border: 0, background: "var(--surface-2)", borderRadius: 8,
            padding: 7, cursor: "pointer", color: "var(--ink-3)",
          }}><Icon name="refresh" size={14} /></button>
        </div>

        {/* Big position */}
        <div style={{
          padding: "8px 24px 24px",
          textAlign: "center",
        }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Your place in line
          </div>
          <div style={{
            display: "inline-flex", alignItems: "baseline", gap: 6,
            margin: "10px 0 4px",
          }}>
            <span style={{ fontSize: 22, color: "var(--ink-3)", fontWeight: 400 }}>#</span>
            <span className="tnum" style={{
              fontSize: 84, fontWeight: 500, lineHeight: 0.95,
              letterSpacing: "-0.04em", color: "var(--teal)",
            }}>{pos}</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-2)" }}>
            of <span className="tnum">5</span> in Dr. Okonkwo's queue
          </div>

          {/* Queue dots */}
          <div style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 20 }}>
            {Array.from({ length: 5 }).map((_, i) => {
              const ahead = i < pos - 1;
              const me = i === pos - 1;
              const after = i > pos - 1;
              return (
                <div key={i} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  position: "relative",
                }}>
                  <span style={{
                    width: me ? 18 : 12, height: me ? 18 : 12, borderRadius: "50%",
                    background: ahead ? "var(--ink-4)" : me ? "var(--teal)" : "var(--line-2)",
                    boxShadow: me ? "0 0 0 4px var(--teal-tint)" : "none",
                    transition: "all .3s",
                  }} />
                  {me && <span style={{ fontSize: 10, color: "var(--teal-ink)", fontWeight: 500, position: "absolute", top: 24, whiteSpace: "nowrap" }}>You</span>}
                </div>
              );
            })}
          </div>
        </div>

        {/* ETA card */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{
            padding: 16,
            background: "linear-gradient(180deg, var(--teal-tint), var(--surface-2))",
            border: "1px solid color-mix(in oklab, var(--teal) 20%, transparent)",
            borderRadius: 14,
            textAlign: "center",
          }}>
            <div style={{ fontSize: 11, color: "var(--teal-ink)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
              Estimated time until called
            </div>
            <div className="mono tnum" style={{
              fontSize: 38, fontWeight: 500, marginTop: 6,
              color: "var(--teal-ink)", letterSpacing: "-0.03em",
            }}>{formatHMS(eta)}</div>
            <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 4 }}>
              Around 15:08 · we'll text you 5 min before
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div style={{ padding: "0 16px 16px" }}>
          <Card padding={0}>
            {[
              ["Provider", "Dr. Amara Okonkwo", "user"],
              ["Seat",     "Consultation room 1", "chair"],
              ["Type",     "Consult · 30 min", "clock"],
              ["Scheduled","Today, 15:00", "calendar"],
            ].map(([k, v, ic], i, arr) => (
              <div key={i} style={{
                padding: "10px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <Icon name={ic} size={14} style={{ color: "var(--ink-3)" }} />
                <span style={{ fontSize: 12, color: "var(--ink-3)", width: 70 }}>{k}</span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Updates feed */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
            Recent updates
          </div>
          <Card padding={0}>
            {[
              { tone: "coral", ic: "alert", t: <><b>Dr. Okonkwo is running ~10 min late</b>. We've updated your estimated time.</>, age: "2m ago" },
              { tone: "blue",  ic: "user",  t: <>You moved up — now <b>#3</b>.</>, age: "8m ago" },
              { tone: "success", ic: "check", t: <>Your booking was approved by Dr. Okonkwo.</>, age: "27m ago" },
            ].map((u, i, arr) => (
              <div key={i} style={{
                padding: "10px 14px",
                borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
                display: "flex", gap: 10,
              }}>
                <span style={{
                  width: 22, height: 22, borderRadius: 6, flex: "none",
                  background: `var(--${u.tone}-tint)`,
                  color: u.tone === "coral" ? "var(--coral-2)" : u.tone === "blue" ? "var(--blue)" : "var(--success)",
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon name={u.ic} size={12} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{u.t}</div>
                  <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{u.age}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Actions */}
        <div style={{ padding: "0 16px 24px", display: "flex", flexDirection: "column", gap: 8 }}>
          <Button variant="secondary" full style={{ height: 46 }} icon="clock">I'm running late</Button>
          <Button variant="danger-ghost" full style={{ height: 46 }} icon="x" onClick={onCancel}>Cancel my spot</Button>
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, { ClientPhoneScreen, ClientOTPScreen, ClientSlotPickerScreen, ClientStatusScreen });
