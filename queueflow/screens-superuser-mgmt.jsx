// screens-superuser-mgmt.jsx — Super user management pages:
// Org users, Seats & departments, Timeslot types, Client portal links, Analytics
// Each is a "body" view; the sidebar wrapper lives in screens-superuser.jsx.

const { useState: useStateM2, useEffect: useEffectM2, useMemo: useMemoM2 } = React;

/* ═════════════ #11 Org users management ═════════════ */
const ORG_USERS = [
  { id: 1, name: "Amara Okonkwo",  email: "amara@bryanstonfp.co.za",  role: "Org user",   seat: "Consultation room 1", lastActive: "now",       active: true,  status: "active" },
  { id: 2, name: "Sipho Dlamini",   email: "sipho@bryanstonfp.co.za",   role: "Org user",   seat: "Consultation room 2", lastActive: "now",       active: true,  status: "active" },
  { id: 3, name: "Naledi Brown",    email: "naledi@bryanstonfp.co.za",  role: "Org user",   seat: "Dental chair A",      lastActive: "8 min ago",  active: true,  status: "active" },
  { id: 4, name: "Khaya Mthembu",   email: "khaya@bryanstonfp.co.za",   role: "Org user",   seat: "Dental chair B",      lastActive: "23 min ago", active: true,  status: "active" },
  { id: 5, name: "Lerato Smith",    email: "lerato@bryanstonfp.co.za",  role: "Org user",   seat: "Triage desk",         lastActive: "now",       active: true,  status: "active" },
  { id: 6, name: "Kefilwe Nkosi",   email: "kefi@bryanstonfp.co.za",    role: "Super user", seat: "—",                    lastActive: "2 h ago",    active: false, status: "active" },
  { id: 7, name: "Thandi Mbeki",    email: "thandi@bryanstonfp.co.za",  role: "Super user", seat: "—",                    lastActive: "now",       active: true,  status: "owner" },
  { id: 8, name: "Refilwe Tau",     email: "refilwe@bryanstonfp.co.za", role: "Org user",   seat: "—",                    lastActive: "—",         active: false, status: "invited" },
  { id: 9, name: "Mandla Sithole",  email: "mandla@bryanstonfp.co.za",  role: "Org user",   seat: "—",                    lastActive: "4 d ago",    active: false, status: "suspended" },
];

function OrgUsersView() {
  const [q, setQ] = useStateM2("");
  const [tab, setTab] = useStateM2("all");
  const filtered = ORG_USERS.filter(u => {
    if (tab === "active"   && u.status !== "active" && u.status !== "owner") return false;
    if (tab === "invited"  && u.status !== "invited") return false;
    if (tab === "suspended"&& u.status !== "suspended") return false;
    if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  });
  return (
    <>
      <TopBar
        title="Org users"
        subtitle={`${ORG_USERS.length} people across your organization`}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" icon="download">Export</Button>
            <Button variant="primary" icon="plus">Invite new</Button>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 40px" }} className="qf-scroll">
        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <Tabs value={tab} onChange={setTab}
            items={[
              { id: "all",       label: "All",       count: ORG_USERS.length },
              { id: "active",    label: "Active",    count: ORG_USERS.filter(u => u.status === "active" || u.status === "owner").length },
              { id: "invited",   label: "Invited",   count: ORG_USERS.filter(u => u.status === "invited").length },
              { id: "suspended", label: "Suspended", count: ORG_USERS.filter(u => u.status === "suspended").length },
            ]} />
          <span style={{ flex: 1 }} />
          <TextInput icon="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name or email" style={{ width: 240 }} />
        </div>

        <Card style={{ padding: 0, overflow: "hidden" }}>
          <DataGrid
            columns={[
              { key: "name",   label: "Person",      width: "2fr" },
              { key: "role",   label: "Role",        width: "1fr" },
              { key: "seat",   label: "Assigned seat", width: "1.5fr" },
              { key: "last",   label: "Last active", width: "1fr" },
              { key: "status", label: "Status",      width: "1fr" },
              { key: "actions",label: "",            width: "60px" },
            ]}
            rows={filtered.map((u) => ({
              key: u.id,
              name: <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Avatar name={u.name} size={28} active={u.active} />
                <span style={{ minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13, fontWeight: 500 }}>{u.name}</span>
                  <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{u.email}</span>
                </span>
              </span>,
              role: <Pill tone={u.role === "Super user" ? "teal" : "neutral"}>{u.role}</Pill>,
              seat: u.seat === "—"
                ? <span style={{ color: "var(--ink-4)" }}>—</span>
                : <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <Icon name="chair" size={12} style={{ color: "var(--ink-3)" }} />
                    <span style={{ fontSize: 12.5 }}>{u.seat}</span>
                  </span>,
              last: <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{u.lastActive}</span>,
              status: <StatusBadge status={u.status} />,
              actions: <button style={{
                border: 0, background: "transparent", cursor: "pointer",
                color: "var(--ink-3)", padding: 6, borderRadius: 6,
              }}><Icon name="dotsH" size={14} /></button>,
            }))}
          />
        </Card>

        {filtered.length === 0 && <EmptyState icon="users" title="No matches" body={`No users matching "${q}".`} />}
      </div>
    </>
  );
}

