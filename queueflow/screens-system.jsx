// screens-system.jsx — Cross-cutting system states & components
//   #29 Empty states (4 cases)
//   #30 Delay SMS preview
//   Loading skeleton (org user queue)
//   Error state (failed booking submission)

const { useState: useStateSys, useEffect: useEffectSys } = React;

/* ───────────────────────────── #29 Empty states ───────────────────────────── */
function EmptyStatesScreen() {
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)", padding: "32px 40px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>Empty states</h1>
        <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--ink-3)" }}>
          Each empty state earns its place: a clear next action, never just an illustration.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          {/* Super user — no departments */}
          <ESFrame label="Super user · no departments yet">
            <ESBlock icon="building" title="Set up your first department"
              body="Departments group your seats — Dental, Pediatrics, General Practice. Most clinics start with one or two."
              primary="Add a department" secondary="See examples" />
          </ESFrame>

          {/* Org user — no queue today */}
          <ESFrame label="Org user · no queue today">
            <ESBlock icon="users" title="No one is waiting yet"
              body="Your queue is empty. Share your join link or wait for the first request to come in — we'll notify you."
              primary="Copy join link" secondary="Update availability"
              illustration="dots" />
          </ESFrame>

          {/* Client portal link — no scans */}
          <ESFrame label="Client portal link · no scans yet">
            <ESBlock icon="qr" title="No scans yet"
              body="This link was created 2 hours ago. Once people scan the QR or open the URL, you'll see scan counts here."
              primary="Download QR" secondary="Copy link"
              meta="Scope: Whole org · Created 12:14 today" />
          </ESFrame>

          {/* Analytics — insufficient data */}
          <ESFrame label="Analytics · insufficient data">
            <ESBlock icon="zap" title="We need a few more bookings"
              body="Analytics light up after 7 days and at least 30 completed bookings. You're at day 2 with 11 bookings — keep going."
              primary="Share your link" secondary="View dashboard"
              progress={{ value: 11, max: 30, label: "11 of 30 bookings" }} />
          </ESFrame>
        </div>
      </div>
    </div>
  );
}

function ESFrame({ label, children }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      <Card style={{ padding: 28, minHeight: 280, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </Card>
    </div>
  );
}

function ESBlock({ icon, title, body, primary, secondary, illustration, meta, progress }) {
  return (
    <div style={{ textAlign: "center", maxWidth: 360 }}>
      {illustration === "dots" ? (
        <div style={{ display: "flex", gap: 6, justifyContent: "center", marginBottom: 16 }}>
          {[3, 4, 5, 6, 7].map((d, i) => (
            <span key={i} style={{
              width: d, height: d, borderRadius: "50%",
              background: i === 2 ? "var(--teal)" : "var(--ink-4)",
              opacity: i === 2 ? 1 : 0.3,
            }} />
          ))}
        </div>
      ) : (
        <span style={{
          width: 56, height: 56, borderRadius: 14,
          background: "var(--surface-2)", color: "var(--ink-3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
        }}><Icon name={icon} size={22} stroke={1.5} /></span>
      )}
      <h3 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.015em" }}>{title}</h3>
      <p style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--ink-3)", lineHeight: 1.55 }}>{body}</p>
      {progress && (
        <div style={{ margin: "0 0 18px" }}>
          <div style={{ height: 6, background: "var(--surface-2)", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
            <div style={{ width: `${(progress.value / progress.max) * 100}%`, height: "100%", background: "var(--teal)" }} />
          </div>
          <span className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{progress.label}</span>
        </div>
      )}
      <div style={{ display: "inline-flex", gap: 8 }}>
        <Button variant="primary" size="sm">{primary}</Button>
        {secondary && <Button variant="ghost" size="sm">{secondary}</Button>}
      </div>
      {meta && <div style={{ marginTop: 14, fontSize: 11, color: "var(--ink-4)" }}>{meta}</div>}
    </div>
  );
}

/* ───────────────────────────── #30 Delay SMS preview ───────────────────────────── */
function SmsPreviewScreen() {
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)", padding: "32px 24px",
      display: "grid", gridTemplateColumns: "1fr", placeItems: "center",
    }}>
      <div style={{
        maxWidth: 1100, width: "100%",
        display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center",
      }}>
        {/* Left: composition explainer */}
        <div>
          <Pill tone="neutral" style={{ marginBottom: 14 }}>Auto-drafted by Claude · sent via Twilio</Pill>
          <h1 style={{ margin: "0 0 10px", fontSize: 32, fontWeight: 500, letterSpacing: "-0.025em", textWrap: "balance" }}>
            Delay alert SMS
          </h1>
          <p style={{ margin: "0 0 22px", fontSize: 15, color: "var(--ink-3)", lineHeight: 1.55 }}>
            When the system detects a queue is running &gt; 10 minutes behind schedule,
            downstream clients get a short, personalised SMS with a live link.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              ["Trigger", "When estimated wait drifts ≥ 10 min from scheduled time"],
              ["Audience", "All 'scheduled' and 'checked-in' clients in that org user's queue"],
              ["Personalisation", "First name, consultant, scheduled time, new estimate, deep link"],
              ["Throttling", "One SMS per client per delay event; max 3 per booking"],
            ].map(([k, v]) => (
              <div key={k} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 12, fontSize: 13 }}>
                <span style={{ color: "var(--ink-3)", fontWeight: 500 }}>{k}</span>
                <span style={{ color: "var(--ink-2)" }}>{v}</span>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 24, padding: 16,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderRadius: 12,
          }}>
            <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>Template</div>
            <pre className="mono" style={{
              margin: 0, fontSize: 12.5, color: "var(--ink-2)",
              whiteSpace: "pre-wrap", lineHeight: 1.6,
            }}>{`Hi {{first_name}}, your appointment with
{{consultant}} at {{scheduled_time}} is
running ~{{delay_min}} min late.
New estimated time: {{new_eta}}.

View live status: {{link}}`}</pre>
          </div>
        </div>

        {/* Right: phone */}
        <SmsPhone />
      </div>
    </div>
  );
}

