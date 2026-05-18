// screens-onboarding.jsx — 5-step super user onboarding wizard
// All five steps live in one component with state; the user can step
// forward/back and edits persist within the session.

const { useState: useStateO } = React;

const WIZ_STEPS = [
  { id: 0, label: "Departments",      hint: "Add the areas of your practice." },
  { id: 1, label: "Seats",            hint: "Rooms, chairs, or workstations." },
  { id: 2, label: "Team",             hint: "Invite the people who'll use it." },
  { id: 3, label: "Timeslot types",   hint: "Services you offer." },
  { id: 4, label: "Share your link",  hint: "Let clients join the queue." },
];

const TIMESLOT_COLORS = [
  { v: "teal",  bg: "#0f6e56" },
  { v: "blue",  bg: "#2a6fcc" },
  { v: "plum",  bg: "#7341a8" },
  { v: "amber", bg: "#b6791f" },
  { v: "coral", bg: "#d85a30" },
  { v: "olive", bg: "#7a8336" },
];

function OnboardingScreen({ initialStep = 0, onFinish, onExit }) {
  const [step, setStep] = useStateO(initialStep);
  const [departments, setDepartments] = useStateO([
    { id: 1, name: "General Practice" },
    { id: 2, name: "Dental" },
    { id: 3, name: "Pediatrics" },
  ]);
  const [seats, setSeats] = useStateO([
    { id: 1, deptId: 1, name: "Consultation room 1", desc: "Dr. Okonkwo's primary room" },
    { id: 2, deptId: 1, name: "Consultation room 2", desc: "" },
    { id: 3, deptId: 1, name: "Consultation room 3", desc: "" },
    { id: 4, deptId: 2, name: "Dental chair A", desc: "" },
    { id: 5, deptId: 2, name: "Dental chair B", desc: "" },
    { id: 6, deptId: 3, name: "Peds room", desc: "Quieter wing" },
  ]);
  const [invites, setInvites] = useStateO([
    { id: 1, name: "Amara Okonkwo", email: "amara@bryanstonfp.co.za", role: "Org user",    seat: "Consultation room 1" },
    { id: 2, name: "Sipho Dlamini",  email: "sipho@bryanstonfp.co.za",  role: "Org user",    seat: "Consultation room 2" },
    { id: 3, name: "Kefilwe Nkosi",  email: "kefi@bryanstonfp.co.za",   role: "Super user",  seat: "—" },
    { id: 4, name: "",                email: "",                          role: "Org user",    seat: "—" },
  ]);
  const [timeslots, setTimeslots] = useStateO([
    { id: 1, name: "Consult",   duration: 30, color: "teal" },
    { id: 2, name: "Follow-up", duration: 15, color: "blue" },
  ]);

  const next = () => setStep(s => Math.min(s + 1, WIZ_STEPS.length - 1));
  const prev = () => setStep(s => Math.max(s - 1, 0));

  return (
    <div style={{
      minHeight: "calc(100vh - 48px)",
      background: "var(--bg)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Wizard header — progress + exit */}
      <header style={{
        padding: "20px 32px",
        borderBottom: "1px solid var(--line)",
        background: "var(--surface)",
        display: "flex", alignItems: "center", gap: 24,
      }}>
        <QFLogo size={18} />
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>Bryanston Family Practice</span>
        <Progress step={step} total={WIZ_STEPS.length} style={{ flex: 1, maxWidth: 520, margin: "0 auto" }} />
        <Button variant="ghost" size="sm" onClick={onExit}>Save &amp; exit</Button>
      </header>

      {/* Step body */}
      <main style={{
        flex: 1,
        display: "flex", justifyContent: "center",
        padding: "40px 32px 100px",
        overflow: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 720 }}>
          <div style={{ marginBottom: 24 }}>
            <div className="mono" style={{ fontSize: 11.5, color: "var(--ink-4)", letterSpacing: "0.06em" }}>
              STEP {step + 1} OF {WIZ_STEPS.length}
            </div>
            <h1 style={{
              margin: "8px 0 8px", fontSize: 26, fontWeight: 500, letterSpacing: "-0.025em",
            }}>
              {step === 0 && "What departments does Bryanston Family Practice have?"}
              {step === 1 && "Add the seats in each department."}
              {step === 2 && "Invite your team."}
              {step === 3 && "Configure the services you offer."}
              {step === 4 && "Share your queue with clients."}
            </h1>
            <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 14, maxWidth: 540 }}>
              {step === 0 && "Departments group your seats together — think of them as the rooms or service areas in your practice. You can change these later in settings."}
              {step === 1 && "A seat is a room, chair, or workstation that a staff member can claim for a shift. The queue routes new requests to whoever is claiming that seat."}
              {step === 2 && "We'll send each person an email with a link to set their password. You can skip this and add people later."}
              {step === 3 && "These are the services clients can book. Each has a duration and color so they're easy to scan in the live queue."}
              {step === 4 && "Print the QR or copy the link. Anyone who scans this can join your queue and pick a time."}
            </p>
          </div>

          {step === 0 && (
            <DepartmentsStep departments={departments} setDepartments={setDepartments} />
          )}
          {step === 1 && (
            <SeatsStep departments={departments} seats={seats} setSeats={setSeats} />
          )}
          {step === 2 && (
            <InvitesStep invites={invites} setInvites={setInvites} seats={seats} />
          )}
          {step === 3 && (
            <TimeslotsStep timeslots={timeslots} setTimeslots={setTimeslots} />
          )}
          {step === 4 && (
            <ShareStep />
          )}
        </div>
      </main>

      {/* Sticky footer */}
      <footer style={{
        position: "sticky", bottom: 0,
        background: "var(--surface)",
        borderTop: "1px solid var(--line)",
        padding: "14px 32px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <div style={{ display: "flex", gap: 4 }}>
          {WIZ_STEPS.map((s, i) => (
            <span key={s.id} style={{
              width: 24, height: 3, borderRadius: 2,
              background: i <= step ? "var(--teal)" : "var(--line-2)",
              transition: "background .2s",
            }} />
          ))}
        </div>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)" }}>{WIZ_STEPS[step].label}</span>
        <span style={{ flex: 1 }} />
        <Button variant="ghost" disabled={step === 0} onClick={prev} icon="chevronL">Back</Button>
        {step === 2 && <Button variant="ghost" onClick={next}>Skip for now</Button>}
        {step < WIZ_STEPS.length - 1
          ? <Button variant="primary" onClick={next} iconRight="arrowR">Continue</Button>
          : <Button variant="primary" onClick={onFinish} iconRight="check">Finish setup</Button>}
      </footer>
    </div>
  );
}

function Progress({ step, total, style }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, ...style }}>
      {WIZ_STEPS.map((s, i) => {
        const done = i < step;
        const cur = i === step;
        return (
          <React.Fragment key={s.id}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, color: cur ? "var(--ink)" : done ? "var(--ink-2)" : "var(--ink-4)" }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%",
                background: done ? "var(--teal)" : cur ? "var(--surface)" : "var(--surface-2)",
                border: `1.5px solid ${done ? "var(--teal)" : cur ? "var(--teal)" : "var(--line-2)"}`,
                color: done ? "#fff" : cur ? "var(--teal)" : "var(--ink-4)",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 600,
              }}>{done ? <Icon name="check" size={11} stroke={2.5} /> : i + 1}</span>
              <span style={{ fontSize: 12.5, fontWeight: cur ? 500 : 400 }}>{s.label}</span>
            </div>
            {i < total - 1 && <span style={{ flex: 1, height: 1, background: i < step ? "var(--teal)" : "var(--line)" }} />}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ────── Step 1: Departments ────── */
function DepartmentsStep({ departments, setDepartments }) {
  const add = () => setDepartments([...departments, { id: Date.now(), name: "" }]);
  const remove = (id) => setDepartments(departments.filter(d => d.id !== id));
  const update = (id, name) => setDepartments(departments.map(d => d.id === id ? { ...d, name } : d));

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: "16px 18px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", gap: 12 }}>
        <Icon name="building" size={16} style={{ color: "var(--ink-3)" }} />
        <span style={{ fontSize: 13, color: "var(--ink-2)", fontWeight: 500 }}>Departments</span>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--ink-3)" }}>{departments.length} added</span>
      </div>
      <div style={{ padding: "8px 12px" }}>
        {departments.map((d, i) => (
          <div key={d.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 6px",
            borderBottom: i < departments.length - 1 ? "1px solid var(--line)" : "none",
          }}>
            <span style={{
              width: 22, height: 22, borderRadius: 6,
              background: "var(--surface-2)", color: "var(--ink-3)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600,
            }} className="mono">{i + 1}</span>
            <TextInput value={d.name} onChange={(e) => update(d.id, e.target.value)} placeholder="e.g. General Practice" style={{ flex: 1 }} />
            <button onClick={() => remove(d.id)} style={{
              border: 0, background: "transparent", cursor: "pointer",
              color: "var(--ink-3)", padding: 6, borderRadius: 6,
            }} aria-label="Remove"><Icon name="trash" size={15} /></button>
          </div>
        ))}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <Button variant="ghost" icon="plus" onClick={add}>Add department</Button>
      </div>
    </Card>
  );
}

