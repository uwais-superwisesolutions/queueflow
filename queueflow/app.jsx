// app.jsx — top-level shell, screen routing, persona switcher, tweaks panel

const { useState: useStateA, useEffect: useEffectA } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "teal",
  "density": "regular",
  "showChrome": true
}/*EDITMODE-END*/;

const SCREENS = [
  { id: "landing",         persona: "marketing", label: "Landing",            short: "Landing" },
  { id: "signup",          persona: "marketing", label: "Sign up",            short: "Sign up" },
  { id: "login",           persona: "marketing", label: "Sign in",            short: "Sign in" },
  { id: "accept-invite",   persona: "marketing", label: "Accept invite",      short: "Accept invite" },

  { id: "onboarding",      persona: "superuser", label: "Onboarding wizard",  short: "Onboarding" },
  { id: "superuser",       persona: "superuser", label: "Dashboard",          short: "Dashboard",      suPage: "dashboard" },
  { id: "su-orgusers",     persona: "superuser", label: "Org users",          short: "Org users",      suPage: "orgusers" },
  { id: "su-seats",        persona: "superuser", label: "Seats",              short: "Seats",          suPage: "seats" },
  { id: "su-timeslots",    persona: "superuser", label: "Timeslot types",     short: "Timeslot types", suPage: "timeslots" },
  { id: "su-links",        persona: "superuser", label: "Portal links",       short: "Portal links",   suPage: "links" },
  { id: "su-analytics",    persona: "superuser", label: "Analytics",          short: "Analytics",      suPage: "analytics" },

  { id: "orguser-claim",   persona: "orguser",   label: "Seat claim",         short: "Seat claim" },
  { id: "orguser-queue",   persona: "orguser",   label: "Live queue",         short: "Live queue" },
  { id: "orguser-queue-dark",persona: "orguser", label: "Live queue · dark",  short: "Queue (dark)" },
  { id: "orguser-avail",   persona: "orguser",   label: "Availability",       short: "Availability" },

  { id: "client-phone",    persona: "client",    label: "Phone",              short: "Phone" },
  { id: "client-otp",      persona: "client",    label: "OTP verify",         short: "OTP" },
  { id: "client-details",  persona: "client",    label: "New client details", short: "Details" },
  { id: "client-returning",persona: "client",    label: "Returning visit",    short: "Returning" },
  { id: "client-slot",     persona: "client",    label: "Pick a slot",        short: "Slot picker" },
  { id: "client-confirm",  persona: "client",    label: "Request confirmation", short: "Confirmation" },
  { id: "client-status",   persona: "client",    label: "Live status",        short: "Status" },
  { id: "client-rejected", persona: "client",    label: "Rejection",          short: "Rejection" },

  { id: "sys-empty",       persona: "system",    label: "Empty states",       short: "Empty states" },
  { id: "sys-loading",     persona: "system",    label: "Loading skeleton",   short: "Loading" },
  { id: "sys-error",       persona: "system",    label: "Error states",       short: "Errors" },
  { id: "sys-sms",         persona: "system",    label: "Delay SMS preview",  short: "SMS preview" },
];

