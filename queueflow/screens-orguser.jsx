// screens-orguser.jsx
// The org user dashboard — three screens:
//   1) Seat claim (#19) — grid of available seats
//   2) Live queue (#16) — THE screen, with state machine
//   3) My availability (#17) — week view
// Both light and dark are handled by the parent (the queue stage flips `.qf-dark`)

const { useState: useStateU, useEffect: useEffectU, useMemo: useMemoU, useRef: useRefU } = React;

const OU_NAV = [
  { id: "queue",        label: "Queue",        icon: "users", count: 8 },
  { id: "availability", label: "My availability", icon: "calendar" },
  { id: "timeconfig",   label: "Time configurations", icon: "clock" },
  { id: "notifications",label: "Notifications", icon: "bell", count: 2 },
  { heading: "Account" },
  { id: "profile",      label: "Profile",      icon: "user" },
];

/* ═════════════════════════════════════════════════════════════════
   1) Seat claim screen
   ═════════════════════════════════════════════════════════════════ */
const CLAIM_SEATS = [
  { id: 1, name: "Consultation room 1", dept: "General Practice", claimedBy: null, mine: true },
  { id: 2, name: "Consultation room 2", dept: "General Practice", claimedBy: "Sipho Dlamini" },
  { id: 3, name: "Consultation room 3", dept: "General Practice", claimedBy: null },
  { id: 4, name: "Dental chair A",      dept: "Dental",           claimedBy: "Naledi Brown" },
  { id: 5, name: "Triage desk",         dept: "General Practice", claimedBy: null },
  { id: 6, name: "Peds room",           dept: "Pediatrics",       claimedBy: null },
];

function OrgUserClaimScreen({ onClaim }) {
  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
    }}>
      <header style={{
        padding: "20px 32px",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        display: "flex", alignItems: "center", gap: 16,
      }}>
        <QFLogo size={18} />
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Bryanston Family Practice</span>
        <span style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name="Amara Okonkwo" size={26} />
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 12.5, fontWeight: 500 }}>Dr. Amara Okonkwo</div>
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Org user · Doctor</div>
          </div>
        </div>
      </header>

      <main style={{
        flex: 1,
        display: "flex", justifyContent: "center",
        padding: "48px 32px",
      }}>
        <div style={{ width: "100%", maxWidth: 880 }}>
          <h1 style={{ margin: "0 0 6px", fontSize: 26, fontWeight: 500, letterSpacing: "-0.025em" }}>
            Good morning, Amara.
          </h1>
          <p style={{ margin: "0 0 28px", color: "var(--ink-3)", fontSize: 15 }}>
            Claim a seat to start your shift. New booking requests will route to whichever seat you're in.
          </p>

          <div style={{
            display: "grid", gap: 12,
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          }}>
            {CLAIM_SEATS.map((s) => {
              const taken = !!s.claimedBy;
              return (
                <button key={s.id}
                  onClick={() => !taken && onClaim(s.name)}
                  disabled={taken}
                  style={{
                    textAlign: "left", border: `1px solid ${s.mine ? "var(--teal)" : "var(--line)"}`,
                    background: taken ? "var(--surface-2)" : "var(--surface)",
                    borderRadius: 12, padding: 16,
                    cursor: taken ? "not-allowed" : "pointer",
                    opacity: taken ? 0.7 : 1,
                    boxShadow: s.mine ? "0 0 0 3px var(--teal-tint)" : "var(--shadow-sm)",
                    transition: "border-color .15s, box-shadow .15s, transform .05s",
                    display: "flex", flexDirection: "column", gap: 10,
                  }}
                  onMouseEnter={(e) => !taken && (e.currentTarget.style.transform = "translateY(-1px)")}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{
                      width: 36, height: 36, borderRadius: 8,
                      background: s.mine ? "var(--teal-tint)" : "var(--surface-2)",
                      color: s.mine ? "var(--teal-ink)" : "var(--ink-3)",
                      display: "inline-flex", alignItems: "center", justifyContent: "center",
                    }}><Icon name="chair" size={18} /></span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 500 }}>{s.name}</div>
                      <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{s.dept}</div>
                    </div>
                    {s.mine && <Pill tone="teal">Default</Pill>}
                  </div>
                  {taken ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <Avatar name={s.claimedBy} size={22} active />
                      <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>Claimed by {s.claimedBy}</span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--teal-ink)", fontSize: 12.5, fontWeight: 500 }}>
                      Claim seat <Icon name="arrowR" size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   2) Live queue — the state machine
   ═════════════════════════════════════════════════════════════════ */