function StatusBadge({ status }) {
  const map = {
    active:   { tone: "success", dot: true, label: "Active" },
    owner:    { tone: "teal",    dot: true, label: "Owner" },
    invited:  { tone: "amber",   dot: false, label: "Invited" },
    suspended:{ tone: "coral",   dot: false, label: "Suspended" },
  };
  const m = map[status] || { tone: "neutral", label: status };
  return <Pill tone={m.tone} dot={m.dot}>{m.label}</Pill>;
}

/* ═════════════ #12 Seats & departments management ═════════════ */
const DEPTS = [
  { id: 1, name: "General Practice", count: 4, color: "var(--teal)" },
  { id: 2, name: "Dental",           count: 2, color: "var(--blue)" },
  { id: 3, name: "Pediatrics",       count: 1, color: "var(--amber)" },
];
const SEATS_BY_DEPT = {
  1: [
    { id: 1, name: "Consultation room 1", desc: "Dr. Okonkwo's primary room", claimed: "Amara Okonkwo" },
    { id: 2, name: "Consultation room 2", desc: "",                            claimed: "Sipho Dlamini" },
    { id: 3, name: "Consultation room 3", desc: "Refurbished Q1 2026",         claimed: null },
    { id: 4, name: "Triage desk",         desc: "Reception triage",            claimed: "Lerato Smith" },
  ],
  2: [
    { id: 5, name: "Dental chair A", desc: "Hygiene + general",   claimed: "Naledi Brown" },
    { id: 6, name: "Dental chair B", desc: "Restorative",         claimed: "Khaya Mthembu" },
  ],
  3: [
    { id: 7, name: "Peds room",      desc: "Pediatric wing, quieter", claimed: null },
  ],
};
function SeatsView() {
  const [activeDept, setActiveDept] = useStateM2(1);
  const seats = SEATS_BY_DEPT[activeDept] || [];
  const dept = DEPTS.find(d => d.id === activeDept);
  return (
    <>
      <TopBar
        title="Seats & departments"
        subtitle="Manage your physical and logical resources."
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" icon="plus">Add department</Button>
            <Button variant="primary" icon="plus">Add seat</Button>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: "hidden", padding: "16px 24px 24px", display: "flex", gap: 18, minHeight: 0 }}>
        {/* Left pane */}
        <Card style={{ padding: 0, width: 260, flex: "none", display: "flex", flexDirection: "column", maxHeight: "100%" }}>
          <div style={{
            padding: "12px 14px", borderBottom: "1px solid var(--line)",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 12, fontWeight: 500 }}>Departments</span>
            <Pill tone="neutral" style={{ marginLeft: "auto" }}>{DEPTS.length}</Pill>
          </div>
          <div style={{ padding: 4, overflow: "auto" }} className="qf-scroll">
            {DEPTS.map(d => {
              const sel = activeDept === d.id;
              return (
                <button key={d.id} onClick={() => setActiveDept(d.id)} style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 10px", border: 0,
                  background: sel ? "var(--surface-2)" : "transparent",
                  color: "var(--ink)", cursor: "pointer", borderRadius: 6, textAlign: "left",
                  position: "relative",
                }}>
                  {sel && <span style={{ position: "absolute", left: 0, top: 6, bottom: 6, width: 2, background: "var(--teal)" }} />}
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: d.color }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: sel ? 500 : 400 }}>{d.name}</span>
                  <span style={{ fontSize: 11, color: "var(--ink-3)" }}>{d.count}</span>
                </button>
              );
            })}
          </div>
          <div style={{ padding: 8, borderTop: "1px solid var(--line)" }}>
            <Button variant="ghost" size="sm" icon="plus" full>Add department</Button>
          </div>
        </Card>

        {/* Right pane */}
        <div style={{ flex: 1, minWidth: 0, overflow: "auto" }} className="qf-scroll">
          <div style={{ display: "flex", alignItems: "center", marginBottom: 12, gap: 10 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 500, letterSpacing: "-0.01em" }}>{dept.name}</h2>
            <Pill tone="neutral">{seats.length} seats</Pill>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Drag to reorder</span>
            <span style={{ flex: 1 }} />
            <Button variant="ghost" size="sm" icon="pencil">Rename</Button>
            <Button variant="ghost" size="sm" icon="trash">Delete</Button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 12 }}>
            {seats.map(s => (
              <Card key={s.id} hover style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ color: "var(--ink-4)", cursor: "grab" }}><Icon name="list" size={14} /></span>
                  <span style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "var(--surface-2)", color: "var(--ink-3)",
                    display: "inline-flex", alignItems: "center", justifyContent: "center",
                  }}><Icon name="chair" size={14} /></span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 500 }}>{s.name}</div>
                    {s.desc && <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{s.desc}</div>}
                  </div>
                  <button style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-3)", padding: 6 }}>
                    <Icon name="dotsH" size={14} />
                  </button>
                </div>
                <div style={{ borderTop: "1px solid var(--line)", marginTop: 12, paddingTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  {s.claimed ? <>
                    <Avatar name={s.claimed} size={22} active />
                    <span style={{ fontSize: 12, color: "var(--ink-2)" }}>{s.claimed}</span>
                    <Pill tone="success" style={{ marginLeft: "auto", fontSize: 10 }}>On shift</Pill>
                  </> : <>
                    <span style={{
                      width: 22, height: 22, borderRadius: "50%",
                      border: "1.5px dashed var(--line-2)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center", color: "var(--ink-4)",
                    }}><Icon name="user" size={12} /></span>
                    <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Unclaimed</span>
                  </>}
                </div>
              </Card>
            ))}
            {/* Add tile */}
            <button style={{
              padding: 14, borderRadius: 12,
              border: "1.5px dashed var(--line-2)",
              background: "transparent", cursor: "pointer",
              color: "var(--ink-3)",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              minHeight: 110, fontSize: 13, fontWeight: 500,
            }}><Icon name="plus" size={14} /> Add seat to {dept.name}</button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═════════════ #13 Timeslot types management ═════════════ */
