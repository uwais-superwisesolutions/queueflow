// screens-superuser.jsx — Super user dashboard home (#10)

const { useState: useStateS, useEffect: useEffectS } = React;

const SU_NAV = [
  { id: "dashboard",  label: "Dashboard",          icon: "grid" },
  { id: "queues",     label: "Queues",             icon: "users", count: 23 },
  { id: "orgusers",   label: "Org users",          icon: "users" },
  { id: "seats",      label: "Seats & departments",icon: "chair" },
  { id: "timeslots",  label: "Timeslot types",     icon: "clock" },
  { id: "links",      label: "Client portal links",icon: "link" },
  { id: "analytics",  label: "Analytics",          icon: "zap" },
  { heading: "Workspace" },
  { id: "settings",   label: "Settings",           icon: "settings" },
  { id: "billing",    label: "Billing",            icon: "shield" },
];

/* Fake seat + activity data for the dashboard */
const DASH_SEATS = [
  { id: 1, name: "Consultation room 1", dept: "General Practice", user: "Amara Okonkwo", role: "Doctor", active: true, queue: 5, serving: "Sarah Mokoena" },
  { id: 2, name: "Consultation room 2", dept: "General Practice", user: "Sipho Dlamini", role: "Doctor", active: true, queue: 3, serving: "Jabu Khumalo" },
  { id: 3, name: "Consultation room 3", dept: "General Practice", user: null, role: null, active: false, queue: 4, serving: null, alert: true },
  { id: 4, name: "Dental chair A",      dept: "Dental",           user: "Naledi Brown", role: "Dentist", active: true, queue: 2, serving: "Michael v.d. Berg" },
  { id: 5, name: "Dental chair B",      dept: "Dental",           user: "Khaya Mthembu",role: "Dentist", active: true, queue: 1, serving: null, alert: false, idle: true },
  { id: 6, name: "Peds room",           dept: "Pediatrics",       user: null, role: null, active: false, queue: 0, serving: null },
  { id: 7, name: "Triage desk",         dept: "General Practice", user: "Lerato Smith",  role: "Nurse",  active: true, queue: 8, serving: "Anwar Pillay" },
];

const FEED = [
  { t: 12,  text: <>Dr. Okonkwo started serving <b>Sarah Mokoena</b></>, kind: "service" },
  { t: 73,  text: <>New booking request for <b>Chair A</b> at 15:10</>, kind: "request" },
  { t: 142, text: <>Triage queue passed 8 — consider adding a seat</>, kind: "alert" },
  { t: 220, text: <>Dr. Dlamini completed appointment with <b>Beth Cele</b></>, kind: "complete" },
  { t: 360, text: <>Sipho Dlamini claimed <b>Consultation room 2</b></>, kind: "session" },
  { t: 480, text: <>Delay alert sent to <b>3 clients</b> in Room 1's queue</>, kind: "alert" },
  { t: 720, text: <>Khaya Mthembu started shift at <b>Dental chair B</b></>, kind: "session" },
];

function SuperUserDashboard({ onLogout, onPersona, initialPage = "dashboard" }) {
  const [active, setActive] = useStateS(initialPage);
  const [now, setNow] = useStateS(0);
  useEffectS(() => {
    const id = setInterval(() => setNow(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 48px)", overflow: "hidden" }}>
      <Sidebar
        items={SU_NAV}
        active={active}
        onSelect={setActive}
        footer={
          <button onClick={() => onPersona?.("orguser-claim")} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            border: 0, background: "transparent", padding: "6px 4px",
            cursor: "pointer", borderRadius: 6, color: "var(--ink-2)", textAlign: "left",
          }}>
            <Avatar name="Thandi Mbeki" size={26} active />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>Thandi Mbeki</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Owner · Super user</div>
            </div>
            <Icon name="dotsH" size={14} style={{ color: "var(--ink-3)" }} />
          </button>
        }
      />

      {/* Main */}
      <main style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column",
        background: "var(--bg)",
        overflow: "hidden",
      }}>
        {active === "dashboard" && <DashboardBody now={now} setActive={setActive} />}
        {active === "orgusers"  && <OrgUsersView />}
        {active === "seats"     && <SeatsView />}
        {active === "timeslots" && <TimeslotsView />}
        {active === "links"     && <ClientLinksView />}
        {active === "analytics" && <AnalyticsView />}
        {active === "queues"    && <QueuesPlaceholder />}
        {active === "settings"  && <SettingsPlaceholder />}
        {active === "billing"   && <BillingPlaceholder />}
      </main>
    </div>
  );
}

