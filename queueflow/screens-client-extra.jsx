// screens-client-extra.jsx — Additional client screens
//   #23 New client details
//   #25 Request confirmation (soft-hold countdown)
//   #27 Returning visit welcome-back
//   #28 Rejection / unable-to-fulfill

const { useState: useStateCX, useEffect: useEffectCX } = React;

/* ─── #23 New client details ─── */
function ClientNewDetailsScreen({ onContinue, onBack }) {
  return (
    <PhoneFrame screen="client-details">
      <div style={{ padding: "24px 20px 24px" }}>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "transparent", border: 0, padding: 0,
          color: "var(--ink-2)", fontSize: 13, cursor: "pointer", marginBottom: 18,
        }}>
          <Icon name="chevronL" size={14} /> Back
        </button>

        <h1 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
          Welcome — a couple of quick details.
        </h1>
        <p style={{ margin: "0 0 22px", color: "var(--ink-3)", fontSize: 13.5 }}>
          We don't have you on file. Once you're set up, you won't need to do this again.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <Field label="First name">
              <TextInput defaultValue="Sarah" style={{ height: 46 }} />
            </Field>
            <Field label="Last name">
              <TextInput defaultValue="Mokoena" style={{ height: 46 }} />
            </Field>
          </div>
          <Field label="Email" hint="Optional — for receipts and reminders.">
            <TextInput placeholder="sarah@example.com" style={{ height: 46 }} icon="send" />
          </Field>
          <Field label="Reason for visit" hint="Optional — helps the consultant prepare.">
            <textarea
              placeholder="e.g. Persistent cough for 5 days"
              style={{
                width: "100%", minHeight: 78,
                padding: "10px 12px", border: "1px solid var(--line-2)", borderRadius: 10,
                background: "var(--surface)", color: "var(--ink)",
                font: "inherit", outline: 0, resize: "vertical",
              }}
            />
          </Field>
          <label style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: "10px 12px",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: 10,
            fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.5,
          }}>
            <input type="checkbox" defaultChecked style={{ marginTop: 2 }} />
            <span>I agree to receive SMS updates about my appointments at this number.</span>
          </label>
        </div>

        <Button variant="primary" size="lg" full style={{ marginTop: 18, height: 52 }} onClick={onContinue} iconRight="arrowR">
          Continue
        </Button>
      </div>
    </PhoneFrame>
  );
}