const INITIAL_QUEUE = {
  pending: [
    { id: "p1", name: "Beth Cele",        type: "Consult",   typeColor: "#0f6e56", duration: 30, requestedFor: "15:00", reason: "Persistent cough", phone: "+27 82 414 4521", new: true,  hold: 14 * 60 + 32 },
    { id: "p2", name: "Michael v.d. Berg",type: "Follow-up", typeColor: "#2a6fcc", duration: 15, requestedFor: "15:15", reason: "Blood pressure review", phone: "+27 73 661 2003", new: false, hold: 12 * 60 + 8 },
  ],
  inService: {
    id: "s1", name: "Sarah Mokoena", type: "Consult", typeColor: "#0f6e56", duration: 30, startedAt: "14:23", elapsed: 4 * 60 + 23, reason: "Annual physical", phone: "+27 81 220 9871",
  },
  checkedIn: [
    { id: "c1", name: "Jabu Khumalo",   type: "Follow-up", typeColor: "#2a6fcc", duration: 15, scheduled: "14:55", waiting: 11 },
    { id: "c2", name: "Lerato Dube",    type: "Consult",   typeColor: "#0f6e56", duration: 30, scheduled: "15:10", waiting: 4 },
    { id: "c3", name: "Naledi Sithole", type: "Consult",   typeColor: "#0f6e56", duration: 30, scheduled: "15:20", waiting: 0 },
  ],
  scheduled: [
    { id: "sc1", name: "Khanyi Mbatha",     type: "Consult",   typeColor: "#0f6e56", duration: 30, scheduled: "15:40" },
    { id: "sc2", name: "Tom O'Brien",        type: "Follow-up", typeColor: "#2a6fcc", duration: 15, scheduled: "16:00" },
    { id: "sc3", name: "Priya Naidoo",      type: "Consult",   typeColor: "#0f6e56", duration: 30, scheduled: "16:15" },
    { id: "sc4", name: "Marcus Steyn",      type: "Consult",   typeColor: "#0f6e56", duration: 30, scheduled: "16:45" },
  ],
};