function QueuesPlaceholder() {
  return (
    <>
      <TopBar title="Queues" subtitle="All live queues across your org." />
      <div style={{ flex: 1, overflow: "auto", padding: "24px" }} className="qf-scroll">
        <Card style={{ padding: 32, textAlign: "center", color: "var(--ink-3)" }}>
          Org-wide queues view — see the per-seat tiles on the Dashboard.
        </Card>
      </div>
    </>
  );
}
function SettingsPlaceholder() {
  return (
    <>
      <TopBar title="Settings" subtitle="Organization-level configuration." />
      <div style={{ flex: 1, overflow: "auto", padding: "24px", maxWidth: 720 }} className="qf-scroll">
        <Card style={{ padding: 0 }}>
          {[
            ["Organization name", "Bryanston Family Practice"],
            ["Industry", "Healthcare"],
            ["Timezone", "Africa/Johannesburg (UTC+2)"],
            ["Soft-hold duration", "15 minutes"],
            ["Delay-alert threshold", "10 minutes behind schedule"],
            ["SMS sender ID", "BFP Clinic"],
          ].map(([k, v], i, arr) => (
            <div key={k} style={{
              padding: "14px 18px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{k}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{v}</div>
              </div>
              <Button variant="ghost" size="sm" icon="pencil">Edit</Button>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}
function BillingPlaceholder() {
  return (
    <>
      <TopBar title="Billing" subtitle="Plan and seat usage." />
      <div style={{ flex: 1, overflow: "auto", padding: "24px" }} className="qf-scroll">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 800 }}>
          <Card style={{ padding: 20 }}>
            <Pill tone="teal">Trial</Pill>
            <h3 style={{ margin: "10px 0 4px", fontSize: 22, fontWeight: 500 }}>9 days left</h3>
            <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13 }}>Add a card to keep your team running after 27 May.</p>
            <Button variant="primary" style={{ marginTop: 14 }}>Add payment method</Button>
          </Card>
          <Card style={{ padding: 20 }}>
            <div style={{ fontSize: 12, color: "var(--ink-3)" }}>Estimated monthly</div>
            <div className="tnum" style={{ fontSize: 28, fontWeight: 500, marginTop: 4 }}>R 2,940</div>
            <p style={{ margin: "4px 0 14px", fontSize: 12, color: "var(--ink-3)" }}>6 seats × R 490 / month</p>
            <Button variant="secondary" icon="link">Manage subscription</Button>
          </Card>
        </div>
      </div>
    </>
  );
}

function DashboardBody({ now, setActive }) {
  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={<>Tuesday, 18 May · <span className="qf-live-dot" style={{ verticalAlign: "middle", margin: "0 4px" }} /> Live</>}
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Button variant="ghost" icon="bell" />
            <Button variant="secondary" icon="filter">Filter</Button>
            <Button variant="primary" icon="link" onClick={() => setActive("links")}>Get join link</Button>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "20px 24px 40px" }} className="qf-scroll">
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 320px",
            gap: 20, alignItems: "start",
          }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* KPI strip */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                <Kpi label="Active sessions" value="4" sub="/ 7 seats" hint="now" />
                <Kpi label="In queue now" value="23" sub="across all seats" hint="now" />
                <Kpi label="Avg wait today" value="24" sub="min" hint="rolling" />
                <Kpi label="Bookings today" value="87" sub="of 120 capacity" hint="so far" />
              </div>

              {/* Seat cards */}
              <section>
                <div style={{ display: "flex", alignItems: "center", marginBottom: 10, gap: 10 }}>
                  <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>Active seats</h2>
                  <Pill tone="teal" dot>Live</Pill>
                  <span style={{ flex: 1 }} />
                  <Button variant="ghost" size="sm" icon="grid">Grid</Button>
                  <Button variant="ghost" size="sm" icon="list">List</Button>
                </div>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 12,
                }}>
                  {DASH_SEATS.map((s) => <SeatCard key={s.id} seat={s} now={now} />)}
                </div>
              </section>
            </div>

            {/* Right rail */}
            <aside style={{
              position: "sticky", top: 20,
              display: "flex", flexDirection: "column", gap: 14,
            }}>
              <Card style={{ padding: 0 }}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "12px 16px", borderBottom: "1px solid var(--line)",
                }}>
                  <span className="qf-live-dot" />
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>Activity</span>
                  <span style={{ marginLeft: "auto", fontSize: 11.5, color: "var(--ink-3)" }}>Updated just now</span>
                </div>
                <div style={{ maxHeight: 480, overflow: "auto" }} className="qf-scroll">
                  {FEED.map((f, i) => (
                    <div key={i} style={{
                      padding: "10px 16px",
                      display: "flex", gap: 10,
                      borderBottom: i < FEED.length - 1 ? "1px solid var(--line)" : "none",
                    }}>
                      <FeedKind kind={f.kind} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12.5, color: "var(--ink-2)", lineHeight: 1.45 }}>{f.text}</div>
                        <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 2 }}>{agoLabel((f.t + now) * 1000)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                  <Icon name="qr" size={16} style={{ color: "var(--ink-3)" }} />
                  <span style={{ fontSize: 12.5, fontWeight: 500 }}>Main entrance QR</span>
                </div>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <QRPlaceholder size={84} seed="qf-main" />
                  <div>
                    <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-2)", marginBottom: 6, lineHeight: 1.4 }}>
                      queueflow.io/q/bryanston-family-practice
                    </div>
                    <Button variant="ghost" size="sm" icon="copy">Copy link</Button>
                  </div>
                </div>
              </Card>
            </aside>
          </div>
        </div>
    </>
  );
}

