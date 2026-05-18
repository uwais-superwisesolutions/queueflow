// screens-marketing.jsx — Public-facing screens
// Landing, Sign up, Login. Auth screens share a centered-card layout.

const { useState: useStateM, useEffect: useEffectM } = React;

/* ───────────────────────────── Landing ───────────────────────────── */
function LandingScreen({ onCta, onSignIn }) {
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)",
      color: "var(--ink)",
    }}>
      {/* Top nav */}
      <header style={{
        maxWidth: 1240, margin: "0 auto",
        padding: "22px 32px",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <QFLogo size={20} />
        <nav style={{ display: "flex", gap: 22, marginLeft: 24, fontSize: 13.5, color: "var(--ink-2)" }}>
          <a style={{ cursor: "pointer" }}>Product</a>
          <a style={{ cursor: "pointer" }}>How it works</a>
          <a style={{ cursor: "pointer" }}>Pricing</a>
          <a style={{ cursor: "pointer" }}>Customers</a>
        </nav>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8, alignItems: "center" }}>
          <Button variant="ghost" size="sm" onClick={onSignIn}>Sign in</Button>
          <Button variant="primary" size="sm" onClick={onCta} iconRight="arrowR">Start free trial</Button>
        </div>
      </header>

      {/* Hero */}
      <section style={{
        maxWidth: 1240, margin: "0 auto",
        padding: "40px 32px 64px",
        display: "grid",
        gridTemplateColumns: "1.05fr 1fr",
        gap: 56,
        alignItems: "center",
      }}>
        <div>
          <Pill tone="teal" icon="sparkles" style={{ marginBottom: 22 }}>
            Now in private beta — 14 clinics live
          </Pill>
          <h1 style={{
            margin: 0, fontSize: 56, lineHeight: 1.04,
            fontWeight: 500, letterSpacing: "-0.035em",
            textWrap: "balance",
          }}>
            Replace your token machine<br />
            with a link.
          </h1>
          <p style={{
            margin: "20px 0 0", fontSize: 17, lineHeight: 1.55,
            color: "var(--ink-2)", maxWidth: 480, textWrap: "pretty",
          }}>
            QueueFlow takes the waiting room online. Clients join from their phone,
            staff manage live queues from any device, and everyone gets notified the
            moment things change — so nobody waits longer than they have to.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 28, alignItems: "center" }}>
            <Button variant="primary" size="lg" onClick={onCta} iconRight="arrowR">Start your free trial</Button>
            <Button variant="ghost" size="lg" icon="play">Watch the 2-min tour</Button>
          </div>
          <div style={{ display: "flex", gap: 18, marginTop: 22, color: "var(--ink-3)", fontSize: 12.5 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={13} style={{ color: "var(--teal)" }} /> No credit card
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={13} style={{ color: "var(--teal)" }} /> Set up in 10 minutes
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <Icon name="check" size={13} style={{ color: "var(--teal)" }} /> POPIA-aligned
            </span>
          </div>
        </div>

        {/* Hero illustration — a stylized live-queue card */}
        <HeroQueuePreview />
      </section>

      {/* Social proof strip */}
      <section style={{
        borderTop: "1px solid var(--line)",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
      }}>
        <div style={{
          maxWidth: 1240, margin: "0 auto",
          padding: "22px 32px",
          display: "flex", alignItems: "center", gap: 28,
        }}>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Trusted by clinics
          </div>
          <div style={{ flex: 1, display: "flex", gap: 36, color: "var(--ink-3)", flexWrap: "wrap", alignItems: "center" }}>
            {["Bryanston Family", "Linksfield Dental", "Rosebank Pediatric", "Cape Quay Health", "Sandton Skin Clinic", "Mowbray GP"]
              .map((c) => (
                <span key={c} style={{ fontSize: 14.5, fontWeight: 500, color: "var(--ink-2)", letterSpacing: "-0.01em" }}>{c}</span>
              ))}
          </div>
        </div>
      </section>

      {/* Three feature blocks */}
      <section style={{
        maxWidth: 1240, margin: "0 auto",
        padding: "72px 32px 40px",
      }}>
        <div style={{ textAlign: "center", maxWidth: 640, margin: "0 auto 40px" }}>
          <Pill tone="neutral" style={{ marginBottom: 14 }}>How it works</Pill>
          <h2 style={{ margin: 0, fontSize: 32, fontWeight: 500, letterSpacing: "-0.025em" }}>
            Three small changes. One quieter waiting room.
          </h2>
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16,
        }}>
          <FeatureCard
            n="01" title="Online booking"
            body="Share one link, or a printed QR at reception. Clients pick a time that suits them — or join the next-available queue."
            icon="link"
          />
          <FeatureCard
            n="02" title="Live queue"
            body="Staff see who's pending approval, who's checked in, and who's next — from any device. State changes sync in real time."
            icon="users"
          />
          <FeatureCard
            n="03" title="Proactive alerts"
            body="When a consult runs long, downstream clients get an SMS before they leave home. Less frustration, fewer no-shows."
            icon="bell"
          />
        </div>
      </section>

      {/* Pricing teaser */}
      <section style={{
        maxWidth: 1240, margin: "0 auto",
        padding: "32px 32px 80px",
      }}>
        <Card style={{
          padding: 0, overflow: "hidden",
          background: "var(--surface)",
          borderColor: "var(--line-2)",
        }}>
          <div style={{
            display: "grid", gridTemplateColumns: "1.2fr 1fr",
          }}>
            <div style={{ padding: "36px 40px" }}>
              <Pill tone="teal">Free trial</Pill>
              <h3 style={{ margin: "14px 0 8px", fontSize: 26, fontWeight: 500, letterSpacing: "-0.02em" }}>
                14 days free, then R&nbsp;490 per seat per month.
              </h3>
              <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 14.5, maxWidth: 440 }}>
                Pay for the seats you fill. Add departments, devices, and client portal
                links at no extra cost. Annual plans save 20%.
              </p>
              <div style={{ marginTop: 24, display: "flex", gap: 10 }}>
                <Button variant="primary" onClick={onCta} iconRight="arrowR">Start your free trial</Button>
                <Button variant="ghost">See pricing details</Button>
              </div>
            </div>
            <div style={{
              borderLeft: "1px solid var(--line)",
              background: "var(--surface-2)",
              padding: 32,
              display: "flex", flexDirection: "column", justifyContent: "center", gap: 14,
            }}>
              {[
                ["Unlimited departments & seats", null],
                ["Unlimited client portal links", null],
                ["Real-time queue routing", null],
                ["Proactive SMS alerts", "1,000 / mo included"],
                ["Analytics & utilization reports", null],
              ].map(([k, v], i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
                  <Icon name="check" size={14} style={{ color: "var(--teal)" }} />
                  <span style={{ flex: 1, color: "var(--ink)" }}>{k}</span>
                  {v && <span style={{ color: "var(--ink-3)", fontSize: 12 }}>{v}</span>}
                </div>
              ))}
            </div>
          </div>
        </Card>
      </section>

      {/* Footer */}
      <footer style={{
        borderTop: "1px solid var(--line)",
        padding: "22px 32px",
      }}>
        <div style={{
          maxWidth: 1240, margin: "0 auto",
          display: "flex", alignItems: "center", gap: 16,
          color: "var(--ink-3)", fontSize: 12,
        }}>
          <QFLogo size={14} />
          <span>© 2026 QueueFlow</span>
          <span style={{ flex: 1 }} />
          <a style={{ cursor: "pointer" }}>Privacy</a>
          <a style={{ cursor: "pointer" }}>Terms</a>
          <a style={{ cursor: "pointer" }}>Status</a>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ n, title, body, icon }) {
  return (
    <Card style={{ padding: 24, height: "100%" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 8,
          background: "var(--teal-tint)", color: "var(--teal-ink)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name={icon} size={16} stroke={1.75} />
        </span>
        <span className="mono" style={{ fontSize: 11, color: "var(--ink-4)", letterSpacing: "0.04em" }}>{n}</span>
      </div>
      <h3 style={{ margin: "16px 0 6px", fontSize: 18, fontWeight: 500, letterSpacing: "-0.015em" }}>{title}</h3>
      <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13.5, lineHeight: 1.55 }}>{body}</p>
    </Card>
  );
}