function OrgUserQueueScreen({ darkExample = false, onLogout, onPersona, onSwitchSeat, onEndShift }) {
  const [active, setActive] = useStateU("queue");
  const [q, setQ] = useStateU(INITIAL_QUEUE);
  const [tick, setTick] = useStateU(0);
  const [toast, setToast] = useStateU(null);
  const [confirmEnd, setConfirmEnd] = useStateU(false);
  const [rejectId, setRejectId] = useStateU(null);
  const [details, setDetails] = useStateU(null);

  useEffectU(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Tick the in-service elapsed and reduce holds & waits
  useEffectU(() => {
    const id = setInterval(() => {
      setQ((s) => ({
        ...s,
        inService: s.inService ? { ...s.inService, elapsed: s.inService.elapsed + 1 } : null,
        pending: s.pending.map(p => ({ ...p, hold: Math.max(0, p.hold - 1) })),
      }));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2400); };

  /* ── State transitions ── */
  const approve = (id) => {
    setQ((s) => {
      const p = s.pending.find(x => x.id === id);
      if (!p) return s;
      const moved = { id: p.id, name: p.name, type: p.type, typeColor: p.typeColor, duration: p.duration, scheduled: p.requestedFor, waiting: 0 };
      return { ...s, pending: s.pending.filter(x => x.id !== id), checkedIn: [...s.checkedIn, moved] };
    });
    flash("Approved · client notified");
  };
  const reject = (id, reason) => {
    setQ((s) => ({ ...s, pending: s.pending.filter(x => x.id !== id) }));
    setRejectId(null);
    flash(reason ? `Declined · "${reason}"` : "Declined");
  };
  const complete = () => {
    setQ((s) => {
      const [next, ...rest] = s.checkedIn;
      let newInService = null;
      let newChecked = s.checkedIn;
      if (next) {
        newInService = { id: next.id, name: next.name, type: next.type, typeColor: next.typeColor, duration: next.duration, startedAt: nowHHMM(), elapsed: 0, reason: "", phone: "+27 8x ••• ••••" };
        newChecked = rest;
      }
      return { ...s, inService: newInService, checkedIn: newChecked };
    });
    flash("Marked complete · next client called");
  };
  const callNext = () => {
    setQ((s) => {
      if (s.inService) return s; // already serving
      const [next, ...rest] = s.checkedIn;
      if (!next) return s;
      const newInService = { id: next.id, name: next.name, type: next.type, typeColor: next.typeColor, duration: next.duration, startedAt: nowHHMM(), elapsed: 0, reason: "", phone: "+27 8x ••• ••••" };
      return { ...s, inService: newInService, checkedIn: rest };
    });
    flash("Called next client");
  };
  const noShow = () => {
    setQ((s) => ({ ...s, inService: null }));
    flash("Marked as no-show");
  };

  function nowHHMM() {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  /* ── Apply dark mode at root if requested ── */
  return (
    <div className={darkExample ? "qf-dark" : undefined} style={{
      display: "flex", height: "calc(100vh - 48px)", overflow: "hidden",
      background: "var(--bg)", color: "var(--ink)",
    }}>
      <Sidebar
        items={OU_NAV.map(n => n.id === "queue" ? { ...n, count: q.pending.length + q.checkedIn.length + (q.inService ? 1 : 0) + q.scheduled.length } : n)}
        active={active}
        onSelect={setActive}
        footer={
          <button onClick={() => onPersona?.("orguser-claim")} style={{
            display: "flex", alignItems: "center", gap: 10, width: "100%",
            border: 0, background: "transparent", padding: "6px 4px",
            cursor: "pointer", borderRadius: 6, color: "var(--ink-2)", textAlign: "left",
          }}>
            <Avatar name="Amara Okonkwo" size={26} active />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: "var(--ink)" }}>Amara Okonkwo</div>
              <div style={{ fontSize: 11, color: "var(--ink-3)" }}>Room 1 · On shift</div>
            </div>
            <Icon name="logout" size={14} style={{ color: "var(--ink-3)" }} />
          </button>
        }
      />

      <main style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}>
        {active === "queue" && (
          <QueueView
            q={q} tick={tick}
            darkExample={darkExample}
            onApprove={approve}
            onReject={(id) => setRejectId(id)}
            onComplete={complete}
            onCallNext={callNext}
            onNoShow={noShow}
            onEndShift={() => setConfirmEnd(true)}
            onSwitchSeat={onSwitchSeat}
            onOpenDetails={(c) => setDetails(c)}
          />
        )}
        {active === "availability" && <AvailabilityView />}
        {active === "timeconfig" && <TimeConfigsView />}
        {active === "notifications" && <NotificationsView />}
        {active === "profile" && <ProfilePlaceholder />}
      </main>

      {/* Toast */}
      {toast && (
        <div style={{
          position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)",
          background: "var(--ink)", color: "var(--bg)",
          padding: "10px 16px", borderRadius: 10,
          fontSize: 13, fontWeight: 500,
          boxShadow: "var(--shadow-lg)",
          zIndex: 90,
          display: "flex", alignItems: "center", gap: 8,
        }}>
          <Icon name="check" size={14} style={{ color: "var(--teal)" }} stroke={2.5} />
          {toast}
        </div>
      )}

      {/* End shift confirm */}
      <Modal open={confirmEnd} onClose={() => setConfirmEnd(false)}
        title="End your shift?"
        footer={<>
          <Button variant="ghost" onClick={() => setConfirmEnd(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => { setConfirmEnd(false); onEndShift?.(); }}>End shift</Button>
        </>}>
        <p style={{ margin: 0, color: "var(--ink-2)", fontSize: 14, lineHeight: 1.55 }}>
          New booking requests will stop routing to you. Clients in your waiting room
          ({q.checkedIn.length + (q.inService ? 1 : 0)}) will be reassigned or held until
          another consultant claims your seat.
        </p>
      </Modal>

      {/* Reject dialog */}
      <Modal open={!!rejectId} onClose={() => setRejectId(null)} title="Decline booking request"
        footer={<>
          <Button variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => reject(rejectId, document.getElementById("qf-reject-reason")?.value || "")}>Decline</Button>
        </>}>
        <p style={{ margin: "0 0 12px", fontSize: 13.5, color: "var(--ink-2)" }}>
          The client will see your message. Keep it kind and brief.
        </p>
        <textarea id="qf-reject-reason" placeholder="e.g. I'm fully booked this afternoon — please pick a slot tomorrow morning."
          style={{
            width: "100%", minHeight: 84, padding: 12,
            border: "1px solid var(--line-2)", borderRadius: 8,
            background: "var(--surface)", color: "var(--ink)",
            font: "inherit", outline: 0, resize: "vertical",
          }} />
      </Modal>

      {/* Booking details */}
      <Modal open={!!details} onClose={() => setDetails(null)} title="Booking details" width={560}>
        {details && <BookingDetailContent c={details} />}
      </Modal>
    </div>
  );
}

