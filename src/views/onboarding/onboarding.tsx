import { useEffect, useState } from 'react';
import { Icon, Button, Card, Divider, Pill, TextInput, SelectInput, QRPlaceholder } from '@/components/ui';
import { QFLogo } from '@/components/layout';
import { cn } from '@/lib/utils';
import type { IconName } from '@/types';
import { completeOnboarding, getOrganisation, updateOnboardingStep } from '@/services/organisationApi';
import { useAuthStore } from '@/stores/authStore';
import { getApiErrorMessage } from '@/lib/api-error';

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
  { id: 4, label: 'Share your link',key: 'share' },
];

function stepIndexFromKey(key: string | null | undefined): number {
  if (!key) return 0;
  const found = WIZ_STEPS.findIndex((s) => s.key === key);
  return found === -1 ? 0 : found;
}

interface TimeslotColor {
  v: string;
  bg: string;
}

const TIMESLOT_COLORS: TimeslotColor[] = [
  { v: 'teal',  bg: '#0f6e56' },
  { v: 'blue',  bg: '#2a6fcc' },
  { v: 'plum',  bg: '#7341a8' },
  { v: 'amber', bg: '#b6791f' },
  { v: 'coral', bg: '#d85a30' },
  { v: 'olive', bg: '#7a8336' },
];

interface Department {
  id: number;
  name: string;
}

interface Seat {
  id: number;
  deptId: number;
  name: string;
  desc: string;
}

interface Invite {
  id: number;
  name: string;
  email: string;
  role: string;
  seat: string;
}

interface TimeslotType {
  id: number;
  name: string;
  duration: number;
  color: string;
}

interface OnboardingScreenProps {
  initialStep?: number;
  onFinish?: () => void;
  onExit?: () => void;
}