/* ────── Step 2: Seats ────── */
function SeatsStep({ departments, seats, setSeats }) {
  const add = (deptId) => setSeats([...seats, { id: Date.now(), deptId, name: "", desc: "" }]);
  const remove = (id) => setSeats(seats.filter(s => s.id !== id));
  const update = (id, k, v) => setSeats(seats.map(s => s.id === id ? { ...s, [k]: v } : s));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {departments.map((d) => {
        const ds = seats.filter(s => s.deptId === d.id);
        return (
          <Card key={d.id} style={{ padding: 0 }}>
            <div style={{
              padding: "12px 16px", borderBottom: "1px solid var(--line)",
              display: "flex", alignItems: "center", gap: 10,
              background: "var(--surface-2)",
            }}>
              <Icon name="building" size={14} style={{ color: "var(--ink-3)" }} />
              <span style={{ fontSize: 13, fontWeight: 500 }}>{d.name || "Untitled department"}</span>
              <Pill tone="neutral" style={{ marginLeft: 4 }}>{ds.length} seat{ds.length !== 1 ? "s" : ""}</Pill>
              <span style={{ flex: 1 }} />
              <Button variant="ghost" size="sm" icon="plus" onClick={() => add(d.id)}>Add seat</Button>
            </div>
            <div>
              {ds.length === 0 ? (
                <div style={{ padding: "18px 16px", color: "var(--ink-3)", fontSize: 13 }}>No seats yet — add one to start.</div>
              ) : ds.map((s, i) => (
                <div key={s.id} style={{
                  padding: "12px 16px",
                  borderBottom: i < ds.length - 1 ? "1px solid var(--line)" : "none",
                  display: "grid", gridTemplateColumns: "auto 1fr 1.4fr auto", gap: 10, alignItems: "center",
                }}>
                  <Icon name="chair" size={15} style={{ color: "var(--ink-3)" }} />
                  <TextInput value={s.name} onChange={(e) => update(s.id, "name", e.target.value)} placeholder="Seat name" />
                  <TextInput value={s.desc} onChange={(e) => update(s.id, "desc", e.target.value)} placeholder="Optional description" />
                  <button onClick={() => remove(s.id)} style={{
                    border: 0, background: "transparent", cursor: "pointer",
                    color: "var(--ink-3)", padding: 6, borderRadius: 6,
                  }}><Icon name="trash" size={15} /></button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

/* ────── Step 3: Invites ────── */
function InvitesStep({ invites, setInvites, seats }) {
  const seatOptions = ["—", ...seats.map(s => s.name).filter(Boolean)];
  const add = () => setInvites([...invites, { id: Date.now(), name: "", email: "", role: "Org user", seat: "—" }]);
  const remove = (id) => setInvites(invites.filter(i => i.id !== id));
  const update = (id, k, v) => setInvites(invites.map(i => i.id === id ? { ...i, [k]: v } : i));

  return (
    <Card style={{ padding: 0 }}>
      <div style={{
        display: "grid", gridTemplateColumns: "1.1fr 1.4fr 1fr 1.2fr 32px",
        gap: 0, padding: "10px 16px",
        borderBottom: "1px solid var(--line)",
        fontSize: 11.5, color: "var(--ink-3)", fontWeight: 500,
        textTransform: "uppercase", letterSpacing: "0.05em",
        background: "var(--surface-2)",
      }}>
        <span>Name</span><span>Email</span><span>Role</span><span>Assigned seat</span><span />
      </div>
      <div>
        {invites.map((inv, i) => (
          <div key={inv.id} style={{
            display: "grid", gridTemplateColumns: "1.1fr 1.4fr 1fr 1.2fr 32px",
            gap: 10, padding: "10px 16px",
            borderBottom: i < invites.length - 1 ? "1px solid var(--line)" : "none",
            alignItems: "center",
          }}>
            <TextInput value={inv.name} onChange={(e) => update(inv.id, "name", e.target.value)} placeholder="Full name" />
            <TextInput value={inv.email} onChange={(e) => update(inv.id, "email", e.target.value)} placeholder="name@clinic.com" />
            <Select value={inv.role} onChange={(v) => update(inv.id, "role", v)} options={["Org user", "Super user"]} />
            <Select value={inv.seat} onChange={(v) => update(inv.id, "seat", v)} options={seatOptions} />
            <button onClick={() => remove(inv.id)} style={{
              border: 0, background: "transparent", cursor: "pointer",
              color: "var(--ink-3)", padding: 6, borderRadius: 6,
            }}><Icon name="trash" size={14} /></button>
          </div>
        ))}
      </div>
      <div style={{
        padding: 12, borderTop: "1px solid var(--line)",
        background: "var(--surface-2)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <Button variant="ghost" icon="plus" onClick={add}>Add another</Button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, color: "var(--ink-3)" }}>{invites.filter(i => i.email).length} invite{invites.filter(i => i.email).length !== 1 ? "s" : ""} ready to send</span>
        <Button variant="primary" icon="send">Send invites</Button>
      </div>
    </Card>
  );
}

/* ────── Step 4: Timeslot types ────── */
function TimeslotsStep({ timeslots, setTimeslots }) {
  const add = () => setTimeslots([...timeslots, { id: Date.now(), name: "", duration: 30, color: "teal" }]);
  const remove = (id) => setTimeslots(timeslots.filter(t => t.id !== id));
  const update = (id, k, v) => setTimeslots(timeslots.map(t => t.id === id ? { ...t, [k]: v } : t));

  return (
    <Card style={{ padding: 0 }}>
      <div style={{ padding: 8 }}>
        {timeslots.map((t, i) => {
          const colorObj = TIMESLOT_COLORS.find(c => c.v === t.color) || TIMESLOT_COLORS[0];
          return (
            <div key={t.id} style={{
              padding: 10,
              borderBottom: i < timeslots.length - 1 ? "1px solid var(--line)" : "none",
              display: "grid", gridTemplateColumns: "auto 2fr 1fr auto auto", gap: 10, alignItems: "center",
            }}>
              <div style={{
                width: 30, height: 30, borderRadius: 8,
                background: colorObj.bg, color: "#fff",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="clock" size={14} />
              </div>
              <TextInput value={t.name} onChange={(e) => update(t.id, "name", e.target.value)} placeholder="Service name (e.g. Consult)" />
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                background: "var(--surface)",
                border: "1px solid var(--line-2)",
                borderRadius: 8, padding: "0 10px", height: 38,
              }}>
                <input type="number" value={t.duration} onChange={(e) => update(t.id, "duration", +e.target.value)}
                  style={{
                    flex: 1, height: "100%", border: 0, background: "transparent",
                    font: "inherit", color: "var(--ink)", outline: 0, width: 40,
                  }} />
                <span style={{ fontSize: 12, color: "var(--ink-3)" }}>min</span>
              </div>
              <div style={{ display: "flex", gap: 5 }}>
                {TIMESLOT_COLORS.map(c => (
                  <button key={c.v} onClick={() => update(t.id, "color", c.v)} aria-label={c.v}
                    style={{
                      width: 22, height: 22, borderRadius: 6, cursor: "pointer",
                      background: c.bg, border: 0,
                      boxShadow: t.color === c.v ? "0 0 0 2px var(--surface), 0 0 0 4px var(--ink)" : "inset 0 0 0 1px rgba(20,18,12,.06)",
                    }} />
                ))}
              </div>
              <button onClick={() => remove(t.id)} style={{
                border: 0, background: "transparent", cursor: "pointer",
                color: "var(--ink-3)", padding: 6, borderRadius: 6,
              }}><Icon name="trash" size={14} /></button>
            </div>
          );
        })}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--line)", background: "var(--surface-2)" }}>
        <Button variant="ghost" icon="plus" onClick={add}>Add timeslot type</Button>
      </div>
    </Card>
  );
}

/* ────── Step 5: Share ────── */
function ShareStep() {
  const [copied, setCopied] = useStateO(false);
  return (
    <Card style={{ padding: 28 }}>
      <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 28, alignItems: "center" }}>
        <QRPlaceholder size={180} seed="bryanston-family-practice" />
        <div>
          <Pill tone="teal" dot>Your portal is live</Pill>
          <h3 style={{ margin: "10px 0 6px", fontSize: 18, fontWeight: 500, letterSpacing: "-0.015em" }}>
            Anyone with this link can join your queue.
          </h3>
          <p style={{ margin: 0, color: "var(--ink-3)", fontSize: 13.5 }}>
            Print the QR for reception or share the URL on your website and Google profile.
          </p>
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            marginTop: 18, padding: "10px 12px",
            background: "var(--surface-2)",
            border: "1px solid var(--line)",
            borderRadius: 8,
          }}>
            <Icon name="link" size={14} style={{ color: "var(--ink-3)" }} />
            <span className="mono" style={{ flex: 1, fontSize: 12.5, color: "var(--ink)" }}>
              queueflow.io/q/bryanston-family-practice
            </span>
            <Button variant="ghost" size="sm" icon={copied ? "check" : "copy"} onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }}>
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <Button variant="secondary" icon="download">Download QR</Button>
            <Button variant="secondary" icon="link">Open client portal preview</Button>
          </div>
        </div>
      </div>
      <Divider style={{ margin: "24px 0" }} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {[
          ["1 organization", "Bryanston Family Practice", "building"],
          ["3 departments", "General, Dental, Pediatrics", "grid"],
          ["6 seats, 4 team members", "All ready to claim", "users"],
        ].map(([k, v, ic]) => (
          <div key={k} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{
              width: 28, height: 28, borderRadius: 7,
              background: "var(--teal-tint)", color: "var(--teal-ink)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              flex: "none",
            }}><Icon name={ic} size={14} /></span>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{k}</div>
              <div style={{ fontSize: 12, color: "var(--ink-3)" }}>{v}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

Object.assign(window, { OnboardingScreen });