/* ─────────────── Queue view ─────────────── */
function QueueView({ q, tick, darkExample, onApprove, onReject, onComplete, onCallNext, onNoShow, onEndShift, onSwitchSeat, onOpenDetails }) {
  const totalToday = q.pending.length + q.checkedIn.length + (q.inService ? 1 : 0) + q.scheduled.length;
  return (
    <>
      <TopBar
        title={<>Today's queue</>}
        subtitle={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
            <span className="qf-live-dot" />
            <span>Live · {totalToday} bookings today</span>
            <span style={{ color: "var(--ink-4)" }}>·</span>
            <span>Refreshed {Math.max(1, tick % 6) + "s"} ago</span>
          </span>
        }
        right={
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={onSwitchSeat} style={{
              display: "flex", alignItems: "center", gap: 8,
              background: "var(--surface-2)",
              border: "1px solid var(--line)",
              borderRadius: 8, padding: "6px 10px",
              cursor: "pointer", color: "var(--ink-2)",
            }}>
              <Icon name="chair" size={14} />
              <span style={{ fontSize: 12.5, fontWeight: 500 }}>Consultation room 1</span>
              <span style={{ fontSize: 11.5, color: "var(--ink-3)" }}>· Switch seat</span>
            </button>
            <Button variant="danger-ghost" icon="logout" onClick={onEndShift}>End shift</Button>
          </div>
        }
      />

      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 40px" }} className="qf-scroll">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 18, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <QueueSection
              title="Pending approval" count={q.pending.length}
              tone="amber" hint="New requests need your sign-off before they're held."
              empty="No requests waiting."
            >
              {q.pending.map(p => (
                <PendingCard key={p.id} p={p} onApprove={() => onApprove(p.id)} onReject={() => onReject(p.id)} onOpen={() => onOpenDetails(p)} />
              ))}
            </QueueSection>

            <QueueSection
              title="In service now" count={q.inService ? 1 : 0}
              tone="blue" hint="The client you're seeing right now."
              empty="Nobody is being served. Call the next client when ready."
            >
              {q.inService && <InServiceCard c={q.inService} onComplete={onComplete} onNoShow={onNoShow} onOpen={() => onOpenDetails(q.inService)} />}
            </QueueSection>

            <QueueSection
              title="Checked in" count={q.checkedIn.length}
              tone="teal" hint="In the waiting room, in order."
              empty="No one is checked in yet."
              right={!q.inService && q.checkedIn.length > 0 && (
                <Button variant="primary" size="sm" icon="bell" onClick={onCallNext}>Call next</Button>
              )}
            >
              {q.checkedIn.map((c, i) => (
                <CheckedInRow key={c.id} c={c} idx={i} onOpen={() => onOpenDetails(c)} />
              ))}
            </QueueSection>

            <QueueSection
              title="Scheduled today" count={q.scheduled.length}
              tone="neutral" hint="Upcoming, not yet checked in."
              empty="Nothing else scheduled today."
            >
              {q.scheduled.map((c) => (
                <ScheduledRow key={c.id} c={c} onOpen={() => onOpenDetails(c)} />
              ))}
            </QueueSection>
          </div>

          {/* Right rail */}
          <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <Card style={{ padding: 0 }}>
              <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 8 }}>
                <span className="qf-live-dot" />
                <span style={{ fontSize: 12.5, fontWeight: 500 }}>Notifications</span>
                <Pill tone="coral" style={{ marginLeft: "auto" }}>2 new</Pill>
              </div>
              <div>
                {[
                  { ic: "alert", tone: "coral", title: "Running 12 min behind schedule", body: "Delay alert sent to 3 clients in your queue.", t: "2m ago" },
                  { ic: "bell",  tone: "amber", title: "New request from Beth Cele",      body: "Requested 15:00 · Consult.",                    t: "5m ago" },
                  { ic: "info",  tone: "blue",  title: "Sarah Mokoena checked in",         body: "Arrived in waiting room.",                      t: "14m ago" },
                ].map((n, i, arr) => (
                  <div key={i} style={{
                    padding: "10px 14px",
                    borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
                    display: "flex", gap: 10,
                  }}>
                    <FeedKind kind={n.tone === "coral" ? "alert" : n.tone === "amber" ? "request" : "service"} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 500 }}>{n.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-3)", marginTop: 1 }}>{n.body}</div>
                      <div style={{ fontSize: 11, color: "var(--ink-4)", marginTop: 3 }}>{n.t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card style={{ padding: 14 }}>
              <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>Today at a glance</div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 10 }}>
                <Mini label="Completed" value="6" tone="success" />
                <Mini label="No-shows"  value="1" tone="ink" />
                <Mini label="Avg consult" value="22m" tone="ink" />
                <Mini label="Behind"     value="+12m" tone="coral" />
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

function Mini({ label, value, tone = "ink" }) {
  const c = tone === "success" ? "var(--success)" : tone === "coral" ? "var(--coral-2)" : "var(--ink)";
  return (
    <div>
      <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>{label}</div>
      <div className="tnum" style={{ fontSize: 20, fontWeight: 500, color: c, letterSpacing: "-0.015em" }}>{value}</div>
    </div>
  );
}

function QueueSection({ title, count, tone = "neutral", hint, empty, right, children }) {
  const accent = {
    amber: "var(--amber)",
    blue: "var(--blue)",
    teal: "var(--teal)",
    neutral: "var(--line-2)",
  }[tone];
  const isEmpty = React.Children.count(children) === 0 || (Array.isArray(children) && children.every(c => !c));
  return (
    <Card style={{ padding: 0 }}>
      <div style={{
        padding: "12px 16px",
        borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", gap: 10,
        position: "relative",
      }}>
        <span style={{
          position: "absolute", left: 0, top: 10, bottom: 10, width: 3,
          background: accent, borderRadius: 0,
        }} />
        <h3 style={{ margin: 0, fontSize: 13.5, fontWeight: 600, letterSpacing: "-0.005em" }}>{title}</h3>
        <Pill tone={tone === "neutral" ? "neutral" : tone}>{count}</Pill>
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{hint}</span>
        <span style={{ flex: 1 }} />
        {right}
      </div>
      <div>
        {isEmpty ? (
          <div style={{ padding: "18px 16px", color: "var(--ink-3)", fontSize: 13 }}>{empty}</div>
        ) : children}
      </div>
    </Card>
  );
}

/* ─── Pending card ─── */
function PendingCard({ p, onApprove, onReject, onOpen }) {
  return (
    <div style={{
      padding: "14px 16px",
      borderBottom: "1px solid var(--line)",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto",
      gap: 12, alignItems: "center",
    }}>
      <Avatar name={p.name} size={36} />
      <div style={{ minWidth: 0, cursor: "pointer" }} onClick={onOpen}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, fontWeight: 500 }}>{p.name}</span>
          {p.new && <Pill tone="amber">New</Pill>}
        </div>
        <div style={{ fontSize: 12, color: "var(--ink-3)", marginTop: 2 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: 2,
            background: p.typeColor, marginRight: 6, verticalAlign: "1px",
          }} />
          {p.type} · {p.duration} min · requested {p.requestedFor}
          {p.reason && <> · <span style={{ color: "var(--ink-2)" }}>"{p.reason}"</span></>}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div className="mono tnum" style={{ fontSize: 12.5, color: "var(--amber)", fontWeight: 500 }}>
          Hold {formatMS(p.hold)}
        </div>
        <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          before expires
        </div>
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <Button variant="secondary" size="sm" icon="x" onClick={onReject}>Reject</Button>
        <Button variant="primary" size="sm" icon="check" onClick={onApprove}>Approve</Button>
      </div>
    </div>
  );
}