function HeroQueuePreview() {
  // animated mini queue, demonstrating the product visually without screenshotting it
  const [tick, setTick] = useStateM(0);
  useEffectM(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = 4 * 60 + 23 + tick; // base 4:23, ticks up
  return (
    <div style={{ position: "relative" }}>
      {/* Background shape */}
      <div style={{
        position: "absolute", inset: -20, zIndex: 0,
        background: "radial-gradient(ellipse at 60% 40%, var(--teal-tint), transparent 60%)",
        borderRadius: 24,
      }} />
      <Card style={{
        position: "relative", zIndex: 1,
        padding: 0, overflow: "hidden",
        boxShadow: "var(--shadow-lg)",
      }}>
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex", alignItems: "center", gap: 10,
          background: "var(--surface)",
        }}>
          <Avatar name="Amara Okonkwo" size={26} active />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Dr. Amara Okonkwo</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Room 3 · General Practice</div>
          </div>
          <Pill tone="success" dot>On shift</Pill>
        </div>
        {/* In service */}
        <div style={{ padding: "16px 16px 12px" }}>
          <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginBottom: 8 }}>
            In service now
          </div>
          <div style={{
            padding: 12, borderRadius: 10,
            background: "var(--blue-tint)",
            border: "1px solid color-mix(in oklab, var(--blue) 25%, transparent)",
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <Avatar name="Sarah Mokoena" size={36} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 500 }}>Sarah Mokoena</div>
              <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>Consult — 30 min · started 14:23</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div className="mono tnum" style={{ fontSize: 18, fontWeight: 500, color: "var(--blue)" }}>{formatMS(elapsed)}</div>
              <div style={{ fontSize: 10, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em" }}>elapsed</div>
            </div>
          </div>
        </div>
        {/* Up next */}
        <div style={{ padding: "0 16px 16px" }}>
          <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, margin: "6px 0 8px" }}>
            Up next
          </div>
          {[
            ["Jabu Khumalo", "Follow-up · 15 min", "14:55"],
            ["Lerato Dube", "Consult · 30 min", "15:10"],
            ["Michael van der Berg", "Consult · 30 min", "15:40"],
          ].map(([n, t, time]) => (
            <div key={n} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 4px",
              borderTop: "1px solid var(--line)",
            }}>
              <Avatar name={n} size={26} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>{n}</div>
                <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{t}</div>
              </div>
              <div className="mono tnum" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{time}</div>
            </div>
          ))}
        </div>
        {/* Live footer */}
        <div style={{
          borderTop: "1px solid var(--line)",
          padding: "10px 16px",
          background: "var(--surface-2)",
          display: "flex", alignItems: "center", gap: 8,
          fontSize: 11.5, color: "var(--ink-3)",
        }}>
          <span className="qf-live-dot" />
          Live · 23 in queue · synced just now
        </div>
      </Card>
    </div>
  );
}