const PERSONAS = [
  { id: "marketing", label: "Public",      icon: "link",   color: "#6e6b60" },
  { id: "superuser", label: "Super user",  icon: "shield", color: "#7341a8" },
  { id: "orguser",   label: "Org user",    icon: "user",   color: "#0f6e56" },
  { id: "client",    label: "Client",      icon: "phone",  color: "#2a6fcc" },
  { id: "system",    label: "System",      icon: "settings",color:"#b6791f" },
];

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useStateA(() => {
    const h = window.location.hash.replace("#", "");
    return SCREENS.find(s => s.id === h) ? h : "landing";
  });

  useEffectA(() => {
    window.location.hash = screen;
  }, [screen]);

  useEffectA(() => {
    const onHash = () => {
      const h = window.location.hash.replace("#", "");
      if (h && SCREENS.find(s => s.id === h)) setScreen(h);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // apply palette tokens
  useEffectA(() => {
    const palette = PALETTES[t.palette] || PALETTES.teal;
    const root = document.documentElement;
    Object.entries(palette).forEach(([k, v]) => {
      if (k.startsWith("--")) root.style.setProperty(k, v);
    });
    return () => {
      Object.keys(palette).forEach((k) => { if (k.startsWith("--")) root.style.removeProperty(k); });
    };
  }, [t.palette]);

  const currentScreen = SCREENS.find(s => s.id === screen) || SCREENS[0];
  const currentPersona = currentScreen.persona;
  const screensInPersona = SCREENS.filter(s => s.persona === currentPersona);

  /* Persona navigation helpers given to screens */
  const goSignup = () => setScreen("signup");
  const goLogin = () => setScreen("signup"); // single auth-card flavor for now
  const goOnboarding = () => setScreen("onboarding");
  const goSuperUser = () => setScreen("superuser");
  const goOrgClaim = () => setScreen("orguser-claim");
  const goOrgQueue = () => setScreen("orguser-queue");
  const goClientPhone = () => setScreen("client-phone");
  const goClientOTP = () => setScreen("client-otp");
  const goClientSlot = () => setScreen("client-slot");
  const goClientStatus = () => setScreen("client-status");

  return (
    <>
      {t.showChrome && (
        <Chrome
          screen={screen} setScreen={setScreen}
          currentPersona={currentPersona}
          screensInPersona={screensInPersona}
        />
      )}
      <div className="qf-stage" style={{
        paddingTop: t.showChrome ? 48 : 0,
        minHeight: "100vh",
      }}>
        {screen === "landing"  && <LandingScreen onCta={goSignup} onSignIn={() => setScreen("login")} />}
        {screen === "signup"   && <SignUpScreen onSubmit={goOnboarding} onSignIn={() => setScreen("login")} />}
        {screen === "login"    && <LoginScreen onSubmit={goSuperUser} onSignUp={goSignup} />}
        {screen === "accept-invite" && <AcceptInviteScreen onSubmit={goOrgClaim} />}

        {screen === "onboarding" && <OnboardingScreen onFinish={goSuperUser} onExit={goSuperUser} />}
        {(currentScreen.persona === "superuser" && currentScreen.suPage) && (
          <SuperUserDashboard key={currentScreen.suPage} initialPage={currentScreen.suPage} onPersona={setScreen} />
        )}

        {screen === "orguser-claim"     && <OrgUserClaimScreen onClaim={goOrgQueue} />}
        {screen === "orguser-queue"     && <OrgUserQueueScreen onPersona={setScreen} onSwitchSeat={goOrgClaim} onEndShift={goOrgClaim} />}
        {screen === "orguser-queue-dark"&& <OrgUserQueueScreen darkExample onPersona={setScreen} onSwitchSeat={goOrgClaim} onEndShift={goOrgClaim} />}
        {screen === "orguser-avail"     && <OrgUserQueueScreen onPersona={setScreen} initialPage="availability" />}

        {screen === "client-phone"  && <ClientPhoneScreen onContinue={goClientOTP} />}
        {screen === "client-otp"    && <ClientOTPScreen onContinue={goClientSlot} onBack={goClientPhone} />}
        {screen === "client-details"&& <ClientNewDetailsScreen onContinue={goClientSlot} onBack={goClientOTP} />}
        {screen === "client-returning" && <ClientReturningScreen onContinue={goClientSlot} onBack={goClientPhone} />}
        {screen === "client-slot"   && <ClientSlotPickerScreen onSelect={() => setScreen("client-confirm")} onBack={goClientOTP} />}
        {screen === "client-confirm"&& <ClientConfirmationScreen onApproved={goClientStatus} onPickAnother={goClientSlot} />}
        {screen === "client-status" && <ClientStatusScreen onCancel={goClientPhone} />}
        {screen === "client-rejected" && <ClientRejectionScreen onPickAnother={goClientSlot} onCancel={goClientPhone} />}

        {screen === "sys-empty"   && <EmptyStatesScreen />}
        {screen === "sys-loading" && <LoadingSkeletonScreen />}
        {screen === "sys-error"   && <ErrorStateScreen />}
        {screen === "sys-sms"     && <SmsPreviewScreen />}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakRadio
          label="Palette"
          value={t.palette}
          options={Object.keys(PALETTES).map(k => ({ value: k, label: PALETTES[k].label }))}
          onChange={(v) => setTweak("palette", v)}
        />
        <TweakSection label="Workspace" />
        <TweakToggle
          label="Show prototype chrome"
          value={t.showChrome}
          onChange={(v) => setTweak("showChrome", v)}
        />
        <TweakSection label="Jump to" />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4 }}>
          {SCREENS.map(s => (
            <button key={s.id} onClick={() => setScreen(s.id)} style={{
              padding: "5px 8px", border: "1px solid var(--line, #ddd6c4)",
              background: screen === s.id ? "rgba(15,110,86,.1)" : "transparent",
              color: screen === s.id ? "#0f6e56" : "inherit",
              borderRadius: 5, fontSize: 11, fontWeight: 500,
              cursor: "pointer", textAlign: "left", letterSpacing: "-0.005em",
            }}>{s.short}</button>
          ))}
        </div>
      </TweaksPanel>
    </>
  );
}