/* ─── In-service card (the big one) ─── */
function InServiceCard({ c, onComplete, onNoShow, onOpen }) {
  const overrun = c.elapsed > c.duration * 60;
  return (
    <div style={{
      padding: 16,
      background: "linear-gradient(180deg, var(--blue-tint), transparent)",
      borderBottom: "1px solid var(--line)",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto",
      gap: 16, alignItems: "center",
    }}>
      <Avatar name={c.name} size={48} />
      <div style={{ cursor: "pointer" }} onClick={onOpen}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}>{c.name}</span>
          <Pill tone="blue" dot>In service</Pill>
        </div>
        <div style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 4 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: 2,
            background: c.typeColor, marginRight: 6, verticalAlign: "1px",
          }} />
          {c.type} · {c.duration} min scheduled · started {c.startedAt}
          {c.reason && <> · {c.reason}</>}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
          <Button variant="primary" icon="check" onClick={onComplete}>Complete consult</Button>
          <Button variant="ghost" icon="user" onClick={onNoShow}>Mark no-show</Button>
          <Button variant="ghost" onClick={onOpen}>View notes</Button>
        </div>
      </div>
      <div style={{
        textAlign: "center", padding: "8px 16px",
        background: "var(--surface)", borderRadius: 12,
        border: "1px solid var(--line)",
        minWidth: 124,
      }}>
        <div style={{ fontSize: 10.5, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600 }}>
          Elapsed
        </div>
        <div className="mono tnum" style={{
          fontSize: 30, fontWeight: 500,
          color: overrun ? "var(--coral-2)" : "var(--blue)",
          letterSpacing: "-0.02em",
          lineHeight: 1.1, marginTop: 2,
        }}>{formatMS(c.elapsed)}</div>
        <div style={{ fontSize: 11, color: overrun ? "var(--coral-2)" : "var(--ink-3)", marginTop: 2 }}>
          {overrun ? `+${formatMS(c.elapsed - c.duration * 60)} over` : `${c.duration - Math.floor(c.elapsed / 60)} min left`}
        </div>
      </div>
    </div>
  );
}