function FeedKind({ kind }) {
  const map = {
    service:  { ic: "user",   bg: "var(--blue-tint)",    fg: "var(--blue)" },
    request:  { ic: "bell",   bg: "var(--amber-tint)",   fg: "var(--amber)" },
    alert:    { ic: "alert",  bg: "var(--coral-tint)",   fg: "var(--coral-2)" },
    complete: { ic: "check",  bg: "var(--success-tint)", fg: "var(--success)" },
    session:  { ic: "chair",  bg: "var(--teal-tint)",    fg: "var(--teal-ink)" },
  };
  const m = map[kind] || map.session;
  return (
    <span style={{
      width: 22, height: 22, borderRadius: 6,
      background: m.bg, color: m.fg,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      flex: "none",
    }}>
      <Icon name={m.ic} size={12} />
    </span>
  );
}

function SeatCard({ seat, now }) {
  const unmanned = !seat.active && seat.queue > 0;
  const idle = seat.active && !seat.serving && seat.queue <= 1;

  return (
    <div style={{
      background: "var(--surface)",
      border: `1px solid ${unmanned ? "var(--coral)" : "var(--line)"}`,
      borderRadius: 12, padding: 14,
      boxShadow: unmanned ? "0 0 0 4px var(--coral-tint), var(--shadow-sm)" : "var(--shadow-sm)",
      position: "relative",
      transition: "border-color .15s, box-shadow .15s",
    }}>
      {unmanned && (
        <Pill tone="coral" icon="alert" style={{ position: "absolute", top: 10, right: 10 }}>
          Unmanned
        </Pill>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{
          width: 30, height: 30, borderRadius: 8,
          background: "var(--surface-2)", color: "var(--ink-3)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
        }}><Icon name="chair" size={14} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 500 }}>{seat.name}</div>
          <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{seat.dept}</div>
        </div>
      </div>

      <div style={{
        marginTop: 12, padding: "10px 12px",
        background: "var(--surface-2)",
        border: "1px solid var(--line)",
        borderRadius: 8,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {seat.user ? (
          <>
            <Avatar name={seat.user} size={26} active={seat.active} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500 }}>{seat.user}</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>{seat.role} · {seat.active ? "On shift" : "Off"}</div>
            </div>
            {seat.active && <span className="qf-live-dot" />}
          </>
        ) : (
          <>
            <span style={{
              width: 26, height: 26, borderRadius: "50%",
              border: "1.5px dashed var(--line-2)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              color: "var(--ink-4)",
            }}><Icon name="user" size={13} /></span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink-3)" }}>Unclaimed</div>
              <div style={{ fontSize: 11, color: "var(--ink-4)" }}>Available to claim</div>
            </div>
          </>
        )}
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
        marginTop: 10,
      }}>
        <div>
          <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>In queue</div>
          <div className="tnum" style={{ fontSize: 18, fontWeight: 500, marginTop: 2, color: seat.queue > 5 ? "var(--coral-2)" : "var(--ink)" }}>{seat.queue}</div>
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 600 }}>Now serving</div>
          <div style={{
            fontSize: 13, fontWeight: 500, marginTop: 2,
            color: seat.serving ? "var(--ink)" : "var(--ink-4)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{seat.serving || (idle ? "Waiting…" : "—")}</div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { SuperUserDashboard });