function SmsPhone() {
  const W = 320, H = 620;
  return (
    <div style={{
      width: W, height: H,
      background: "var(--ink)", borderRadius: 36,
      padding: 10,
      boxShadow: "0 30px 80px rgba(20,18,12,.18), 0 0 0 1px rgba(20,18,12,.05)",
      margin: "0 auto",
      position: "relative",
    }}>
      <div style={{
        width: "100%", height: "100%", borderRadius: 28,
        background: "#0b0f10", overflow: "hidden",
        display: "flex", flexDirection: "column",
        position: "relative",
        color: "#ecead9",
        fontFamily: "-apple-system, BlinkMacSystemFont, sans-serif",
      }}>
        {/* Dynamic island */}
        <div style={{
          position: "absolute", top: 10, left: "50%", transform: "translateX(-50%)",
          width: 84, height: 22, background: "#000", borderRadius: 14, zIndex: 3,
        }} />
        {/* Status bar */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 22px 6px",
          fontSize: 12, fontWeight: 600,
        }}>
          <span className="tnum">14:42</span>
          <span />
        </div>
        {/* iOS-style messages header */}
        <div style={{
          padding: "16px 16px 10px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
        }}>
          <span style={{
            width: 50, height: 50, borderRadius: "50%",
            background: "#0f6e56", color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 16, fontWeight: 600,
          }}>BF</span>
          <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>BFP Clinic</span>
          <span style={{ fontSize: 9.5, opacity: 0.5 }}>SMS</span>
        </div>
        {/* Messages */}
        <div style={{ flex: 1, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 10, overflow: "auto" }}>
          <div style={{ textAlign: "center", fontSize: 10.5, color: "rgba(255,255,255,.4)", margin: "6px 0" }}>
            Today 10:32
          </div>
          {/* Earlier confirmation */}
          <Bubble side="them">
            Hi Sarah, your booking with Dr. Okonkwo on Tue 18 May at 15:00 is confirmed. View live status: queueflow.io/q/x42p
          </Bubble>
          <div style={{ textAlign: "center", fontSize: 10.5, color: "rgba(255,255,255,.4)", margin: "6px 0" }}>
            Today 14:42 · Delay alert
          </div>
          <Bubble side="them" highlight>
            Hi Sarah, your appointment with Dr. Okonkwo at 14:30 is running ~15 min late. New estimated time: 14:45.
            {"\n\n"}
            View live status: queueflow.io/q/x42p
          </Bubble>
          <Bubble side="me">
            Thanks for the heads up 🙏
          </Bubble>
        </div>
        {/* Input bar */}
        <div style={{
          padding: "8px 12px 14px",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <div style={{ flex: 1, padding: "6px 12px", borderRadius: 16, border: "1px solid rgba(255,255,255,.18)", fontSize: 12, color: "rgba(255,255,255,.4)" }}>
            iMessage
          </div>
        </div>
        {/* Home bar */}
        <div style={{
          position: "absolute", bottom: 6, left: "50%", transform: "translateX(-50%)",
          width: 110, height: 4, borderRadius: 2, background: "rgba(255,255,255,.55)",
        }} />
      </div>
    </div>
  );
}

function Bubble({ side, highlight, children }) {
  const isMe = side === "me";
  return (
    <div style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
      <div style={{
        maxWidth: "78%",
        padding: "8px 12px",
        borderRadius: 16,
        background: isMe ? "#0a84ff" : highlight ? "#1c2f29" : "rgba(255,255,255,.13)",
        color: isMe ? "#fff" : highlight ? "#8ad9bd" : "rgba(255,255,255,.95)",
        fontSize: 13, lineHeight: 1.4, whiteSpace: "pre-line",
        border: highlight ? "1px solid rgba(138,217,189,.3)" : "none",
      }}>
        {children}
      </div>
    </div>
  );
}

/* ───────────────────────────── Loading skeleton (org user queue) ───────────────────────────── */
function LoadingSkeletonScreen() {
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)", padding: "24px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>Loading skeleton</h1>
          <Pill tone="neutral">Org user queue — first paint</Pill>
        </div>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          {/* Sk: top bar */}
          <div style={{
            padding: "14px 24px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 16,
          }}>
            <div style={{ flex: 1 }}>
              <SkLine w={160} h={16} />
              <SkLine w={240} h={11} style={{ marginTop: 6 }} />
            </div>
            <SkBox w={140} h={32} />
            <SkBox w={92} h={32} />
          </div>

          <div style={{
            padding: "20px 24px 24px",
            display: "grid", gridTemplateColumns: "1fr 300px", gap: 20,
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Sections */}
              {[
                { tone: "amber", rows: 2 },
                { tone: "blue",  rows: 1, big: true },
                { tone: "teal",  rows: 3 },
                { tone: "neutral", rows: 3 },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "var(--surface)",
                  border: "1px solid var(--line)",
                  borderRadius: 12, overflow: "hidden",
                }}>
                  <div style={{
                    padding: "12px 16px", borderBottom: "1px solid var(--line)",
                    display: "flex", alignItems: "center", gap: 10,
                    position: "relative",
                  }}>
                    <span style={{ position: "absolute", left: 0, top: 10, bottom: 10, width: 3,
                      background: s.tone === "amber" ? "var(--amber)" :
                                  s.tone === "blue"  ? "var(--blue)" :
                                  s.tone === "teal"  ? "var(--teal)" : "var(--line-2)" }} />
                    <SkLine w={140} h={14} />
                    <SkBox w={24} h={18} />
                  </div>
                  {Array.from({ length: s.rows }).map((_, j) => (
                    <SkRow key={j} big={s.big} last={j === s.rows - 1} />
                  ))}
                </div>
              ))}
            </div>

            <div>
              <div style={{
                background: "var(--surface)", border: "1px solid var(--line)",
                borderRadius: 12, padding: 14, marginBottom: 12,
              }}>
                <SkLine w={120} h={14} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginTop: 12 }}>
                    <SkBox w={22} h={22} circle />
                    <div style={{ flex: 1 }}>
                      <SkLine w="80%" h={11} />
                      <SkLine w="60%" h={10} style={{ marginTop: 6 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <p style={{ marginTop: 16, fontSize: 12, color: "var(--ink-3)" }}>
          The skeleton matches the live queue layout so there's no jarring re-flow when data arrives.
          Shimmer is a single linear-gradient sliding across each block.
        </p>
      </div>

      <style>{`
        @keyframes qf-shimmer {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .qf-sk {
          background: linear-gradient(90deg, var(--surface-2) 0%, var(--surface-3) 45%, var(--surface-2) 90%);
          background-size: 200% 100%;
          animation: qf-shimmer 1.6s ease-in-out infinite;
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
}
function SkLine({ w, h = 12, style }) {
  return <div className="qf-sk" style={{ width: w, height: h, ...style }} />;
}
function SkBox({ w, h, circle, style }) {
  return <div className="qf-sk" style={{ width: w, height: h, borderRadius: circle ? "50%" : 6, ...style }} />;
}
function SkRow({ big, last }) {
  return (
    <div style={{
      padding: big ? "16px" : "12px 16px",
      borderBottom: last ? "none" : "1px solid var(--line)",
      display: "grid", gridTemplateColumns: big ? "auto 1fr auto" : "auto 1fr auto auto",
      gap: 12, alignItems: "center",
    }}>
      <SkBox w={big ? 48 : 30} h={big ? 48 : 30} circle />
      <div>
        <SkLine w={big ? 180 : 130} h={big ? 18 : 14} />
        <SkLine w={big ? 260 : 180} h={11} style={{ marginTop: 6 }} />
      </div>
      {!big && <SkLine w={70} h={13} />}
      <SkBox w={big ? 124 : 36} h={big ? 64 : 24} />
    </div>
  );
}

/* ───────────────────────────── Error state (failed booking submission) ───────────────────────────── */
function ErrorStateScreen() {
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)", padding: "32px 24px",
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>Error states</h1>
          <Pill tone="neutral">Inline · never destructive toast</Pill>
        </div>
        <p style={{ margin: "0 0 24px", fontSize: 13.5, color: "var(--ink-3)" }}>
          Failures surface where the user is looking. Always with a path forward — never a dead end.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* A. failed booking submission */}
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
              Failed booking submission · client
            </div>
            <FailedBookingMock />
          </div>

          {/* B. queue connection lost */}
          <div>
            <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
              Connection lost · org user queue
            </div>
            <ConnectionLostMock />
          </div>
        </div>
      </div>
    </div>
  );
}

function FailedBookingMock() {
  return (
    <Card style={{ padding: 0, overflow: "hidden", maxWidth: 380, margin: "0 auto" }}>
      <div style={{ padding: "20px 20px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8,
            background: "var(--teal)", color: "#fff",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, fontWeight: 600,
          }}>BF</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Bryanston Family Practice</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Confirming your booking…</div>
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <Field label="Phone number">
            <TextInput defaultValue="+27 82 414 4521" error />
          </Field>
        </div>

        <div style={{
          marginTop: 14, padding: 12,
          background: "var(--coral-tint)",
          border: "1px solid color-mix(in oklab, var(--coral) 30%, transparent)",
          borderRadius: 10,
          display: "flex", gap: 10, alignItems: "flex-start",
        }}>
          <Icon name="alert" size={16} style={{ color: "var(--coral-2)", marginTop: 1, flex: "none" }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: "var(--coral-2)", fontWeight: 600 }}>
              We couldn't hold your slot
            </div>
            <div style={{ fontSize: 12, color: "var(--coral-2)", marginTop: 3, lineHeight: 1.5 }}>
              Someone else just took 15:00 with Dr. Okonkwo. Your details are saved —
              pick another time below.
            </div>
          </div>
        </div>

        <div style={{
          marginTop: 14, padding: 12,
          background: "var(--surface-2)", border: "1px solid var(--line)",
          borderRadius: 10,
        }}>
          <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600, marginBottom: 6 }}>
            Next available
          </div>
          {[
            ["Dr. Okonkwo", "15:30", "Consult · 30 min"],
            ["Dr. Dlamini", "14:55", "Follow-up · 15 min"],
            ["Nurse Smith", "15:10", "Triage · 10 min"],
          ].map(([n, t, l]) => (
            <div key={n} style={{
              padding: "8px 0", display: "flex", alignItems: "center", gap: 10,
              borderTop: "1px solid var(--line)",
            }}>
              <Avatar name={n} size={24} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{n}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{l}</div>
              </div>
              <span className="mono tnum" style={{ fontSize: 13, fontWeight: 500 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ padding: 16 }}>
        <Button variant="primary" full style={{ height: 46 }} iconRight="arrowR">Try 15:30</Button>
      </div>
    </Card>
  );
}

function ConnectionLostMock() {
  return (
    <Card style={{ padding: 0, overflow: "hidden" }}>
      <div style={{
        padding: "10px 16px",
        background: "var(--coral-tint)",
        borderBottom: "1px solid color-mix(in oklab, var(--coral) 25%, transparent)",
        display: "flex", alignItems: "center", gap: 10,
        color: "var(--coral-2)",
      }}>
        <span style={{
          width: 7, height: 7, borderRadius: "50%",
          background: "var(--coral)", opacity: 0.6,
        }} />
        <span style={{ fontSize: 12.5, fontWeight: 500, flex: 1 }}>
          Connection lost · showing data from 47s ago
        </span>
        <Button variant="secondary" size="sm" icon="refresh">Retry</Button>
      </div>
      <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12, opacity: 0.55 }}>
        {[
          ["Beth Cele", "Consult · requested 15:00", "amber"],
          ["Michael v.d. Berg", "Follow-up · requested 15:15", "amber"],
          ["Sarah Mokoena", "In service · 4:23 elapsed", "blue"],
        ].map(([n, l, tone], i) => (
          <div key={i} style={{
            padding: 12, border: "1px solid var(--line)",
            borderRadius: 10, display: "flex", alignItems: "center", gap: 10,
          }}>
            <Avatar name={n} size={28} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{n}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{l}</div>
            </div>
            <Pill tone={tone}>—</Pill>
          </div>
        ))}
      </div>
      <div style={{
        padding: "10px 16px", borderTop: "1px solid var(--line)",
        background: "var(--surface-2)",
        fontSize: 12, color: "var(--ink-3)",
      }}>
        Actions are paused while reconnecting. Your queue stays visible.
      </div>
    </Card>
  );
}

Object.assign(window, {
  EmptyStatesScreen, SmsPreviewScreen, LoadingSkeletonScreen, ErrorStateScreen,
});
