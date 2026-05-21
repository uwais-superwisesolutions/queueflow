import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { Icon, Button, Card, Pill, TextInput, SelectInput } from '@/components/ui';
import { QFLogo } from '@/components/layout';
import { cn } from '@/lib/utils';
import type {
  DepartmentResponse,
  InvitationResponse,
  SeatResponse,
} from '@/types';
import {
  completeOnboarding,
  getOrganisation,
  inviteUser,
  updateOnboardingStep,
} from '@/services/organisationApi';
import {
  createDepartment,
  deleteDepartment,
  listDepartments,
} from '@/services/departmentApi';
import { createSeat, deleteSeat, listSeats } from '@/services/seatApi';
import {
  createTimeslotType,
  deleteTimeslotType,
  listTimeslotTypes,
} from '@/services/timeslotTypeApi';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/api-error';

// ---------------------------------------------------------------------------
// Step model
// ---------------------------------------------------------------------------

interface WizStep {
  id: number;
  label: string;
  /** Persisted to the backend as `onboarding_step`. */
  key: string;
}

const WIZ_STEPS: WizStep[] = [
  { id: 0, label: 'Departments',    key: 'departments' },
  { id: 1, label: 'Seats',          key: 'seats' },
  { id: 2, label: 'Team',           key: 'team' },
  { id: 3, label: 'Timeslot types', key: 'timeslots' },
];

function stepIndexFromKey(key: string | null | undefined): number {
  if (!key) return 0;
  const found = WIZ_STEPS.findIndex((s) => s.key === key);
  return found === -1 ? 0 : found;
}

type SaveFn = () => Promise<boolean>;
type SaveRef = MutableRefObject<SaveFn | null>;

// ---------------------------------------------------------------------------
// Timeslot colour palette
// ---------------------------------------------------------------------------

interface TimeslotColor {
  v: string;   // semantic key stored locally
  bg: string;  // hex actually sent to the backend
}

const TIMESLOT_COLORS: TimeslotColor[] = [
  { v: 'teal',  bg: '#0f6e56' },
  { v: 'blue',  bg: '#2a6fcc' },
  { v: 'plum',  bg: '#7341a8' },
  { v: 'amber', bg: '#b6791f' },
  { v: 'coral', bg: '#d85a30' },
  { v: 'olive', bg: '#7a8336' },
];

function colourFromHex(hex: string | null | undefined): string {
  if (!hex) return TIMESLOT_COLORS[0].v;
  const match = TIMESLOT_COLORS.find((c) => c.bg.toLowerCase() === hex.toLowerCase());
  return match ? match.v : TIMESLOT_COLORS[0].v;
}

// ---------------------------------------------------------------------------
// Wizard shell
// ---------------------------------------------------------------------------

interface OnboardingScreenProps {
  initialStep?: number;
  onFinish?: () => void;
  onExit?: () => void;
}