const TIMESLOT_ROWS = [
  { id: 1, name: "Consult",        duration: 30, color: "#0f6e56", usedBy: 5, default: true },
  { id: 2, name: "Follow-up",      duration: 15, color: "#2a6fcc", usedBy: 5, default: true },
  { id: 3, name: "Triage",         duration: 10, color: "#b6791f", usedBy: 1, default: false },
  { id: 4, name: "Extended consult", duration: 45, color: "#7341a8", usedBy: 2, default: false },
  { id: 5, name: "Vaccination",    duration: 10, color: "#1f8a5b", usedBy: 3, default: false },
  { id: 6, name: "Dental cleaning", duration: 60, color: "#7a8336", usedBy: 2, default: false },
];

function TimeslotsView() {
  return (
    <>
      <TopBar
        title="Timeslot types"
        subtitle="Configure the services clients can book."
        right={
          <Button variant="primary" icon="plus">Add timeslot type</Button>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 40px" }} className="qf-scroll">
        <Card style={{ padding: 0 }}>
          <DataGrid
            columns={[
              { key: "swatch",   label: "",         width: "44px" },
              { key: "name",     label: "Name",     width: "2fr" },
              { key: "duration", label: "Duration", width: "1fr" },
              { key: "usedBy",   label: "Used by",  width: "1.4fr" },
              { key: "default",  label: "Default",  width: "1fr" },
              { key: "actions",  label: "",         width: "100px" },
            ]}
            rows={TIMESLOT_ROWS.map(r => ({
              key: r.id,
              swatch: <span style={{
                width: 24, height: 24, borderRadius: 6, background: r.color,
                display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff",
              }}><Icon name="clock" size={11} /></span>,
              name: <span style={{ fontSize: 13.5, fontWeight: 500 }}>{r.name}</span>,
              duration: <span className="mono tnum" style={{ fontSize: 13 }}>{r.duration} min</span>,
              usedBy: <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex" }}>
                  {Array.from({ length: Math.min(r.usedBy, 4) }).map((_, i) => (
                    <Avatar key={i} name={["A", "B", "C", "D"][i] + " Person"} size={20} style={{ marginLeft: i ? -6 : 0, border: "2px solid var(--surface)" }} />
                  ))}
                </span>
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{r.usedBy} org user{r.usedBy !== 1 ? "s" : ""}</span>
              </span>,
              default: r.default ? <Pill tone="teal">Org default</Pill> : <span style={{ color: "var(--ink-4)", fontSize: 12 }}>—</span>,
              actions: <div style={{ display: "flex", gap: 4 }}>
                <button style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-3)", padding: 6 }}><Icon name="pencil" size={14} /></button>
                <button style={{ border: 0, background: "transparent", cursor: "pointer", color: "var(--ink-3)", padding: 6 }}><Icon name="trash" size={14} /></button>
              </div>,
            }))}
          />
        </Card>
      </div>
    </>
  );
}