/* ─── #25 Request confirmation with soft-hold countdown ─── */
function ClientConfirmationScreen({ onApproved, onPickAnother }) {
  const [hold, setHold] = useStateCX(14 * 60 + 32);
  const [expanded, setExpanded] = useStateCX(false);
  useEffectCX(() => {
    const id = setInterval(() => setHold(h => Math.max(0, h - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneFrame screen="client-confirm">
      <div style={{ padding: "24px 20px 40px", textAlign: "center" }}>
        {/* Pulsing indicator */}
        <div style={{
          margin: "8px auto 16px",
          width: 84, height: 84, borderRadius: "50%",
          background: "var(--teal-tint)",
          display: "flex", alignItems: "center", justifyContent: "center",
          position: "relative",
        }}>
          <span style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "2px solid var(--teal)",
            animation: "qf-pulse 2s ease-out infinite",
            opacity: 0.4,
          }} />
          <Icon name="clock" size={32} style={{ color: "var(--teal-ink)" }} stroke={1.5} />
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em" }}>
          Your request is being reviewed
        </h1>
        <p style={{ margin: "0 0 18px", color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.5 }}>
          We're holding your slot while Dr. Okonkwo confirms. This usually takes 1–2 minutes.
        </p>

        {/* Slot card */}
        <div style={{
          margin: "0 0 16px",
          padding: 16,
          background: "var(--surface)",
          border: "1px solid var(--line)",
          borderRadius: 14,
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Avatar name="Amara Okonkwo" size={36} active />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Dr. Amara Okonkwo</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>General Practice · Room 1</div>
            </div>
          </div>
          <div style={{
            marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)",
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
          }}>
            <div>
              <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Time</div>
              <div className="mono tnum" style={{ fontSize: 16, fontWeight: 500, marginTop: 2 }}>15:00</div>
            </div>
            <div>
              <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Type</div>
              <div style={{ fontSize: 13, marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 7, height: 7, borderRadius: 2, background: "var(--teal)" }} />
                Consult · 30 min
              </div>
            </div>
          </div>
        </div>

        {/* Hold timer */}
        <div style={{
          margin: "0 0 16px",
          padding: 14,
          background: "var(--amber-tint)",
          border: "1px solid color-mix(in oklab, var(--amber) 30%, transparent)",
          borderRadius: 12,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Icon name="clock" size={18} style={{ color: "var(--amber)" }} />
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 11.5, color: "var(--amber)", fontWeight: 600, letterSpacing: "0.02em" }}>Slot held for</div>
            <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500, color: "var(--amber)" }}>{formatMS(hold)}</div>
          </div>
          <Button variant="primary" size="sm" onClick={onApproved}>Simulate approval</Button>
        </div>

        {/* Expandable explainer */}
        <button onClick={() => setExpanded(!expanded)} style={{
          width: "100%", textAlign: "left",
          padding: "12px 14px",
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: 10, cursor: "pointer",
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon name="info" size={15} style={{ color: "var(--ink-3)" }} />
          <span style={{ fontSize: 13, fontWeight: 500, flex: 1 }}>What happens next?</span>
          <Icon name={expanded ? "chevronU" : "chevronD"} size={13} style={{ color: "var(--ink-3)" }} />
        </button>
        {expanded && (
          <div style={{
            padding: 14, marginTop: -1,
            background: "var(--surface)",
            border: "1px solid var(--line)",
            borderTop: 0,
            borderBottomLeftRadius: 10, borderBottomRightRadius: 10,
            fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.55,
            textAlign: "left",
          }}>
            <p style={{ margin: 0 }}>
              Once Dr. Okonkwo approves, you'll get an SMS with a live link to your spot.
              You can leave home — we'll text you 5 minutes before it's your turn.
            </p>
            <p style={{ margin: "8px 0 0", color: "var(--ink-3)" }}>
              If you'd rather pick something different, you can release the hold below.
            </p>
          </div>
        )}

        <button onClick={onPickAnother} style={{
          marginTop: 14, background: "transparent", border: 0,
          color: "var(--ink-3)", fontSize: 12.5, cursor: "pointer",
          textDecoration: "underline", textUnderlineOffset: 3,
        }}>
          Release this slot &amp; pick a different one
        </button>
      </div>
    </PhoneFrame>
  );
}

/* ─── #27 Returning visit welcome-back ─── */
function ClientReturningScreen({ onContinue, onBack }) {
  return (
    <PhoneFrame screen="client-returning">
      <div style={{ padding: "24px 20px 40px" }}>
        <button onClick={onBack} style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          background: "transparent", border: 0, padding: 0,
          color: "var(--ink-2)", fontSize: 13, cursor: "pointer", marginBottom: 18,
        }}>
          <Icon name="chevronL" size={14} /> Use a different number
        </button>

        <div style={{
          margin: "0 0 16px",
          padding: 16,
          background: "linear-gradient(180deg, var(--teal-tint), var(--surface-2))",
          border: "1px solid color-mix(in oklab, var(--teal) 20%, transparent)",
          borderRadius: 16,
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <Avatar name="Sarah Mokoena" size={52} />
          <div>
            <div style={{ fontSize: 11.5, color: "var(--teal-ink)", fontWeight: 600, letterSpacing: "0.03em", textTransform: "uppercase" }}>
              Welcome back
            </div>
            <div style={{ fontSize: 19, fontWeight: 500, letterSpacing: "-0.01em", marginTop: 2 }}>
              Sarah Mokoena
            </div>
            <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
              Last visit: 12 March 2026
            </div>
          </div>
        </div>

        <h2 style={{ margin: "20px 0 6px", fontSize: 18, fontWeight: 500, letterSpacing: "-0.015em" }}>
          You've been here 4 times before
        </h2>
        <p style={{ margin: "0 0 16px", fontSize: 13, color: "var(--ink-3)" }}>
          We've kept your details on file. Pick how you'd like to be seen and we'll get you set up.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
          {[
            ["12 Mar 2026", "Dr. Okonkwo · Consult"],
            ["04 Jan 2026", "Dr. Okonkwo · Follow-up"],
            ["27 Sep 2025", "Dr. Dlamini · Consult"],
            ["18 Jun 2025", "Dr. Okonkwo · Consult"],
          ].map(([d, t], i) => (
            <div key={i} style={{
              padding: "10px 12px",
              border: "1px solid var(--line)",
              borderRadius: 10,
              display: "flex", alignItems: "center", gap: 10,
              background: "var(--surface)",
            }}>
              <Icon name="check" size={13} style={{ color: "var(--success)" }} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{t}</div>
                <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)" }}>{d}</div>
              </div>
              <Pill tone="success" style={{ fontSize: 10 }}>Completed</Pill>
            </div>
          ))}
        </div>

        <Button variant="primary" size="lg" full style={{ height: 52 }} onClick={onContinue} iconRight="arrowR">
          Continue to slot picker
        </Button>
      </div>
    </PhoneFrame>
  );
}

/* ─── #28 Rejection / unable-to-fulfill ─── */
function ClientRejectionScreen({ onPickAnother, onCancel }) {
  return (
    <PhoneFrame screen="client-rejected">
      <div style={{ padding: "32px 20px 32px", textAlign: "center" }}>
        <div style={{
          margin: "8px auto 18px",
          width: 76, height: 76, borderRadius: "50%",
          background: "var(--surface-2)",
          color: "var(--ink-3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          border: "1px solid var(--line)",
        }}>
          <Icon name="info" size={28} stroke={1.5} />
        </div>

        <h1 style={{ margin: "0 0 8px", fontSize: 22, fontWeight: 500, letterSpacing: "-0.02em", textWrap: "balance" }}>
          That slot didn't work out
        </h1>
        <p style={{ margin: "0 0 22px", color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.55 }}>
          Dr. Okonkwo couldn't fit you in at 15:00. There are still plenty of other times today and tomorrow.
        </p>

        {/* Their message */}
        <div style={{
          margin: "0 0 22px",
          padding: 14,
          background: "var(--surface-2)",
          border: "1px solid var(--line)",
          borderRadius: 12,
          textAlign: "left",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <Avatar name="Amara Okonkwo" size={26} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>Dr. Amara Okonkwo</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>10:14, today</div>
            </div>
          </div>
          <p style={{
            margin: 0, fontSize: 13, color: "var(--ink-2)", lineHeight: 1.55,
            fontStyle: "italic",
          }}>
            "Sorry Sarah — I'm fully booked this afternoon. I have openings tomorrow
            morning from 09:00 that should work better for an unhurried consult."
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <Button variant="primary" size="lg" full style={{ height: 52 }} onClick={onPickAnother} iconRight="arrowR">
            Pick a different slot
          </Button>
          <Button variant="ghost" full onClick={onCancel}>I'll come back later</Button>
        </div>

        <div style={{
          marginTop: 22, padding: 12,
          background: "var(--teal-tint)", borderRadius: 10,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <Icon name="sparkles" size={14} style={{ color: "var(--teal-ink)" }} />
          <span style={{ fontSize: 12, color: "var(--teal-ink)", textAlign: "left" }}>
            Dr. Dlamini has openings <b>at 14:55, 15:30 and 16:00</b> if you can't wait.
          </span>
        </div>
      </div>
    </PhoneFrame>
  );
}

Object.assign(window, {
  ClientNewDetailsScreen, ClientConfirmationScreen, ClientReturningScreen, ClientRejectionScreen,
});