/* ─────────────── Top chrome: persona pills + screen tabs ─────────────── */
function Chrome({ screen, setScreen, currentPersona, screensInPersona }) {
  return (
    <div className="qf-chrome">
      <div style={{ display: "flex", alignItems: "center", gap: 6, paddingRight: 12, borderRight: "1px solid var(--line)" }}>
        <QFLogo size={14} showWord={true} />
        <Pill tone="neutral" style={{ marginLeft: 6, fontSize: 10.5 }}>Prototype</Pill>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {PERSONAS.map((p) => {
          const sel = currentPersona === p.id;
          return (
            <button
              key={p.id}
              onClick={() => {
                const first = SCREENS.find(s => s.persona === p.id);
                if (first) setScreen(first.id);
              }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 6,
                padding: "5px 10px",
                border: `1px solid ${sel ? "var(--line-2)" : "transparent"}`,
                background: sel ? "var(--surface)" : "transparent",
                color: sel ? "var(--ink)" : "var(--ink-3)",
                borderRadius: 7,
                fontSize: 12, fontWeight: 500,
                cursor: "pointer",
              }}
            >
              <span style={{
                width: 7, height: 7, borderRadius: "50%",
                background: p.color, opacity: sel ? 1 : 0.5,
              }} />
              {p.label}
            </button>
          );
        })}
      </div>

      <div style={{ height: 22, width: 1, background: "var(--line)" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 2, flex: 1, minWidth: 0, overflow: "auto" }}>
        {screensInPersona.map((s) => {
          const sel = screen === s.id;
          return (
            <button key={s.id} onClick={() => setScreen(s.id)} style={{
              padding: "5px 9px", border: 0, background: "transparent",
              color: sel ? "var(--ink)" : "var(--ink-3)",
              fontSize: 12, fontWeight: sel ? 500 : 400,
              borderRadius: 6, cursor: "pointer",
              whiteSpace: "nowrap",
              borderBottom: sel ? "1.5px solid var(--teal)" : "1.5px solid transparent",
              borderRadius: 0,
              padding: "13px 10px",
            }}>{s.label}</button>
          );
        })}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 8, borderLeft: "1px solid var(--line)" }}>
        <span style={{ fontSize: 11, color: "var(--ink-4)" }}>v0.1</span>
      </div>
    </div>
  );
}

/* ─────────────── Mount ─────────────── */
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