export function OnboardingScreen({ initialStep = 0, onFinish, onExit }: OnboardingScreenProps) {
  const [step, setStep] = useState(initialStep);
  const [finishing, setFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const organisationName = useAuthStore((s) => s.organisationName);
  const setOnboardingComplete = useAuthStore((s) => s.setOnboardingComplete);
  const setOrganisationName = useAuthStore((s) => s.setOrganisationName);

  // Resume from the server-saved step on first mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const resp = await getOrganisation();
        if (cancelled) return;
        if (resp.data.name) setOrganisationName(resp.data.name);
        if (resp.data.onboardingComplete) {
          // Already done — bounce out of the wizard.
          setOnboardingComplete(true);
          onFinish?.();
          return;
        }
        setStep(stepIndexFromKey(resp.data.onboardingStep));
      } catch {
        // Best-effort resume. Stay on initialStep if the org call fails.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onFinish, setOnboardingComplete, setOrganisationName]);

  const persistStep = (index: number) => {
    const key = WIZ_STEPS[index]?.key;
    if (!key) return;
    // Fire-and-forget: a failed save shouldn't block the user navigating.
    updateOnboardingStep({ onboardingStep: key }).catch(() => {});
  };

  const handleFinish = async () => {
    setError(null);
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

  const [departments, setDepartments] = useState<Department[]>([
    { id: 1, name: 'General Practice' },
    { id: 2, name: 'Dental' },
    { id: 3, name: 'Pediatrics' },
  ]);
  const [seats, setSeats] = useState<Seat[]>([
    { id: 1, deptId: 1, name: 'Consultation room 1', desc: "Dr. Okonkwo's primary room" },
    { id: 2, deptId: 1, name: 'Consultation room 2', desc: '' },
    { id: 3, deptId: 1, name: 'Consultation room 3', desc: '' },
    { id: 4, deptId: 2, name: 'Dental chair A', desc: '' },
    { id: 5, deptId: 2, name: 'Dental chair B', desc: '' },
    { id: 6, deptId: 3, name: 'Peds room', desc: 'Quieter wing' },
  ]);
  const [invites, setInvites] = useState<Invite[]>([
    { id: 1, name: 'Amara Okonkwo',  email: 'amara@bryanstonfp.co.za', role: 'Org user',   seat: 'Consultation room 1' },
    { id: 2, name: 'Sipho Dlamini',  email: 'sipho@bryanstonfp.co.za', role: 'Org user',   seat: 'Consultation room 2' },
    { id: 3, name: 'Kefilwe Nkosi',  email: 'kefi@bryanstonfp.co.za',  role: 'Super user', seat: '—' },
    { id: 4, name: '',               email: '',                         role: 'Org user',   seat: '—' },
  ]);
  const [timeslots, setTimeslots] = useState<TimeslotType[]>([
    { id: 1, name: 'Consult',   duration: 30, color: 'teal' },
    { id: 2, name: 'Follow-up', duration: 15, color: 'blue' },
  ]);

  const next = () =>
    setStep((s) => {
      const ns = Math.min(s + 1, WIZ_STEPS.length - 1);
      if (ns !== s) persistStep(ns);
      return ns;
    });
  const prev = () =>
    setStep((s) => {
      const ns = Math.max(s - 1, 0);
      if (ns !== s) persistStep(ns);
      return ns;
    });

  const orgDisplayName = organisationName || 'your organisation';

  const headings = [
    `What departments does ${orgDisplayName} have?`,
    'Add the seats in each department.',
    'Invite your team.',
    'Configure the services you offer.',
    'Share your queue with clients.',
  ];

  const descriptions = [
    'Departments group your seats together — think of them as the rooms or service areas in your practice. You can change these later in settings.',
    'A seat is a room, chair, or workstation that a staff member can claim for a shift. The queue routes new requests to whoever is claiming that seat.',
    "We'll send each person an email with a link to set their password. You can skip this and add people later.",
    'These are the services clients can book. Each has a duration and color so they\'re easy to scan in the live queue.',
    'Print the QR or copy the link. Anyone who scans this can join your queue and pick a time.',
  ];

  return (
    <div
      className="bg-bg flex flex-col"
      style={{ minHeight: 'calc(100vh - 48px)' }}
    >
      <header className="px-8 py-5 border-b border-line bg-surface flex items-center gap-6">
        <QFLogo size={18} />
        <span className="text-[12px] text-ink-3">{orgDisplayName}</span>
        <ProgressBar step={step} total={WIZ_STEPS.length} className="flex-1 max-w-[520px] mx-auto" />
        <Button variant="ghost" size="sm" onClick={onExit}>Save &amp; exit</Button>
      </header>

      <main
        className="flex-1 flex justify-center overflow-auto"
        style={{ padding: '40px 32px 100px' }}
      >
        <div className="w-full max-w-[720px]">
          <div className="mb-6">
            <div className="mono text-[11.5px] text-ink-4" style={{ letterSpacing: '0.06em' }}>
              STEP {step + 1} OF {WIZ_STEPS.length}
            </div>
            <h1
              className="my-2 text-[26px] font-medium"
              style={{ letterSpacing: '-0.025em' }}
            >
              {headings[step]}
            </h1>
            <p className="m-0 text-ink-3 text-[14px] max-w-[540px]">
              {descriptions[step]}
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
            <ShareStep
              departments={departments}
              seats={seats}
              invites={invites}
              orgName={orgDisplayName}
            />
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 bg-surface border-t border-line px-8 py-[14px] flex items-center gap-3">
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
        <Button variant="ghost" disabled={step === 0 || finishing} onClick={prev} icon="chevronL">Back</Button>
        {step === 2 && <Button variant="ghost" onClick={next}>Skip for now</Button>}
        {step < WIZ_STEPS.length - 1
          ? <Button variant="primary" onClick={next} iconRight="arrowR">Continue</Button>
          : (
            <Button
              variant="primary"
              onClick={handleFinish}
              iconRight="check"
              disabled={finishing}
            >
              {finishing ? 'Finishing…' : 'Finish setup'}
            </Button>
          )
        }
      </footer>
    </div>
  );
}

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

interface DepartmentsStepProps {
  departments: Department[];
  setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
}

function DepartmentsStep({ departments, setDepartments }: DepartmentsStepProps) {
  const add = () => setDepartments(prev => [...prev, { id: Date.now(), name: '' }]);
  const remove = (id: number) => setDepartments(prev => prev.filter(d => d.id !== id));
  const update = (id: number, name: string) =>
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, name } : d));

  return (
    <Card padding={0}>
      <div className="px-[18px] py-4 border-b border-line flex items-center gap-3">
        <Icon name="building" size={16} className="text-ink-3" />
        <span className="text-[13px] text-ink-2 font-medium">Departments</span>
        <span className="ml-auto text-[12px] text-ink-3">{departments.length} added</span>
      </div>
      <div className="p-2">
        {departments.map((d, i) => (
          <div
            key={d.id}
            className={cn(
              'flex items-center gap-2.5 px-1.5 py-2',
              i < departments.length - 1 && 'border-b border-line',
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
              onChange={e => update(d.id, e.target.value)}
              placeholder="e.g. General Practice"
              wrapClassName="flex-1"
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

interface SeatsStepProps {
  departments: Department[];
  seats: Seat[];
  setSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
}

function SeatsStep({ departments, seats, setSeats }: SeatsStepProps) {
  const add = (deptId: number) =>
    setSeats(prev => [...prev, { id: Date.now(), deptId, name: '', desc: '' }]);
  const remove = (id: number) => setSeats(prev => prev.filter(s => s.id !== id));
  const update = (id: number, k: keyof Omit<Seat, 'id' | 'deptId'>, v: string) =>
    setSeats(prev => prev.map(s => s.id === id ? { ...s, [k]: v } : s));

  return (
    <div className="flex flex-col gap-3.5">
      {departments.map(d => {
        const ds = seats.filter(s => s.deptId === d.id);
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
                  style={{ gridTemplateColumns: 'auto 1fr 1.4fr auto' }}
                >
                  <Icon name="chair" size={15} className="text-ink-3" />
                  <TextInput
                    value={s.name}
                    onChange={e => update(s.id, 'name', e.target.value)}
                    placeholder="Seat name"
                  />
                  <TextInput
                    value={s.desc}
                    onChange={e => update(s.id, 'desc', e.target.value)}
                    placeholder="Optional description"
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

interface InvitesStepProps {
  invites: Invite[];
  setInvites: React.Dispatch<React.SetStateAction<Invite[]>>;
  seats: Seat[];
}

function InvitesStep({ invites, setInvites, seats }: InvitesStepProps) {
  const seatOptions = ['—', ...seats.map(s => s.name).filter(Boolean)];
  const add = () =>
    setInvites(prev => [...prev, { id: Date.now(), name: '', email: '', role: 'Org user', seat: '—' }]);
  const remove = (id: number) => setInvites(prev => prev.filter(i => i.id !== id));
  const update = (id: number, k: keyof Omit<Invite, 'id'>, v: string) =>
    setInvites(prev => prev.map(i => i.id === id ? { ...i, [k]: v } : i));

  const readyCount = invites.filter(i => i.email).length;

  const invitesGridTemplate =
    'minmax(0, 1.1fr) minmax(0, 1.4fr) minmax(0, 1fr) minmax(0, 1.2fr) 32px';

  return (
    <Card padding={0}>
      <div
        className="grid px-4 py-2.5 border-b border-line bg-surface-2 text-[11.5px] text-ink-3 font-medium uppercase"
        style={{ gridTemplateColumns: invitesGridTemplate, letterSpacing: '0.05em' }}
      >
        <span>Name</span>
        <span>Email</span>
        <span>Role</span>
        <span>Assigned seat</span>
        <span />
      </div>
      <div>
        {invites.map((inv, i) => (
          <div
            key={inv.id}
            className={cn(
              'grid px-4 py-2.5 items-center gap-2.5',
              i < invites.length - 1 && 'border-b border-line',
            )}
            style={{ gridTemplateColumns: invitesGridTemplate }}
          >
            <TextInput
              value={inv.name}
              onChange={e => update(inv.id, 'name', e.target.value)}
              placeholder="Full name"
              wrapClassName="min-w-0"
            />
            <TextInput
              value={inv.email}
              onChange={e => update(inv.id, 'email', e.target.value)}
              placeholder="name@clinic.com"
              wrapClassName="min-w-0"
            />
            <SelectInput
              value={inv.role}
              onChange={e => update(inv.id, 'role', e.target.value)}
              options={['Org user', 'Super user']}
              wrapClassName="min-w-0"
            />
            <SelectInput
              value={inv.seat}
              onChange={e => update(inv.id, 'seat', e.target.value)}
              options={seatOptions}
              wrapClassName="min-w-0"
            />
            <button
              onClick={() => remove(inv.id)}
              className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2"
            >
              <Icon name="trash" size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="p-3 border-t border-line bg-surface-2 flex items-center gap-2">
        <Button variant="ghost" icon="plus" onClick={add}>Add another</Button>
        <span className="flex-1" />
        <span className="text-[12px] text-ink-3">
          {readyCount} invite{readyCount !== 1 ? 's' : ''} ready to send
        </span>
        <Button variant="primary" icon="send">Send invites</Button>
      </div>
    </Card>
  );
}

interface TimeslotsStepProps {
  timeslots: TimeslotType[];
  setTimeslots: React.Dispatch<React.SetStateAction<TimeslotType[]>>;
}

function TimeslotsStep({ timeslots, setTimeslots }: TimeslotsStepProps) {
  const add = () =>
    setTimeslots(prev => [...prev, { id: Date.now(), name: '', duration: 30, color: 'teal' }]);
  const remove = (id: number) => setTimeslots(prev => prev.filter(t => t.id !== id));
  const update = <K extends keyof Omit<TimeslotType, 'id'>>(id: number, k: K, v: TimeslotType[K]) =>
    setTimeslots(prev => prev.map(t => t.id === id ? { ...t, [k]: v } : t));

  return (
    <Card padding={0}>
      <div className="p-2">
        {timeslots.map((t, i) => {
          const colorObj = TIMESLOT_COLORS.find(c => c.v === t.color) ?? TIMESLOT_COLORS[0];
          return (
            <div
              key={t.id}
              className={cn(
                'grid items-center gap-2.5 p-2.5',
                i < timeslots.length - 1 && 'border-b border-line',
              )}
              style={{ gridTemplateColumns: 'auto 2fr 1fr auto auto' }}
            >
              <div
                className="inline-flex items-center justify-center text-white rounded-[8px] flex-none"
                style={{ width: 30, height: 30, background: colorObj.bg }}
              >
                <Icon name="clock" size={14} />
              </div>
              <TextInput
                value={t.name}
                onChange={e => update(t.id, 'name', e.target.value)}
                placeholder="Service name (e.g. Consult)"
              />
              <div className="flex items-center gap-2 bg-surface border border-line-2 rounded-[8px] px-2.5 h-[38px]">
                <input
                  type="number"
                  value={t.duration}
                  onChange={e => update(t.id, 'duration', +e.target.value)}
                  className="flex-1 h-full border-0 bg-transparent font-[inherit] text-ink outline-none w-10"
                />
                <span className="text-[12px] text-ink-3">min</span>
              </div>
              <div className="flex gap-1.5">
                {TIMESLOT_COLORS.map(c => (
                  <button
                    key={c.v}
                    onClick={() => update(t.id, 'color', c.v)}
                    aria-label={c.v}
                    className="border-0 cursor-pointer rounded-[6px]"
                    style={{
                      width: 22,
                      height: 22,
                      background: c.bg,
                      boxShadow:
                        t.color === c.v
                          ? '0 0 0 2px var(--surface), 0 0 0 4px var(--ink)'
                          : 'inset 0 0 0 1px rgba(20,18,12,.06)',
                    }}
                  />
                ))}
              </div>
              <button
                onClick={() => remove(t.id)}
                className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-[6px] hover:bg-surface-2"
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

interface ShareStepProps {
  departments: Department[];
  seats: Seat[];
  invites: Invite[];
  orgName: string;
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function ShareStep({ departments, seats, invites, orgName }: ShareStepProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const teamCount = invites.filter(i => i.email).length;
  const deptNames = departments.map(d => d.name).filter(Boolean).join(', ');
  const slug = slugify(orgName) || 'your-organisation';

  const summaryItems: [string, string, IconName][] = [
    ['1 organisation', orgName, 'building'],
    [`${departments.length} department${departments.length !== 1 ? 's' : ''}`, deptNames || 'None', 'grid'],
    [`${seats.length} seats, ${teamCount} team members`, 'All ready to claim', 'users'],
  ];

  return (
    <Card padding={28}>
      <div className="grid items-center gap-7" style={{ gridTemplateColumns: 'auto 1fr' }}>
        <QRPlaceholder size={180} seed={slug} />
        <div>
          <Pill tone="teal" dot>Your portal is live</Pill>
          <h3
            className="text-[18px] font-medium mt-2.5 mb-1.5"
            style={{ letterSpacing: '-0.015em' }}
          >
            Anyone with this link can join your queue.
          </h3>
          <p className="m-0 text-ink-3 text-[13.5px]">
            Print the QR for reception or share the URL on your website and Google profile.
          </p>
          <div className="flex items-center gap-2.5 mt-[18px] px-3 py-2.5 bg-surface-2 border border-line rounded-[8px]">
            <Icon name="link" size={14} className="text-ink-3" />
            <span className="mono flex-1 text-[12.5px] text-ink">
              queueflow.io/q/{slug}
            </span>
            <Button
              variant="ghost"
              size="sm"
              icon={copied ? 'check' : 'copy'}
              onClick={handleCopy}
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <div className="flex gap-2 mt-3.5">
            <Button variant="secondary" icon="download">Download QR</Button>
            <Button variant="secondary" icon="link">Open client portal preview</Button>
          </div>
        </div>
      </div>
      <Divider className="my-6" />
      <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {summaryItems.map(([k, v, ic]) => (
          <div key={k} className="flex gap-2.5 items-start">
            <span
              className="inline-flex items-center justify-center rounded-[7px] bg-teal-tint text-teal-ink flex-none"
              style={{ width: 28, height: 28 }}
            >
              <Icon name={ic} size={14} />
            </span>
            <div>
              <div className="text-[13px] font-medium">{k}</div>
              <div className="text-[12px] text-ink-3">{v}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