/* ═════════════ #14 Client portal links ═════════════ */
const LINKS = [
  { id: 1, name: "Main entrance QR",        url: "queueflow.io/q/bryanstonfp",            scope: "Whole org",                  created: "12 Feb 2026", scans: 1842 },
  { id: 2, name: "Reception desk handout",  url: "queueflow.io/q/bryanstonfp?l=reception",scope: "Whole org",                  created: "14 Feb 2026", scans: 612 },
  { id: 3, name: "Dental waiting area",     url: "queueflow.io/q/bryanstonfp/dental",     scope: "Department · Dental",        created: "03 Mar 2026", scans: 287 },
  { id: 4, name: "Triage walk-in poster",   url: "queueflow.io/q/bryanstonfp/triage",     scope: "Seat · Triage desk",         created: "21 Apr 2026", scans: 96 },
  { id: 5, name: "Pediatrics referral card",url: "queueflow.io/q/bryanstonfp/peds",       scope: "Department · Pediatrics",    created: "08 May 2026", scans: 11 },
];

function ClientLinksView() {
  const [showModal, setShowModal] = useStateM2(false);
  const [scope, setScope] = useStateM2("Whole org");

  return (
    <>
      <TopBar
        title="Client portal links"
        subtitle="QR codes and shareable URLs for joining your queue."
        right={
          <Button variant="primary" icon="plus" onClick={() => setShowModal(true)}>Generate new link</Button>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 40px" }} className="qf-scroll">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 12 }}>
          {LINKS.map(l => (
            <Card key={l.id} hover style={{ padding: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <QRPlaceholder size={72} seed={l.url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{l.name}</div>
                  <div className="mono" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2, lineHeight: 1.4, wordBreak: "break-all" }}>
                    {l.url}
                  </div>
                  <Pill tone="neutral" style={{ marginTop: 8 }}>{l.scope}</Pill>
                </div>
              </div>
              <div style={{
                marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--line)",
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <span className="tnum" style={{ fontSize: 13, fontWeight: 500 }}>{l.scans.toLocaleString()}</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>scans</span>
                <span style={{ fontSize: 11.5, color: "var(--ink-4)", marginLeft: 4 }}>· {l.created}</span>
                <span style={{ flex: 1 }} />
                <Button variant="ghost" size="sm" icon="copy">Copy</Button>
                <Button variant="ghost" size="sm" icon="download">QR</Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Generate a new link"
        footer={<>
          <Button variant="ghost" onClick={() => setShowModal(false)}>Cancel</Button>
          <Button variant="primary" icon="link" onClick={() => setShowModal(false)}>Generate link</Button>
        </>}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <Field label="Link name" hint="Where will you post this?">
            <TextInput defaultValue="Side entrance QR" />
          </Field>
          <Field label="Scope">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {["Whole org", "Department", "Specific seat"].map(o => (
                <button key={o} onClick={() => setScope(o)} style={{
                  padding: "10px 12px",
                  background: scope === o ? "var(--teal-tint)" : "var(--surface)",
                  border: `1px solid ${scope === o ? "var(--teal)" : "var(--line-2)"}`,
                  borderRadius: 8, cursor: "pointer", textAlign: "left",
                  fontSize: 12.5, fontWeight: 500,
                  color: scope === o ? "var(--teal-ink)" : "var(--ink)",
                }}>{o}</button>
              ))}
            </div>
          </Field>
          {scope === "Department" && (
            <Field label="Department">
              <Select defaultValue="General Practice" options={["General Practice", "Dental", "Pediatrics"]} />
            </Field>
          )}
          {scope === "Specific seat" && (
            <Field label="Seat">
              <Select defaultValue="Triage desk" options={["Triage desk", "Consultation room 1", "Dental chair A"]} />
            </Field>
          )}
        </div>
      </Modal>
    </>
  );
}

/* ═════════════ #15 Analytics ═════════════ */
const BOOKINGS_30D = [62, 71, 68, 84, 78, 92, 88, 74, 80, 96, 102, 89, 95, 100, 87, 84, 110, 105, 98, 112, 108, 99, 116, 121, 104, 95, 108, 102, 118, 87];
const WAIT_BY_DEPT = [
  { name: "General Practice", min: 24 },
  { name: "Dental",           min: 18 },
  { name: "Pediatrics",       min: 31 },
  { name: "Triage",           min: 12 },
];
const SEAT_UTIL = [
  { name: "Consultation room 1", util: 84 },
  { name: "Consultation room 2", util: 78 },
  { name: "Consultation room 3", util: 22 },
  { name: "Dental chair A",      util: 91 },
  { name: "Dental chair B",      util: 67 },
  { name: "Triage desk",         util: 73 },
  { name: "Peds room",           util: 14 },
];

function AnalyticsView() {
  return (
    <>
      <TopBar
        title="Analytics"
        subtitle="The last 30 days"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Select defaultValue="Last 30 days" options={["Today", "Last 7 days", "Last 30 days", "Last 90 days", "This year"]} />
            <Button variant="secondary" icon="download">Export</Button>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 40px" }} className="qf-scroll">
        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
          <Kpi label="Bookings" value="2,831" sub="+18% vs prev" hint="30d" />
          <Kpi label="Avg wait" value="24" sub="min" hint="30d" />
          <Kpi label="Seat utilization" value="62" sub="%" hint="avg across seats" />
          <Kpi label="No-show rate" value="6.2" sub="%" hint="↓ 1.1pp" tone="success" />
        </div>

        {/* Bookings per day */}
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 14 }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, letterSpacing: "-0.005em" }}>Bookings per day</h3>
            <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Last 30 days</span>
            <span style={{ flex: 1 }} />
            <Legend items={[{ label: "Bookings", color: "var(--teal)" }, { label: "7-day avg", color: "var(--ink-3)", dashed: true }]} />
          </div>
          <LineChart data={BOOKINGS_30D} height={180} />
        </Card>

        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.4fr", gap: 16 }}>
          {/* Avg wait by dept */}
          <Card style={{ padding: 18 }}>
            <h3 style={{ margin: "0 0 14px", fontSize: 14, fontWeight: 600 }}>Avg wait by department</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {WAIT_BY_DEPT.map(d => (
                <div key={d.name}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{d.name}</span>
                    <span className="mono tnum" style={{ fontSize: 12.5, fontWeight: 500 }}>{d.min} min</span>
                  </div>
                  <Bar value={d.min} max={40} />
                </div>
              ))}
            </div>
          </Card>

          {/* Seat utilization */}
          <Card style={{ padding: 0 }}>
            <div style={{ padding: "14px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 10 }}>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Seat utilization</h3>
              <span style={{ fontSize: 12, color: "var(--ink-3)" }}>% of available hours with an active session</span>
            </div>
            <DataGrid
              columns={[
                { key: "name", label: "Seat",        width: "1.4fr" },
                { key: "bar",  label: "",            width: "1.6fr" },
                { key: "val",  label: "",            width: "70px" },
              ]}
              rows={SEAT_UTIL.map(s => ({
                key: s.name,
                name: <span style={{ fontSize: 12.5 }}>{s.name}</span>,
                bar: <Bar value={s.util} max={100} tone={s.util < 30 ? "coral" : s.util > 85 ? "amber" : "teal"} />,
                val: <span className="tnum" style={{ fontSize: 12.5, fontWeight: 500, textAlign: "right", display: "block" }}>{s.util}%</span>,
              }))}
            />
          </Card>
        </div>
      </div>
    </>
  );
}

/* ─────────── Small chart primitives ─────────── */
function LineChart({ data, height = 160 }) {
  const w = 800, h = height;
  const pad = { l: 30, r: 12, t: 8, b: 24 };
  const max = Math.max(...data) * 1.15;
  const min = 0;
  const sx = (i) => pad.l + (i / (data.length - 1)) * (w - pad.l - pad.r);
  const sy = (v) => pad.t + (1 - (v - min) / (max - min)) * (h - pad.t - pad.b);
  // Smoothed 7-day average
  const avg = data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - 6), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });
  const linePath = data.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ");
  const avgPath  = avg.map((v, i) => `${i === 0 ? "M" : "L"}${sx(i)},${sy(v)}`).join(" ");
  const area = `${linePath} L${sx(data.length - 1)},${h - pad.b} L${sx(0)},${h - pad.b} Z`;
  const yTicks = [0, 0.5, 1].map(p => p * max);
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs>
        <linearGradient id="qfLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid */}
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={w - pad.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" strokeDasharray="2,3" />
          <text x={pad.l - 6} y={sy(v) + 3} fontSize="10" fill="var(--ink-4)" textAnchor="end" fontFamily="var(--font-mono)">{Math.round(v)}</text>
        </g>
      ))}
      <path d={area} fill="url(#qfLineFill)" />
      <path d={linePath} stroke="var(--teal)" strokeWidth="1.75" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={avgPath}  stroke="var(--ink-3)" strokeWidth="1.25" fill="none" strokeDasharray="4,3" />
      {/* x labels */}
      {[0, 7, 14, 21, 29].map(i => (
        <text key={i} x={sx(i)} y={h - 8} fontSize="10" fill="var(--ink-4)" textAnchor="middle" fontFamily="var(--font-mono)">
          {`-${29 - i}d`}
        </text>
      ))}
    </svg>
  );
}
function Bar({ value, max, tone = "teal" }) {
  const color = tone === "coral" ? "var(--coral)" : tone === "amber" ? "var(--amber)" : "var(--teal)";
  return (
    <div style={{ height: 8, background: "var(--surface-2)", borderRadius: 4, overflow: "hidden" }}>
      <div style={{ width: `${Math.min(100, (value / max) * 100)}%`, height: "100%", background: color, borderRadius: 4, transition: "width .3s" }} />
    </div>
  );
}
function Legend({ items }) {
  return (
    <div style={{ display: "flex", gap: 12 }}>
      {items.map(it => (
        <span key={it.label} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11.5, color: "var(--ink-3)" }}>
          <span style={{
            width: 12, height: 0,
            borderTop: `2px ${it.dashed ? "dashed" : "solid"} ${it.color}`,
          }} />
          {it.label}
        </span>
      ))}
    </div>
  );
}