export function OnboardingScreen({ initialStep = 0, onFinish, onExit }: OnboardingScreenProps) {
  const [step, setStep] = useState(initialStep);
  const [saving, setSaving] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const organisationName = useAuthStore((s) => s.organisationName);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setOrganisationName = useAuthStore((s) => s.setOrganisationName);

  const saveRef = useRef<SaveFn | null>(null);

  // Resume from the server-saved step on first mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await getOrganisation();
        if (cancelled) return;
        if (resp.data.name) setOrganisationName(resp.data.name);
        if (resp.data.onboardingComplete) {
          setOnboardingComplete(true);
          onFinish?.();
          return;
        }
        setStep(stepIndexFromKey(resp.data.onboardingStep));
      } catch {
        // Best-effort resume.
      }
    })();
    return () => { cancelled = true; };
  }, [onFinish, setOnboardingComplete, setOrganisationName]);

  const persistStep = (index: number) => {
    const key = WIZ_STEPS[index]?.key;
    if (!key) return;
    updateOnboardingStep({ onboardingStep: key }).catch(() => {});
  };

  const advance = async (withSave: boolean) => {
    setError(null);
    if (withSave && saveRef.current) {
      setSaving(true);
      try {
        const ok = await saveRef.current();
        if (!ok) return;
      } finally {
        setSaving(false);
      }
    }
    setStep((s) => {
      const ns = Math.min(s + 1, WIZ_STEPS.length - 1);
      if (ns !== s) persistStep(ns);
      return ns;
    });
  };

  const goBack = () =>
    setStep((s) => {
      const ns = Math.max(s - 1, 0);
      if (ns !== s) persistStep(ns);
      return ns;
    });

  const handleFinish = async () => {
    setError(null);
    // Persist the current step's pending edits (timeslot types) before flipping
    // the org to "onboarding complete". Mirrors the save-then-advance contract
    // used by the Continue button.
    if (saveRef.current) {
      setSaving(true);
      try {
        const ok = await saveRef.current();
        if (!ok) {
          setSaving(false);
          return;
        }
      } finally {
        setSaving(false);
      }
    }
    setFinishing(true);
    try {
      await completeOnboarding();
      setOnboardingComplete(true);
      onFinish?.();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not finish onboarding.'));
    } finally {
      setFinishing(false);
    }
  };

  const orgDisplayName = organisationName || 'your organisation';

  const headings = [
    `What departments does ${orgDisplayName} have?`,
    'Add the seats in each department.',
    'Invite your team.',
    'Configure the services you offer.',
  ];

  const descriptions = [
    'Departments group your seats together — think of them as the rooms or service areas in your practice. You can change these later in settings.',
    'A seat is a room, chair, or workstation that a staff member can claim for a shift. The queue routes new requests to whoever is claiming that seat.',
    "We'll send each person an email with a link to set their password. You can skip this and add people later.",
    "These are the services clients can book. Each has a duration and color so they're easy to scan in the live queue.",
  ];

  // Reset save handle whenever step changes so a stale step's saver doesn't run.
  useEffect(() => {
    saveRef.current = null;
  }, [step]);

  return (
    <div className="bg-bg flex flex-col" style={{ minHeight: '100vh' }}>
      <header className="px-4 sm:px-8 py-4 sm:py-5 border-b border-line bg-surface flex flex-wrap items-center gap-4 sm:gap-6">
        <QFLogo size={18} />
        <span className="text-[12px] text-ink-3">{orgDisplayName}</span>
        <ProgressBar step={step} total={WIZ_STEPS.length} className="hidden md:flex flex-1 max-w-[520px] mx-auto" />
        <Button variant="ghost" size="sm" onClick={onExit}>Save &amp; exit</Button>
      </header>

      <main className="flex-1 flex justify-center overflow-auto px-4 sm:px-8 py-8 sm:py-10 pb-[100px]">
        <div className="w-full max-w-[720px]">
          <div className="mb-6">
            <div className="mono text-[11.5px] text-ink-4" style={{ letterSpacing: '0.06em' }}>
              STEP {step + 1} OF {WIZ_STEPS.length}
            </div>
            <h1 className="my-2 text-[26px] font-medium" style={{ letterSpacing: '-0.025em' }}>
              {headings[step]}
            </h1>
            <p className="m-0 text-ink-3 text-[14px] max-w-[540px]">
              {descriptions[step]}
            </p>
          </div>

          {step === 0 && <DepartmentsStep saveRef={saveRef} onError={setError} />}
          {step === 1 && <SeatsStep saveRef={saveRef} onError={setError} />}
          {step === 2 && <InvitesStep saveRef={saveRef} onError={setError} />}
          {step === 3 && <TimeslotsStep saveRef={saveRef} onError={setError} />}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-surface border-t border-line px-4 sm:px-8 py-[14px] flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {WIZ_STEPS.map((s, i) => (
            <span
              key={s.id}
              className="transition-colors duration-200"
              style={{
                width: 24,
                height: 3,
                borderRadius: 2,
                background: i <= step ? 'var(--teal)' : 'var(--line-2)',
              }}
            />
          ))}
        </div>
        <span className="text-[12.5px] text-ink-3">{WIZ_STEPS[step].label}</span>
        <span className="flex-1" />
        {error && (
          <span className="text-coral text-[12px] mr-2" role="alert">{error}</span>
        )}
        <Button
          variant="ghost"
          disabled={step === 0 || saving || finishing}
          onClick={goBack}
          icon="chevronL"
        >
          Back
        </Button>
        {step === 2 && (
          <Button variant="ghost" onClick={() => advance(false)} disabled={saving}>
            Skip for now
          </Button>
        )}
        {step < WIZ_STEPS.length - 1 ? (
          <Button
            variant="primary"
            onClick={() => advance(true)}
            iconRight="arrowR"
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Continue'}
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={handleFinish}
            iconRight="check"
            disabled={finishing}
          >
            {finishing ? 'Finishing…' : 'Finish setup'}
          </Button>
        )}
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// ProgressBar
// ---------------------------------------------------------------------------

interface ProgressBarProps {
  step: number;
  total: number;
  className?: string;
}

function ProgressBar({ step, className }: ProgressBarProps) {
  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {WIZ_STEPS.map((s, i) => {
        const done = i < step;
        const cur = i === step;
        return (
          <div key={s.id} className="flex items-center gap-1.5 flex-1">
            <div
              className="flex items-center gap-2"
              style={{ color: cur ? 'var(--ink)' : done ? 'var(--ink-2)' : 'var(--ink-4)' }}
            >
              <span
                className="inline-flex items-center justify-center text-[11px] font-semibold"
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: done ? 'var(--teal)' : cur ? 'var(--surface)' : 'var(--surface-2)',
                  border: `1.5px solid ${done ? 'var(--teal)' : cur ? 'var(--teal)' : 'var(--line-2)'}`,
                  color: done ? '#fff' : cur ? 'var(--teal)' : 'var(--ink-4)',
                }}
              >
                {done ? <Icon name="check" size={11} stroke={2.5} /> : i + 1}
              </span>
              <span className={cn('text-[12.5px]', cur ? 'font-medium' : 'font-normal')}>{s.label}</span>
            </div>
            {i < WIZ_STEPS.length - 1 && (
              <span
                className="flex-1 h-px"
                style={{ background: i < step ? 'var(--teal)' : 'var(--line)' }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Departments step
// ---------------------------------------------------------------------------

interface DepartmentRow {
  /** UUID for server-side items; `local:<n>` for unsaved rows. */
  id: string;
  name: string;
}

let localIdCounter = 0;
const nextLocalId = () => `local:${++localIdCounter}`;
const isLocalId = (id: string) => id.startsWith('local:');

interface StepProps {
  saveRef: SaveRef;
  onError: (message: string | null) => void;
}

function DepartmentsStep({ saveRef, onError }: StepProps) {
  const [rows, setRows] = useState<DepartmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await listDepartments();
        if (cancelled) return;
        const mapped: DepartmentRow[] = resp.data
          .sort((a, b) => a.displayOrder - b.displayOrder)
          .map((d) => ({ id: d.id, name: d.name }));
        setRows(mapped.length > 0 ? mapped : [{ id: nextLocalId(), name: '' }]);
      } catch (err) {
        onError(getApiErrorMessage(err, 'Could not load departments.'));
        setRows([{ id: nextLocalId(), name: '' }]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onError]);

  saveRef.current = async () => {
    const trimmed = rows.map((r) => ({ ...r, name: r.name.trim() }));
    const toCreate = trimmed.filter((r) => isLocalId(r.id) && r.name.length > 0);
    if (toCreate.length === 0) return true;

    onError(null);
    try {
      for (const r of toCreate) {
        const order = trimmed.findIndex((x) => x.id === r.id);
        const resp = await createDepartment({ name: r.name, displayOrder: order });
        setRows((prev) => prev.map((x) => (x.id === r.id ? { id: resp.data.id, name: resp.data.name } : x)));
      }
      return true;
    } catch (err) {
      onError(getApiErrorMessage(err, 'Could not save departments.'));
      return false;
    }
  };

  const add = () => setRows((prev) => [...prev, { id: nextLocalId(), name: '' }]);

  const remove = async (id: string) => {
    if (isLocalId(id)) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    onError(null);
    try {
      await deleteDepartment(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      onError(getApiErrorMessage(err, 'Could not delete department.'));
    }
  };

  const update = (id: string, name: string) =>
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));

  return (
    <Card padding={0}>
      <div className="px-[18px] py-4 border-b border-line flex items-center gap-3">
        <Icon name="building" size={16} className="text-ink-3" />
        <span className="text-[13px] text-ink-2 font-medium">Departments</span>
        <span className="ml-auto text-[12px] text-ink-3">
          {loading ? 'Loading…' : `${rows.length} added`}
        </span>
      </div>
      <div className="p-2">
        {rows.map((d, i) => (
          <div
            key={d.id}
            className={cn(
              'flex items-center gap-2.5 px-1.5 py-2',
              i < rows.length - 1 && 'border-b border-line',
            )}
          >
            <span
              className="mono inline-flex items-center justify-center text-[11px] font-semibold text-ink-3 bg-surface-2 rounded-[6px] flex-none"
              style={{ width: 22, height: 22 }}
            >
              {i + 1}
            </span>
            <TextInput
              value={d.name}
              onChange={(e) => update(d.id, e.target.value)}
              placeholder="e.g. General Practice"
              wrapClassName="flex-1 min-w-0"
            />
            <button
              onClick={() => remove(d.id)}
              aria-label="Remove"
              className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2"
            >
              <Icon name="trash" size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-line bg-surface-2">
        <Button variant="ghost" icon="plus" onClick={add}>Add department</Button>
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Seats step
// ---------------------------------------------------------------------------

interface SeatRow {
  id: string;       // UUID or local:<n>
  departmentId: string;
  name: string;
  description: string;
}

function SeatsStep({ saveRef, onError }: StepProps) {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [seats, setSeats] = useState<SeatRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [deptResp, seatResp] = await Promise.all([listDepartments(), listSeats()]);
        if (cancelled) return;
        setDepartments(deptResp.data.sort((a, b) => a.displayOrder - b.displayOrder));
        setSeats(
          seatResp.data
            .sort((a, b) => a.displayOrder - b.displayOrder)
            .map((s) => ({
              id: s.id,
              departmentId: s.departmentId,
              name: s.name,
              description: s.description ?? '',
            })),
        );
      } catch (err) {
        onError(getApiErrorMessage(err, 'Could not load seats.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onError]);

  saveRef.current = async () => {
    const trimmed = seats.map((s) => ({ ...s, name: s.name.trim() }));
    const toCreate = trimmed.filter((s) => isLocalId(s.id) && s.name.length > 0);
    if (toCreate.length === 0) return true;

    onError(null);
    try {
      for (const s of toCreate) {
        const order = trimmed.findIndex((x) => x.id === s.id);
        const resp = await createSeat({
          departmentId: s.departmentId,
          name: s.name,
          description: s.description || null,
          requiresApproval: true,
          displayOrder: order,
        });
        setSeats((prev) =>
          prev.map((x) =>
            x.id === s.id
              ? {
                  id: resp.data.id,
                  departmentId: resp.data.departmentId,
                  name: resp.data.name,
                  description: resp.data.description ?? '',
                }
              : x,
          ),
        );
      }
      return true;
    } catch (err) {
      onError(getApiErrorMessage(err, 'Could not save seats.'));
      return false;
    }
  };

  const add = (departmentId: string) =>
    setSeats((prev) => [...prev, { id: nextLocalId(), departmentId, name: '', description: '' }]);

  const remove = async (id: string) => {
    if (isLocalId(id)) {
      setSeats((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    onError(null);
    try {
      await deleteSeat(id);
      setSeats((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      onError(getApiErrorMessage(err, 'Could not delete seat.'));
    }
  };

  const update = (id: string, key: 'name' | 'description', value: string) =>
    setSeats((prev) => prev.map((s) => (s.id === id ? { ...s, [key]: value } : s)));

  if (loading) {
    return (
      <Card padding={20}>
        <div className="text-[13px] text-ink-3">Loading seats…</div>
      </Card>
    );
  }

  if (departments.length === 0) {
    return (
      <Card padding={20}>
        <div className="text-[13px] text-ink-3">
          You haven't added any departments yet. Go back to the previous step to add one before adding seats.
        </div>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-3.5">
      {departments.map((d) => {
        const ds = seats.filter((s) => s.departmentId === d.id);
        return (
          <Card key={d.id} padding={0}>
            <div className="px-4 py-3 border-b border-line flex items-center gap-2.5 bg-surface-2">
              <Icon name="building" size={14} className="text-ink-3" />
              <span className="text-[13px] font-medium">{d.name || 'Untitled department'}</span>
              <Pill tone="neutral" className="ml-1">
                {ds.length} seat{ds.length !== 1 ? 's' : ''}
              </Pill>
              <span className="flex-1" />
              <Button variant="ghost" size="sm" icon="plus" onClick={() => add(d.id)}>Add seat</Button>
            </div>
            <div>
              {ds.length === 0 ? (
                <div className="px-4 py-[18px] text-ink-3 text-[13px]">
                  No seats yet — add one to start.
                </div>
              ) : ds.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    'px-4 py-3 grid items-center gap-2.5',
                    i < ds.length - 1 && 'border-b border-line',
                  )}
                  style={{ gridTemplateColumns: 'auto minmax(0, 1fr) minmax(0, 1.4fr) auto' }}
                >
                  <Icon name="chair" size={15} className="text-ink-3" />
                  <TextInput
                    value={s.name}
                    onChange={(e) => update(s.id, 'name', e.target.value)}
                    placeholder="Seat name"
                    wrapClassName="min-w-0"
                  />
                  <TextInput
                    value={s.description}
                    onChange={(e) => update(s.id, 'description', e.target.value)}
                    placeholder="Optional description"
                    wrapClassName="min-w-0"
                  />
                  <button
                    onClick={() => remove(s.id)}
                    className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2"
                  >
                    <Icon name="trash" size={15} />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Invites step
// ---------------------------------------------------------------------------

type InviteRole = 'org_user' | 'super_user';

interface InviteRow {
  id: string;            // UUID for sent invites, local:<n> otherwise
  email: string;
  role: InviteRole;
  preferredSeat: string; // seat UUID or ""
  accepted: boolean;
  isExisting: boolean;
}

const INVITE_GRID = 'minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1.2fr) auto 32px';

function InvitesStep({ saveRef, onError }: StepProps) {
  const [rows, setRows] = useState<InviteRow[]>([]);
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Fetching seats and existing invitations in parallel.
        const [seatsResp, invitesResp] = await Promise.all([
          listSeats(),
          // organisationApi already exposes getInvitations
          import('@/services/organisationApi').then((m) => m.getInvitations()),
        ]);
        if (cancelled) return;
        setSeats(seatsResp.data);
        const existing: InviteRow[] = (invitesResp.data as InvitationResponse[]).map((i) => ({
          id: i.id,
          email: i.email,
          role: (i.role as InviteRole) ?? 'org_user',
          preferredSeat: '',
          accepted: i.accepted,
          isExisting: true,
        }));
        setRows(existing.length > 0 ? existing : [emptyInviteRow()]);
      } catch (err) {
        onError(getApiErrorMessage(err, 'Could not load invitations.'));
        setRows([emptyInviteRow()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onError]);

  saveRef.current = async () => {
    const toSend = rows.filter((r) => !r.isExisting && r.email.trim().length > 0);
    if (toSend.length === 0) return true;

    onError(null);
    try {
      for (const r of toSend) {
        await inviteUser({
          email: r.email.trim(),
          role: r.role,
          preferredSeat: r.preferredSeat || null,
        });
        setRows((prev) =>
          prev.map((x) => (x.id === r.id ? { ...x, isExisting: true } : x)),
        );
      }
      return true;
    } catch (err) {
      onError(getApiErrorMessage(err, 'Could not send invites.'));
      return false;
    }
  };

  const add = () => setRows((prev) => [...prev, emptyInviteRow()]);
  const remove = (id: string) => setRows((prev) => prev.filter((r) => r.id !== id));
  const update = <K extends keyof Omit<InviteRow, 'id' | 'accepted' | 'isExisting'>>(
    id: string,
    key: K,
    value: InviteRow[K],
  ) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  const seatOptions = useMemo(
    () => [{ value: '', label: '—' }, ...seats.map((s) => ({ value: s.id, label: s.name }))],
    [seats],
  );
  const roleOptions: { value: InviteRole; label: string }[] = [
    { value: 'org_user', label: 'Org user' },
    { value: 'super_user', label: 'Super user' },
  ];

  const readyCount = rows.filter((r) => !r.isExisting && r.email.trim().length > 0).length;

  if (loading) {
    return (
      <Card padding={20}>
        <div className="text-[13px] text-ink-3">Loading invites…</div>
      </Card>
    );
  }

  return (
    <Card padding={0}>
      <div
        className="hidden md:grid px-4 py-2.5 border-b border-line bg-surface-2 text-[11.5px] text-ink-3 font-medium uppercase"
        style={{ gridTemplateColumns: INVITE_GRID, letterSpacing: '0.05em' }}
      >
        <span>Email</span>
        <span>Role</span>
        <span>Assigned seat</span>
        <span>Status</span>
        <span />
      </div>
      <div>
        {rows.map((inv, i) => (
          <div
            key={inv.id}
            className={cn(
              'flex flex-col md:grid px-4 py-3 md:py-2.5 items-stretch md:items-center gap-3 md:gap-2.5',
              i < rows.length - 1 && 'border-b border-line',
            )}
            style={{ gridTemplateColumns: INVITE_GRID }}
          >
            <div className="min-w-0">
              <div className="md:hidden text-[12px] text-ink-3 font-medium mb-1.5">Email</div>
              <TextInput
                value={inv.email}
                onChange={(e) => update(inv.id, 'email', e.target.value)}
                placeholder="name@clinic.com"
                wrapClassName="min-w-0 w-full"
                disabled={inv.isExisting}
              />
            </div>
            <div className="min-w-0">
              <div className="md:hidden text-[12px] text-ink-3 font-medium mb-1.5">Role</div>
              <SelectInput
                value={inv.role}
                onChange={(e) => update(inv.id, 'role', e.target.value as InviteRole)}
                options={roleOptions}
                wrapClassName="min-w-0 w-full"
                disabled={inv.isExisting}
              />
            </div>
            <div className="min-w-0">
              <div className="md:hidden text-[12px] text-ink-3 font-medium mb-1.5">Assigned seat</div>
              <SelectInput
                value={inv.preferredSeat}
                onChange={(e) => update(inv.id, 'preferredSeat', e.target.value)}
                options={seatOptions}
                wrapClassName="min-w-0 w-full"
                disabled={inv.isExisting}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="md:hidden text-[12px] text-ink-3 font-medium">Status</span>
              <Pill tone={inv.isExisting ? (inv.accepted ? 'success' : 'amber') : 'neutral'}>
                {inv.isExisting ? (inv.accepted ? 'Accepted' : 'Sent') : 'New'}
              </Pill>
            </div>
            <button
              onClick={() => remove(inv.id)}
              disabled={inv.isExisting}
              className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2 disabled:opacity-30 disabled:cursor-not-allowed self-end md:self-auto"
              aria-label="Remove invite"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-line bg-surface-2 flex flex-wrap items-center gap-2">
        <Button variant="ghost" icon="plus" onClick={add}>Add another</Button>
        <span className="flex-1" />
        <span className="text-[12px] text-ink-3">
          {readyCount} invite{readyCount !== 1 ? 's' : ''} ready to send
        </span>
      </div>
    </Card>
  );
}

function emptyInviteRow(): InviteRow {
  return {
    id: nextLocalId(),
    email: '',
    role: 'org_user',
    preferredSeat: '',
    accepted: false,
    isExisting: false,
  };
}

// ---------------------------------------------------------------------------
// Timeslots step
// ---------------------------------------------------------------------------

interface TimeslotRow {
  id: string;            // UUID or local:<n>
  name: string;
  durationMinutes: number;
  color: string;         // semantic key
}

function TimeslotsStep({ saveRef, onError }: StepProps) {
  const [rows, setRows] = useState<TimeslotRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await listTimeslotTypes();
        if (cancelled) return;
        const mapped: TimeslotRow[] = resp.data.map((t) => ({
          id: t.id,
          name: t.name,
          durationMinutes: t.durationMinutes,
          color: colourFromHex(t.color),
        }));
        setRows(mapped.length > 0 ? mapped : [emptyTimeslotRow()]);
      } catch (err) {
        onError(getApiErrorMessage(err, 'Could not load timeslot types.'));
        setRows([emptyTimeslotRow()]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [onError]);

  saveRef.current = async () => {
    const toCreate = rows.filter(
      (r) => isLocalId(r.id) && r.name.trim().length > 0 && r.durationMinutes > 0,
    );
    if (toCreate.length === 0) return true;

    onError(null);
    try {
      for (const r of toCreate) {
        const hex = TIMESLOT_COLORS.find((c) => c.v === r.color)?.bg ?? null;
        const resp = await createTimeslotType({
          name: r.name.trim(),
          durationMinutes: r.durationMinutes,
          color: hex,
        });
        setRows((prev) =>
          prev.map((x) =>
            x.id === r.id
              ? {
                  id: resp.data.id,
                  name: resp.data.name,
                  durationMinutes: resp.data.durationMinutes,
                  color: colourFromHex(resp.data.color),
                }
              : x,
          ),
        );
      }
      return true;
    } catch (err) {
      onError(getApiErrorMessage(err, 'Could not save timeslot types.'));
      return false;
    }
  };

  const add = () => setRows((prev) => [...prev, emptyTimeslotRow()]);
  const remove = async (id: string) => {
    if (isLocalId(id)) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      return;
    }
    onError(null);
    try {
      await deleteTimeslotType(id);
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      onError(getApiErrorMessage(err, 'Could not delete timeslot type.'));
    }
  };

  const update = <K extends keyof Omit<TimeslotRow, 'id'>>(
    id: string,
    key: K,
    value: TimeslotRow[K],
  ) => setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [key]: value } : r)));

  if (loading) {
    return (
      <Card padding={20}>
        <div className="text-[13px] text-ink-3">Loading timeslot types…</div>
      </Card>
    );
  }

  return (
    <Card padding={0}>
      <div className="p-2">
        {rows.map((t, i) => {
          const colorObj = TIMESLOT_COLORS.find((c) => c.v === t.color) ?? TIMESLOT_COLORS[0];
          return (
            <div
              key={t.id}
              className={cn(
                'flex flex-col md:grid items-stretch md:items-center gap-3 md:gap-2.5 p-3 md:p-2.5',
                i < rows.length - 1 && 'border-b border-line',
              )}
              style={{ gridTemplateColumns: 'auto minmax(0, 2fr) minmax(0, 1fr) auto auto' }}
            >
              <div className="flex items-center gap-2">
                <div
                  className="inline-flex items-center justify-center text-white rounded-[8px] flex-none"
                  style={{ width: 30, height: 30, background: colorObj.bg }}
                >
                  <Icon name="clock" size={14} />
                </div>
                <span className="md:hidden text-[12px] text-ink-3 font-medium">Service</span>
              </div>
              <div className="min-w-0">
                <div className="md:hidden text-[12px] text-ink-3 font-medium mb-1.5">Service name</div>
                <TextInput
                  value={t.name}
                  onChange={(e) => update(t.id, 'name', e.target.value)}
                  placeholder="Service name (e.g. Consult)"
                  wrapClassName="min-w-0 w-full"
                />
              </div>
              <div className="min-w-0">
                <div className="md:hidden text-[12px] text-ink-3 font-medium mb-1.5">Duration</div>
                <div className="flex items-center gap-2 bg-surface border border-line-2 rounded-[8px] px-2.5 h-[38px] min-w-0">
                  <input
                    type="number"
                    min={1}
                    value={t.durationMinutes}
                    onChange={(e) => update(t.id, 'durationMinutes', Math.max(1, Number(e.target.value) || 0))}
                    className="flex-1 h-full border-0 bg-transparent font-[inherit] text-ink outline-none w-10 min-w-0"
                  />
                  <span className="text-[12px] text-ink-3">min</span>
                </div>
              </div>
              <div>
                <div className="md:hidden text-[12px] text-ink-3 font-medium mb-1.5">Color</div>
                <div className="flex flex-wrap gap-2 md:gap-1.5">
                  {TIMESLOT_COLORS.map((c) => (
                    <button
                      key={c.v}
                      onClick={() => update(t.id, 'color', c.v)}
                      aria-label={c.v}
                      className="border-0 cursor-pointer rounded-[6px]"
                      style={{
                        width: 28,
                        height: 28,
                        background: c.bg,
                        boxShadow:
                          t.color === c.v
                            ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)'
                            : 'inset 0 0 0 1px rgba(20,18,12,.06)',
                      }}
                    />
                  ))}
                </div>
              </div>
              <button
                onClick={() => remove(t.id)}
                className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2 self-end md:self-auto"
                aria-label="Remove timeslot type"
              >
                <Icon name="trash" size={14} />
              </button>
            </div>
          );
        })}
      </div>
      <div className="p-3 border-t border-line bg-surface-2">
        <Button variant="ghost" icon="plus" onClick={add}>Add timeslot type</Button>
      </div>
    </Card>
  );
}

function emptyTimeslotRow(): TimeslotRow {
  return { id: nextLocalId(), name: '', durationMinutes: 30, color: 'teal' };
}