/* ───────────────────────────── Auth: Sign up ───────────────────────────── */
function AuthCard({ children, footer, width = 440 }) {
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 20px",
    }}>
      <div style={{ width: "100%", maxWidth: width }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 26 }}>
          <QFLogo size={20} />
        </div>
        <Card style={{ padding: 28 }}>
          {children}
        </Card>
        {footer && (
          <div style={{ textAlign: "center", marginTop: 18, fontSize: 13, color: "var(--ink-3)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

function SignUpScreen({ onSubmit, onSignIn }) {
  const [form, setForm] = useStateM({
    name: "Thandi Mbeki",
    email: "thandi@bryanstonfp.co.za",
    password: "",
    industry: "Healthcare",
    org: "Bryanston Family Practice",
  });
  const set = (k) => (e) => setForm({ ...form, [k]: typeof e === "string" ? e : e.target.value });

  return (
    <AuthCard footer={<>Already have an account? <a onClick={onSignIn} style={{ color: "var(--teal-ink)", cursor: "pointer", fontWeight: 500 }}>Sign in</a></>}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>Start your free trial</h2>
      <p style={{ margin: "0 0 22px", color: "var(--ink-3)", fontSize: 13.5 }}>
        14 days free. No card required.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Full name">
          <TextInput value={form.name} onChange={set("name")} placeholder="Your name" />
        </Field>
        <Field label="Work email" hint="We'll use this for your login.">
          <TextInput value={form.email} onChange={set("email")} placeholder="name@clinic.com" icon="send" />
        </Field>
        <Field label="Password" hint="At least 10 characters.">
          <TextInput type="password" value={form.password} onChange={set("password")} placeholder="••••••••••" />
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <Field label="Industry">
            <Select value={form.industry} onChange={set("industry")} options={["Healthcare", "Dental", "Salon / Spa", "Government", "Veterinary", "Other"]} />
          </Field>
          <Field label="Organization">
            <TextInput value={form.org} onChange={set("org")} />
          </Field>
        </div>
        <Button variant="primary" size="lg" full onClick={onSubmit} iconRight="arrowR" style={{ marginTop: 6 }}>
          Create account
        </Button>
      </div>
      <p style={{ margin: "18px 0 0", fontSize: 11.5, color: "var(--ink-4)", textAlign: "center", lineHeight: 1.5 }}>
        By continuing you agree to our Terms and Privacy Policy.
      </p>
    </AuthCard>
  );
}

function LoginScreen({ onSubmit, onSignUp }) {
  return (
    <AuthCard footer={<>New here? <a onClick={onSignUp} style={{ color: "var(--teal-ink)", cursor: "pointer", fontWeight: 500 }}>Start a free trial</a></>}>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>Welcome back</h2>
      <p style={{ margin: "0 0 22px", color: "var(--ink-3)", fontSize: 13.5 }}>
        Sign in to your QueueFlow account.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Email">
          <TextInput defaultValue="amara@bryanstonfp.co.za" />
        </Field>
        <Field label="Password">
          <TextInput type="password" defaultValue="••••••••••" />
        </Field>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <label style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12.5, color: "var(--ink-2)" }}>
            <input type="checkbox" defaultChecked /> Remember me on this device
          </label>
          <a style={{ fontSize: 12.5, color: "var(--teal-ink)", cursor: "pointer" }}>Forgot password</a>
        </div>
        <Button variant="primary" size="lg" full onClick={onSubmit} iconRight="arrowR">Sign in</Button>
      </div>
    </AuthCard>
  );
}

/* ──────────── Accept invite (org user) #9 ──────────── */
function AcceptInviteScreen({ onSubmit }) {
  return (
    <AuthCard width={460}>
      <div style={{
        margin: "0 auto 16px", width: 64, height: 64, borderRadius: 16,
        background: "var(--teal-tint)", color: "var(--teal-ink)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <Icon name="send" size={26} />
      </div>
      <h2 style={{ margin: "0 0 6px", fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em", textAlign: "center" }}>
        You've been invited to QueueFlow
      </h2>
      <p style={{ margin: "0 0 18px", color: "var(--ink-3)", fontSize: 13.5, textAlign: "center", lineHeight: 1.55 }}>
        <span style={{ color: "var(--ink-2)" }}>Thandi Mbeki</span> invited you to join
        {" "}<b style={{ color: "var(--ink)" }}>Bryanston Family Practice</b>{" "}
        as a Consultant.
      </p>

      <div style={{
        padding: "10px 12px", marginBottom: 18,
        background: "var(--surface-2)", borderRadius: 8,
        display: "flex", alignItems: "center", gap: 10,
        border: "1px solid var(--line)",
      }}>
        <Avatar name="Sipho Dlamini" size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>Sipho Dlamini</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>sipho@bryanstonfp.co.za · Org user</div>
        </div>
        <Pill tone="amber">Pending</Pill>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <Field label="Set a password" hint="At least 10 characters, mixing letters and numbers.">
          <TextInput type="password" placeholder="••••••••••" />
        </Field>
        <Field label="Confirm password">
          <TextInput type="password" placeholder="••••••••••" />
        </Field>
        <Button variant="primary" size="lg" full onClick={onSubmit} iconRight="arrowR" style={{ marginTop: 4 }}>
          Accept invite &amp; sign in
        </Button>
      </div>
      <p style={{ margin: "16px 0 0", fontSize: 11.5, color: "var(--ink-4)", textAlign: "center" }}>
        You'll be asked to claim a seat to start your first shift.
      </p>
    </AuthCard>
  );
}

Object.assign(window, { LandingScreen, SignUpScreen, LoginScreen, AcceptInviteScreen });