/* ─────────── Reusable bits ─────────── */
function Tabs({ value, onChange, items }) {
  return (
    <div style={{ display: "flex", gap: 2, background: "var(--surface-2)", padding: 3, borderRadius: 8, border: "1px solid var(--line)" }}>
      {items.map(it => {
        const sel = value === it.id;
        return (
          <button key={it.id} onClick={() => onChange(it.id)} style={{
            padding: "5px 10px", border: 0, borderRadius: 6,
            background: sel ? "var(--surface)" : "transparent",
            color: sel ? "var(--ink)" : "var(--ink-3)",
            fontSize: 12.5, fontWeight: 500, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 6,
            boxShadow: sel ? "var(--shadow-sm)" : "none",
          }}>
            {it.label}
            {it.count != null && <span style={{
              fontSize: 10.5, color: "var(--ink-3)",
              background: sel ? "var(--surface-2)" : "transparent",
              borderRadius: 4, padding: "0 4px",
            }} className="tnum">{it.count}</span>}
          </button>
        );
      })}
    </div>
  );
}

function DataGrid({ columns, rows }) {
  const gridTemplate = columns.map(c => c.width).join(" ");
  return (
    <div>
      <div style={{
        display: "grid", gridTemplateColumns: gridTemplate, gap: 0,
        padding: "10px 16px", borderBottom: "1px solid var(--line)",
        background: "var(--surface-2)",
        fontSize: 11, color: "var(--ink-3)", fontWeight: 600,
        textTransform: "uppercase", letterSpacing: "0.05em",
      }}>
        {columns.map(c => <div key={c.key}>{c.label}</div>)}
      </div>
      <div>
        {rows.map((r, i) => (
          <div key={r.key} style={{
            display: "grid", gridTemplateColumns: gridTemplate, gap: 0,
            padding: "12px 16px",
            borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none",
            alignItems: "center",
            transition: "background .1s",
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = "var(--surface-2)"}
          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
          >
            {columns.map(c => <div key={c.key} style={{ minWidth: 0 }}>{r[c.key]}</div>)}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ icon = "users", title, body, action, style }) {
  return (
    <div style={{
      padding: "48px 24px", textAlign: "center",
      color: "var(--ink-3)", ...style,
    }}>
      <span style={{
        width: 48, height: 48, borderRadius: 12,
        background: "var(--surface-2)", color: "var(--ink-3)",
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 14,
      }}><Icon name={icon} size={20} /></span>
      <h3 style={{ margin: "0 0 6px", fontSize: 15, fontWeight: 500, color: "var(--ink)" }}>{title}</h3>
      <p style={{ margin: 0, fontSize: 13, color: "var(--ink-3)", maxWidth: 320, marginInline: "auto" }}>{body}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

Object.assign(window, {
  OrgUsersView, SeatsView, TimeslotsView, ClientLinksView, AnalyticsView,
  Tabs, DataGrid, EmptyState, StatusBadge, Bar,
});