/* ─── Checked-in row ─── */
function CheckedInRow({ c, idx, onOpen }) {
  return (
    <div onClick={onOpen} style={{
      padding: "12px 16px",
      borderBottom: "1px solid var(--line)",
      display: "grid",
      gridTemplateColumns: "auto auto 1fr auto auto",
      gap: 12, alignItems: "center",
      cursor: "pointer",
    }}>
      <span className="mono" style={{
        width: 22, fontSize: 11, color: "var(--ink-4)", textAlign: "center", letterSpacing: "-0.02em",
      }}>#{idx + 1}</span>
      <Avatar name={c.name} size={30} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500 }}>{c.name}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          <span style={{
            display: "inline-block", width: 7, height: 7, borderRadius: 2,
            background: c.typeColor, marginRight: 5, verticalAlign: "1px",
          }} />
          {c.type} · scheduled {c.scheduled}
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 11.5, color: c.waiting > 10 ? "var(--coral-2)" : "var(--ink-2)", fontWeight: 500 }}>
          {c.waiting === 0 ? "Just arrived" : `Waiting ${c.waiting}m`}
        </div>
      </div>
      <Icon name="chevronR" size={14} style={{ color: "var(--ink-4)" }} />
    </div>
  );
}

/* ─── Scheduled row ─── */
function ScheduledRow({ c, onOpen }) {
  return (
    <div onClick={onOpen} style={{
      padding: "10px 16px",
      borderBottom: "1px solid var(--line)",
      display: "grid",
      gridTemplateColumns: "auto 1fr auto auto",
      gap: 12, alignItems: "center",
      cursor: "pointer",
    }}>
      <Avatar name={c.name} size={26} />
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
        <div style={{ fontSize: 11.5, color: "var(--ink-3)" }}>
          <span style={{
            display: "inline-block", width: 7, height: 7, borderRadius: 2,
            background: c.typeColor, marginRight: 5, verticalAlign: "1px",
          }} />
          {c.type} · {c.duration} min
        </div>
      </div>
      <div className="mono tnum" style={{ fontSize: 12.5, color: "var(--ink-2)" }}>{c.scheduled}</div>
      <button onClick={(e) => e.stopPropagation()} style={{
        border: 0, background: "transparent", cursor: "pointer",
        color: "var(--ink-3)", padding: 6, borderRadius: 6,
      }}><Icon name="dotsH" size={14} /></button>
    </div>
  );
}

/* ─── Booking detail content ─── */
function BookingDetailContent({ c }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <Avatar name={c.name} size={48} />
        <div>
          <div style={{ fontSize: 17, fontWeight: 500, letterSpacing: "-0.01em" }}>{c.name}</div>
          <div style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{c.phone || "+27 8x ••• ••••"} · {c.email || "no email on file"}</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 18 }}>
        <Card padding={12}>
          <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</div>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 4 }}>{c.type} · {c.duration} min</div>
        </Card>
        <Card padding={12}>
          <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Scheduled</div>
          <div style={{ fontSize: 13.5, fontWeight: 500, marginTop: 4 }}>{c.scheduled || c.requestedFor || c.startedAt} · today</div>
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Visit history</div>
        <Card padding={0}>
          {[
            ["18 May 2026", "Today", "Pending"],
            ["12 Mar 2026", "Consult · 30 min", "Completed"],
            ["04 Jan 2026", "Follow-up · 15 min", "Completed"],
            ["27 Sep 2025", "Consult · 30 min", "Completed"],
          ].map(([d, t, s], i, arr) => (
            <div key={i} style={{
              padding: "10px 14px",
              borderBottom: i < arr.length - 1 ? "1px solid var(--line)" : "none",
              display: "grid", gridTemplateColumns: "auto 1fr auto", gap: 12, alignItems: "center",
            }}>
              <div className="mono" style={{ fontSize: 12, color: "var(--ink-3)" }}>{d}</div>
              <div style={{ fontSize: 13 }}>{t}</div>
              <Pill tone={s === "Pending" ? "amber" : "success"}>{s}</Pill>
            </div>
          ))}
        </Card>
      </div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontSize: 11, color: "var(--ink-4)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>Private notes</div>
        <textarea defaultValue="History of mild seasonal allergies. Prefers afternoon appointments."
          style={{
            width: "100%", minHeight: 70, padding: 10,
            border: "1px solid var(--line-2)", borderRadius: 8,
            background: "var(--surface)", color: "var(--ink)",
            font: "inherit", outline: 0, resize: "vertical",
          }} />
      </div>
    </div>
  );
}

/* ═════════════════════════════════════════════════════════════════
   3) My availability (#17) — week view
   ═════════════════════════════════════════════════════════════════ */
function AvailabilityView() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const dates = [18, 19, 20, 21, 22, 23, 24];
  // Slots: 8:00..18:00 in 30-min increments (20 rows)
  const slots = useMemoU(() => {
    const out = [];
    for (let h = 8; h < 18; h++) for (let m = 0; m < 60; m += 30) out.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    return out;
  }, []);
  // Working hours per day (idx -> [start, end] in slot indices)
  const work = [[2, 18], [2, 18], [4, 18], [2, 18], [2, 14], null, null];
  // Bookings overlay
  const bookings = {
    "0-4": { name: "Sarah M.", type: "Consult", color: "#0f6e56" },
    "0-7": { name: "Jabu K.",  type: "Follow-up", color: "#2a6fcc" },
    "1-6": { name: "Beth C.",  type: "Consult", color: "#0f6e56" },
    "1-10": { name: "Lerato D.", type: "Consult", color: "#0f6e56" },
    "2-8": { name: "Naledi S.", type: "Consult", color: "#0f6e56" },
    "3-3": { name: "Khanyi M.", type: "Follow-up", color: "#2a6fcc" },
    "4-6": { name: "Tom O.",   type: "Consult", color: "#0f6e56" },
  };

  return (
    <>
      <TopBar
        title="My availability"
        subtitle="Working hours and exceptions for your week."
        breadcrumb={["Dashboard", "Availability"]}
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Button variant="secondary" icon="refresh">Recurring schedule</Button>
            <Button variant="primary" icon="plus">Add exception</Button>
          </div>
        }
      />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px 40px" }} className="qf-scroll">
        {/* Warning banner */}
        <div style={{
          padding: "10px 14px",
          background: "var(--coral-tint)",
          border: "1px solid color-mix(in oklab, var(--coral) 30%, transparent)",
          borderRadius: 10,
          display: "flex", alignItems: "center", gap: 10,
          marginBottom: 16,
        }}>
          <Icon name="alert" size={16} style={{ color: "var(--coral-2)" }} />
          <span style={{ fontSize: 13, color: "var(--coral-2)", flex: 1 }}>
            <b style={{ fontWeight: 600 }}>3 scheduled bookings</b> fall in newly-blocked hours.
          </span>
          <Button variant="secondary" size="sm">Review →</Button>
        </div>

        {/* Week toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 4 }}>
            <Button variant="ghost" size="sm" icon="chevronL" />
            <Button variant="secondary" size="sm">This week</Button>
            <Button variant="ghost" size="sm" icon="chevronR" />
          </div>
          <span style={{ fontSize: 13.5, fontWeight: 500 }}>18 — 24 May 2026</span>
          <span style={{ flex: 1 }} />
          <div style={{ display: "flex", gap: 4 }}>
            {["Day", "Week", "Month"].map((v, i) => (
              <Button key={v} variant={i === 1 ? "secondary" : "ghost"} size="sm">{v}</Button>
            ))}
          </div>
        </div>

        {/* Calendar */}
        <Card style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "56px repeat(7, 1fr)",
            borderBottom: "1px solid var(--line)",
            background: "var(--surface-2)",
          }}>
            <div />
            {days.map((d, i) => (
              <div key={d} style={{
                padding: "10px 12px",
                borderLeft: "1px solid var(--line)",
                display: "flex", alignItems: "baseline", gap: 6,
              }}>
                <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500 }}>{d}</span>
                <span className="tnum" style={{ fontSize: 14, fontWeight: 500, color: i === 0 ? "var(--teal)" : "var(--ink)" }}>{dates[i]}</span>
                {!work[i] && <Pill tone="neutral" style={{ marginLeft: "auto", fontSize: 10 }}>Off</Pill>}
              </div>
            ))}
          </div>
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "56px repeat(7, 1fr)" }}>
            {/* Hour labels */}
            <div>
              {slots.map((s, i) => (
                <div key={s} style={{
                  height: 24, fontSize: 10.5, color: "var(--ink-4)",
                  padding: "0 8px", textAlign: "right",
                  borderBottom: i < slots.length - 1 ? "1px solid var(--line)" : "none",
                  position: "relative",
                }}>
                  {s.endsWith(":00") && <span className="mono" style={{ position: "relative", top: -4 }}>{s}</span>}
                </div>
              ))}
            </div>
            {days.map((d, dayIdx) => {
              const w = work[dayIdx];
              return (
                <div key={d} style={{ position: "relative", borderLeft: "1px solid var(--line)" }}>
                  {/* Slot grid */}
                  {slots.map((s, i) => (
                    <div key={i} style={{
                      height: 24,
                      borderBottom: i < slots.length - 1 ? "1px solid var(--line)" : "none",
                      background: !w || i < w[0] || i >= w[1] ? "var(--surface-2)" : "transparent",
                    }} />
                  ))}
                  {/* Working hours overlay */}
                  {w && (
                    <div style={{
                      position: "absolute",
                      top: w[0] * 24, height: (w[1] - w[0]) * 24,
                      left: 4, right: 4,
                      borderRadius: 4,
                      background: "color-mix(in oklab, var(--teal) 8%, transparent)",
                      border: "1px solid color-mix(in oklab, var(--teal) 25%, transparent)",
                    }} />
                  )}
                  {/* Bookings */}
                  {Object.entries(bookings).filter(([k]) => k.startsWith(dayIdx + "-")).map(([k, b]) => {
                    const slotIdx = +k.split("-")[1];
                    return (
                      <div key={k} style={{
                        position: "absolute",
                        top: slotIdx * 24, height: 48,
                        left: 6, right: 6,
                        background: "var(--surface)",
                        border: "1px solid var(--line-2)",
                        borderLeft: `3px solid ${b.color}`,
                        borderRadius: 4,
                        padding: "3px 6px",
                        fontSize: 11,
                        boxShadow: "var(--shadow-sm)",
                        overflow: "hidden",
                      }}>
                        <div style={{ fontWeight: 500, lineHeight: 1.2, color: "var(--ink)" }}>{b.name}</div>
                        <div style={{ fontSize: 10, color: "var(--ink-3)" }}>{b.type}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}

/* ═════════════════════════════════════════════════════════════════
   Other org user pages (placeholder views — kept simple)
   ═════════════════════════════════════════════════════════════════ */
function TimeConfigsView() {
  const [enabled, setEnabled] = useStateU({ "Consult": true, "Follow-up": true, "Quick check": false });
  const rows = [
    { name: "Consult",     duration: 30, color: "#0f6e56" },
    { name: "Follow-up",   duration: 15, color: "#2a6fcc" },
    { name: "Quick check", duration: 10, color: "#b6791f" },
  ];
  return (
    <>
      <TopBar title="Time configurations" subtitle="Choose which services you accept for your seat." breadcrumb={["Dashboard", "Time configurations"]} />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }} className="qf-scroll">
        <Card style={{ padding: 0, maxWidth: 720 }}>
          {rows.map((r, i) => (
            <div key={r.name} style={{
              padding: "14px 16px",
              borderBottom: i < rows.length - 1 ? "1px solid var(--line)" : "none",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <span style={{ width: 24, height: 24, borderRadius: 6, background: r.color, display: "inline-flex", alignItems: "center", justifyContent: "center", color: "#fff" }}><Icon name="clock" size={12} /></span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 500 }}>{r.name}</div>
                <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{r.duration} min · org-wide</div>
              </div>
              <Toggle on={enabled[r.name]} onChange={(v) => setEnabled({ ...enabled, [r.name]: v })} />
            </div>
          ))}
        </Card>
        <p style={{ fontSize: 12.5, color: "var(--ink-3)", marginTop: 12 }}>
          Only super users can add new timeslot types.
        </p>
      </div>
    </>
  );
}
function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)} style={{
      width: 36, height: 22, borderRadius: 99,
      border: 0, cursor: "pointer",
      background: on ? "var(--teal)" : "var(--line-2)",
      position: "relative", transition: "background .15s",
    }}>
      <span style={{
        position: "absolute", top: 2, left: on ? 16 : 2,
        width: 18, height: 18, borderRadius: "50%",
        background: "#fff", transition: "left .15s",
        boxShadow: "0 1px 2px rgba(0,0,0,.15)",
      }} />
    </button>
  );
}
function NotificationsView() {
  return (
    <>
      <TopBar title="Notifications" />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }} className="qf-scroll">
        <Card style={{ padding: 24, textAlign: "center", color: "var(--ink-3)" }}>
          Notifications view (out of scope for hero set).
        </Card>
      </div>
    </>
  );
}
function ProfilePlaceholder() {
  return (
    <>
      <TopBar title="Profile" />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 24px" }} className="qf-scroll">
        <Card style={{ padding: 24, textAlign: "center", color: "var(--ink-3)" }}>Profile (placeholder).</Card>
      </div>
    </>
  );
}

Object.assign(window, { OrgUserClaimScreen, OrgUserQueueScreen });
