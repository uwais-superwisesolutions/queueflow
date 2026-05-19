import { useState, useRef, useCallback, type ReactNode } from 'react';
import { Icon, Button, Card, Pill, Avatar, Modal } from '@/components/ui';
import { Sidebar, TopBar } from '@/components/layout';
import { useTick } from '@/hooks/use-tick';
import { formatHMS, formatMS } from '@/lib/time';
import { cn } from '@/lib/utils';
import type { QueueState, Booking, SidebarNavItem } from '@/types';
import { AvailabilityView } from './availability';

// ─────────────────────────────────────────────────────────────────
// Nav
// ─────────────────────────────────────────────────────────────────
const OU_NAV: SidebarNavItem[] = [
  { id: 'queue',        label: 'Queue',              icon: 'users',    count: 8 },
  { id: 'availability', label: 'My availability',    icon: 'calendar' },
  { id: 'timeconfig',   label: 'Time configurations',icon: 'clock' },
  { id: 'notifications',label: 'Notifications',      icon: 'bell',     count: 2 },
  { heading: 'Account' },
  { id: 'profile',      label: 'Profile',            icon: 'user' },
];

// ─────────────────────────────────────────────────────────────────
// Initial mock data — all timestamps relative to "now − offset"
// ─────────────────────────────────────────────────────────────────
function makeInitialQueue(): QueueState {
  const now = Date.now();
  return {
    inService: {
      id: 's1',
      clientName: 'Dr. Marcus Webb',
      clientPhone: '+27 81 220 9871',
      timeslotType: 'Consult',
      reason: 'Chest pain assessment',
      status: 'in_service',
      seatId: 'room-1',
      position: 0,
      requestedAt: new Date(now - 20 * 60_000).toISOString(),
      serviceStartedAt: new Date(now - 14 * 60_000).toISOString(),
      estimatedDuration: 30,
    },
    checkedIn: [
      {
        id: 'c1',
        clientName: 'Jabu Khumalo',
        clientPhone: '+27 73 661 2003',
        timeslotType: 'Follow-up',
        reason: 'Blood pressure review',
        status: 'checked_in',
        seatId: 'room-1',
        position: 1,
        requestedAt: new Date(now - 35 * 60_000).toISOString(),
        checkedInAt: new Date(now - 11 * 60_000).toISOString(),
        estimatedDuration: 15,
      },
      {
        id: 'c2',
        clientName: 'Lerato Dube',
        clientPhone: '+27 82 414 4521',
        timeslotType: 'Consult',
        reason: 'Persistent cough',
        status: 'checked_in',
        seatId: 'room-1',
        position: 2,
        requestedAt: new Date(now - 28 * 60_000).toISOString(),
        checkedInAt: new Date(now - 4 * 60_000).toISOString(),
        estimatedDuration: 30,
      },
    ],
    pending: [
      {
        id: 'p1',
        clientName: 'Beth Cele',
        clientPhone: '+27 82 414 4521',
        timeslotType: 'Consult',
        reason: 'Persistent cough',
        status: 'pending_approval',
        seatId: 'room-1',
        position: 0,
        requestedAt: new Date(now - 14 * 60_000 - 32_000).toISOString(),
        heldUntil: new Date(now + 14 * 60_000 + 32_000).toISOString(),
        estimatedDuration: 30,
      },
      {
        id: 'p2',
        clientName: 'Michael v.d. Berg',
        clientPhone: '+27 73 661 2003',
        timeslotType: 'Follow-up',
        reason: 'Blood pressure review',
        status: 'pending_approval',
        seatId: 'room-1',
        position: 1,
        requestedAt: new Date(now - 12 * 60_000 - 8_000).toISOString(),
        heldUntil: new Date(now + 12 * 60_000 + 8_000).toISOString(),
        estimatedDuration: 15,
      },
      {
        id: 'p3',
        clientName: 'Naledi Sithole',
        clientPhone: '+27 72 909 1234',
        timeslotType: 'Consult',
        reason: 'Annual physical',
        status: 'pending_approval',
        seatId: 'room-1',
        position: 2,
        requestedAt: new Date(now - 8 * 60_000).toISOString(),
        heldUntil: new Date(now + 8 * 60_000).toISOString(),
        estimatedDuration: 30,
      },
    ],
    scheduled: [
      {
        id: 'sc1',
        clientName: 'Khanyi Mbatha',
        timeslotType: 'Consult',
        status: 'approved',
        seatId: 'room-1',
        position: 0,
        requestedAt: new Date(now - 60 * 60_000).toISOString(),
        estimatedDuration: 30,
      },
      {
        id: 'sc2',
        clientName: "Tom O'Brien",
        timeslotType: 'Follow-up',
        status: 'approved',
        seatId: 'room-1',
        position: 1,
        requestedAt: new Date(now - 55 * 60_000).toISOString(),
        estimatedDuration: 15,
      },
      {
        id: 'sc3',
        clientName: 'Priya Naidoo',
        timeslotType: 'Consult',
        status: 'approved',
        seatId: 'room-1',
        position: 2,
        requestedAt: new Date(now - 50 * 60_000).toISOString(),
        estimatedDuration: 30,
      },
    ],
  };
}

// ─────────────────────────────────────────────────────────────────
// Timeslot type colours (matching prototype palette)
// ─────────────────────────────────────────────────────────────────
const TYPE_COLOR: Record<string, string> = {
  'Consult':    '#0f6e56',
  'Follow-up':  '#2a6fcc',
  'Quick check':'#b6791f',
};
function typeColor(t: string) {
  return TYPE_COLOR[t] ?? '#6b6b6b';
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────
export interface OrgUserQueueScreenProps {
  darkExample?: boolean;
  onPersona?: (s: string) => void;
  onSwitchSeat?: () => void;
  onEndShift?: () => void;
  initialPage?: string;
}

// ─────────────────────────────────────────────────────────────────
// Root screen component
// ─────────────────────────────────────────────────────────────────
export function OrgUserQueueScreen({
  darkExample = false,
  onPersona,
  onSwitchSeat,
  onEndShift,
  initialPage = 'queue',
}: OrgUserQueueScreenProps) {
  const [active, setActive] = useState(initialPage);
  const [q, setQ] = useState<QueueState>(makeInitialQueue);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [details, setDetails] = useState<Booking | null>(null);
  const rejectReasonRef = useRef<HTMLTextAreaElement>(null);

  // Drive the live timer
  useTick(1000);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2400);
  }, []);

  // ── State transitions ──────────────────────────────────────────
  const approve = useCallback((id: string) => {
    setQ((s) => {
      const p = s.pending.find(x => x.id === id);
      if (!p) return s;
      const moved: Booking = {
        ...p,
        status: 'checked_in',
        checkedInAt: new Date().toISOString(),
      };
      return {
        ...s,
        pending: s.pending.filter(x => x.id !== id),
        checkedIn: [...s.checkedIn, moved],
      };
    });
    flash('Approved · client notified');
  }, [flash]);

  const reject = useCallback((id: string, reason: string) => {
    setQ((s) => ({ ...s, pending: s.pending.filter(x => x.id !== id) }));
    setRejectId(null);
    flash(reason ? `Declined · "${reason}"` : 'Declined');
  }, [flash]);

  const complete = useCallback(() => {
    setQ((s) => {
      const [next, ...rest] = s.checkedIn;
      const newInService = next
        ? { ...next, status: 'in_service' as const, serviceStartedAt: new Date().toISOString() }
        : null;
      return { ...s, inService: newInService, checkedIn: next ? rest : s.checkedIn };
    });
    flash('Marked complete · next client called');
  }, [flash]);

  const callNext = useCallback(() => {
    setQ((s) => {
      if (s.inService) return s;
      const [next, ...rest] = s.checkedIn;
      if (!next) return s;
      return {
        ...s,
        inService: { ...next, status: 'in_service', serviceStartedAt: new Date().toISOString() },
        checkedIn: rest,
      };
    });
    flash('Called next client');
  }, [flash]);

  const noShow = useCallback(() => {
    setQ((s) => ({ ...s, inService: null }));
    flash('Marked as no-show');
  }, [flash]);

  // ── Sidebar nav with live count ────────────────────────────────
  const totalCount =
    q.pending.length + q.checkedIn.length + (q.inService ? 1 : 0) + q.scheduled.length;

  const navItems = OU_NAV.map(n =>
    n.id === 'queue' ? { ...n, count: totalCount } : n,
  );

  return (
    <div
      className={cn(
        'flex overflow-hidden bg-bg text-ink',
        darkExample && 'qf-dark',
      )}
      style={{ height: 'calc(100vh - 48px)' }}
    >
      <Sidebar
        items={navItems}
        active={active}
        onSelect={setActive}
        footer={
          <button
            onClick={() => onPersona?.('orguser-claim')}
            className="flex items-center gap-[10px] w-full border-0 bg-transparent px-1 py-1.5 cursor-pointer rounded-[6px] text-ink-2 text-left hover:bg-surface-2"
          >
            <Avatar name="Amara Okonkwo" size={26} active />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-ink">Amara Okonkwo</div>
              <div className="text-[11px] text-ink-3">Room 1 · On shift</div>
            </div>
            <Icon name="logout" size={14} className="text-ink-3" />
          </button>
        }
      />

      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {active === 'queue' && (
          <QueueView
            q={q}
            nowHHMM={nowHHMM()}
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
        {active === 'availability' && <AvailabilityView />}
        {active === 'timeconfig' && <TimeConfigsView />}
        {active === 'notifications' && <NotificationsView />}
        {active === 'profile' && <ProfilePlaceholder />}
      </main>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-ink text-bg px-4 py-[10px] rounded-[10px] text-[13px] font-medium shadow-lg z-[90] flex items-center gap-2">
          <Icon name="check" size={14} className="text-teal" stroke={2.5} />
          {toast}
        </div>
      )}

      {/* End shift confirm */}
      <Modal
        open={confirmEnd}
        onClose={() => setConfirmEnd(false)}
        title="End your shift?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmEnd(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => { setConfirmEnd(false); onEndShift?.(); }}>
              End shift
            </Button>
          </>
        }
      >
        <p className="m-0 text-ink-2 text-[14px] leading-[1.55]">
          New booking requests will stop routing to you. Clients in your waiting room
          ({q.checkedIn.length + (q.inService ? 1 : 0)}) will be reassigned or held until
          another consultant claims your seat.
        </p>
      </Modal>

      {/* Reject dialog */}
      <Modal
        open={!!rejectId}
        onClose={() => setRejectId(null)}
        title="Decline booking request"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectId(null)}>Cancel</Button>
            <Button
              variant="danger"
              onClick={() => rejectId && reject(rejectId, rejectReasonRef.current?.value ?? '')}
            >
              Decline
            </Button>
          </>
        }
      >
        <p className="m-0 mb-3 text-[13.5px] text-ink-2">
          The client will see your message. Keep it kind and brief.
        </p>
        <textarea
          ref={rejectReasonRef}
          placeholder="e.g. I'm fully booked this afternoon — please pick a slot tomorrow morning."
          className="w-full min-h-[84px] p-3 border border-line-2 rounded-lg bg-surface text-ink font-[inherit] outline-none resize-y text-[13.5px]"
        />
      </Modal>

      {/* Booking details */}
      <Modal
        open={!!details}
        onClose={() => setDetails(null)}
        title="Booking details"
        width={560}
      >
        {details && <BookingDetailContent c={details} />}
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Queue view (centre panel)
// ─────────────────────────────────────────────────────────────────
interface QueueViewProps {
  q: QueueState;
  nowHHMM: string;
  darkExample: boolean;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onComplete: () => void;
  onCallNext: () => void;
  onNoShow: () => void;
  onEndShift: () => void;
  onSwitchSeat?: () => void;
  onOpenDetails: (b: Booking) => void;
}

function QueueView({
  q,
  onApprove,
  onReject,
  onComplete,
  onCallNext,
  onNoShow,
  onEndShift,
  onSwitchSeat,
  onOpenDetails,
}: QueueViewProps) {
  const totalToday = q.pending.length + q.checkedIn.length + (q.inService ? 1 : 0) + q.scheduled.length;

  // For the "refreshed X ago" counter we just read tick indirectly via useTick
  useTick(1000);
  const secondsRef = useRef(0);
  secondsRef.current = (secondsRef.current + 1) % 6 || 1;

  return (
    <>
      <TopBar
        title="Today's queue"
        subtitle={`Live · ${totalToday} bookings today`}
        right={
          <div className="flex items-center gap-3">
            <button
              onClick={onSwitchSeat}
              className="flex items-center gap-2 bg-surface-2 border border-line rounded-lg px-[10px] py-[6px] cursor-pointer text-ink-2 hover:bg-surface"
            >
              <Icon name="chair" size={14} />
              <span className="text-[12.5px] font-medium">Consultation room 1</span>
              <span className="text-[11.5px] text-ink-3">· Switch seat</span>
            </button>
            <Button variant="danger-ghost" icon="logout" onClick={onEndShift}>
              End shift
            </Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto p-4 pb-10 qf-scroll" style={{ padding: '16px 24px 40px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>

          {/* Left column */}
          <div className="flex flex-col gap-3.5">
            {/* Pending approval */}
            <QueueSection
              title="Pending approval"
              count={q.pending.length}
              tone="amber"
              hint="New requests need your sign-off before they're held."
              empty="No requests waiting."
            >
              {q.pending.map(p => (
                <PendingCard
                  key={p.id}
                  p={p}
                  onApprove={() => onApprove(p.id)}
                  onReject={() => onReject(p.id)}
                  onOpen={() => onOpenDetails(p)}
                />
              ))}
            </QueueSection>

            {/* In service */}
            <QueueSection
              title="In service now"
              count={q.inService ? 1 : 0}
              tone="blue"
              hint="The client you're seeing right now."
              empty="Nobody is being served. Call the next client when ready."
            >
              {q.inService && (
                <InServiceCard
                  c={q.inService}
                  onComplete={onComplete}
                  onNoShow={onNoShow}
                  onOpen={() => onOpenDetails(q.inService!)}
                />
              )}
            </QueueSection>

            {/* Checked in */}
            <QueueSection
              title="Checked in"
              count={q.checkedIn.length}
              tone="teal"
              hint="In the waiting room, in order."
              empty="No one is checked in yet."
              right={
                !q.inService && q.checkedIn.length > 0
                  ? <Button variant="primary" size="sm" icon="bell" onClick={onCallNext}>Call next</Button>
                  : undefined
              }
            >
              {q.checkedIn.map((c, i) => (
                <CheckedInRow key={c.id} c={c} idx={i} onOpen={() => onOpenDetails(c)} />
              ))}
            </QueueSection>

            {/* Scheduled */}
            <QueueSection
              title="Scheduled today"
              count={q.scheduled.length}
              tone="neutral"
              hint="Upcoming, not yet checked in."
              empty="Nothing else scheduled today."
            >
              {q.scheduled.map(c => (
                <ScheduledRow key={c.id} c={c} onOpen={() => onOpenDetails(c)} />
              ))}
            </QueueSection>
          </div>

          {/* Right rail */}
          <aside className="flex flex-col gap-3" style={{ position: 'sticky', top: 16 }}>
            {/* Notifications */}
            <Card style={{ padding: 0 }}>
              <div className="flex items-center gap-2 px-3.5 py-3 border-b border-line">
                <span className="qf-live-dot" />
                <span className="text-[12.5px] font-medium">Notifications</span>
                <Pill tone="coral" className="ml-auto">2 new</Pill>
              </div>
              <div>
                {NOTIFICATIONS.map((n, i, arr) => (
                  <div
                    key={i}
                    className={cn(
                      'flex gap-[10px] px-3.5 py-[10px]',
                      i < arr.length - 1 && 'border-b border-line',
                    )}
                  >
                    <FeedKind kind={n.kind} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] font-medium">{n.title}</div>
                      <div className="text-[11.5px] text-ink-3 mt-px">{n.body}</div>
                      <div className="text-[11px] text-ink-4 mt-[3px]">{n.t}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Daily stats */}
            <Card style={{ padding: 14 }}>
              <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold">
                Today at a glance
              </div>
              <div className="grid grid-cols-2 gap-3 mt-[10px]">
                <MiniStat label="Completed"  value="6"   tone="success" />
                <MiniStat label="No-shows"   value="1"   tone="ink" />
                <MiniStat label="Avg consult"value="22m" tone="ink" />
                <MiniStat label="Behind"     value="+12m" tone="coral" />
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// QueueSection wrapper
// ─────────────────────────────────────────────────────────────────
const SECTION_ACCENT: Record<string, string> = {
  amber:   'var(--amber)',
  blue:    'var(--blue)',
  teal:    'var(--teal)',
  neutral: 'var(--line-2)',
};

interface QueueSectionProps {
  title: string;
  count: number;
  tone?: 'amber' | 'blue' | 'teal' | 'neutral';
  hint?: string;
  empty?: string;
  right?: ReactNode;
  children?: ReactNode;
}

function QueueSection({ title, count, tone = 'neutral', hint, empty, right, children }: QueueSectionProps) {
  const accent = SECTION_ACCENT[tone];
  const hasChildren = (() => {
    if (!children) return false;
    if (Array.isArray(children)) return children.some(Boolean);
    return true;
  })();

  const pillTone = tone === 'neutral' ? 'neutral' : tone;

  return (
    <Card style={{ padding: 0 }}>
      <div className="relative flex items-center gap-[10px] px-4 py-3 border-b border-line">
        <span
          className="absolute left-0 top-[10px] bottom-[10px] w-[3px] rounded-none"
          style={{ background: accent }}
        />
        <h3 className="m-0 text-[13.5px] font-semibold tracking-[-0.005em]">{title}</h3>
        <Pill tone={pillTone as 'neutral' | 'teal' | 'amber' | 'blue' | 'coral' | 'success'}>{count}</Pill>
        <span className="text-[12px] text-ink-3">{hint}</span>
        <span className="flex-1" />
        {right}
      </div>
      <div>
        {!hasChildren ? (
          <div className="px-4 py-[18px] text-ink-3 text-[13px]">{empty}</div>
        ) : (
          children
        )}
      </div>
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────
// Pending card
// ─────────────────────────────────────────────────────────────────
interface PendingCardProps {
  p: Booking;
  onApprove: () => void;
  onReject: () => void;
  onOpen: () => void;
}

function PendingCard({ p, onApprove, onReject, onOpen }: PendingCardProps) {
  // Hold countdown: time remaining until heldUntil
  const holdSecs = p.heldUntil
    ? Math.max(0, Math.floor((new Date(p.heldUntil).getTime() - Date.now()) / 1000))
    : 0;
  const isNew = (Date.now() - new Date(p.requestedAt).getTime()) < 5 * 60_000;

  return (
    <div
      className="px-4 py-3.5 border-b border-line grid items-center gap-3"
      style={{ gridTemplateColumns: 'auto 1fr auto auto' }}
    >
      <Avatar name={p.clientName} size={36} />

      <div className="min-w-0 cursor-pointer" onClick={onOpen}>
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium">{p.clientName}</span>
          {isNew && <Pill tone="amber">New</Pill>}
        </div>
        <div className="text-[12px] text-ink-3 mt-0.5 flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-[2px]"
            style={{ background: typeColor(p.timeslotType) }}
          />
          {p.timeslotType} · {p.estimatedDuration} min
          {p.reason && (
            <> · <span className="text-ink-2">"{p.reason}"</span></>
          )}
        </div>
      </div>

      {/* Hold countdown */}
      <div className="text-right">
        <div className="mono tnum text-[12.5px] text-amber font-medium">
          Hold {formatMS(holdSecs)}
        </div>
        <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.05em]">
          before expires
        </div>
      </div>

      <div className="flex gap-1.5">
        <Button variant="ghost" size="sm" icon="x" onClick={onReject}>Reject</Button>
        <Button variant="teal-tint" size="sm" icon="check" onClick={onApprove}>Approve</Button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// In-service card
// ─────────────────────────────────────────────────────────────────
interface InServiceCardProps {
  c: Booking;
  onComplete: () => void;
  onNoShow: () => void;
  onOpen: () => void;
}

function InServiceCard({ c, onComplete, onNoShow, onOpen }: InServiceCardProps) {
  useTick(1000);
  const elapsedSecs = c.serviceStartedAt
    ? Math.floor((Date.now() - new Date(c.serviceStartedAt).getTime()) / 1000)
    : 0;
  const overrun = elapsedSecs > c.estimatedDuration * 60;
  const startedAt = c.serviceStartedAt
    ? (() => {
        const d = new Date(c.serviceStartedAt);
        return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      })()
    : nowHHMM();

  return (
    <div
      className="p-4 border-b border-line grid items-center gap-4"
      style={{
        gridTemplateColumns: 'auto 1fr auto',
        background: 'linear-gradient(180deg, var(--blue-tint, rgba(42,111,204,.06)), transparent)',
      }}
    >
      <Avatar name={c.clientName} size={48} />

      <div className="cursor-pointer" onClick={onOpen}>
        <div className="flex items-center gap-2">
          <span className="text-[17px] font-medium tracking-[-0.01em]">{c.clientName}</span>
          <Pill tone="blue" dot>In service</Pill>
        </div>
        <div className="text-[12.5px] text-ink-3 mt-1 flex items-center gap-1.5">
          <span
            className="inline-block w-2 h-2 rounded-[2px]"
            style={{ background: typeColor(c.timeslotType) }}
          />
          {c.timeslotType} · {c.estimatedDuration} min scheduled · started {startedAt}
          {c.reason && <> · {c.reason}</>}
        </div>
        <div className="flex gap-2 mt-[10px]">
          <Button variant="primary" icon="check" onClick={onComplete}>Complete consult</Button>
          <Button variant="ghost" icon="user" onClick={onNoShow}>Mark no-show</Button>
          <Button variant="ghost" onClick={onOpen}>View notes</Button>
        </div>
      </div>

      {/* Elapsed timer */}
      <div
        className="text-center px-4 py-2 bg-surface rounded-[12px] border border-line"
        style={{ minWidth: 124 }}
      >
        <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.06em] font-semibold">
          Elapsed
        </div>
        <div
          className={cn(
            'mono tnum text-[30px] font-medium tracking-[-0.02em] leading-[1.1] mt-0.5',
            overrun ? 'text-coral-2' : 'text-blue',
          )}
        >
          {formatHMS(elapsedSecs)}
        </div>
        <div className={cn('text-[11px] mt-0.5', overrun ? 'text-coral-2' : 'text-ink-3')}>
          {overrun
            ? `+${formatMS(elapsedSecs - c.estimatedDuration * 60)} over`
            : `${c.estimatedDuration - Math.floor(elapsedSecs / 60)} min left`}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Checked-in row
// ─────────────────────────────────────────────────────────────────
interface CheckedInRowProps {
  c: Booking;
  idx: number;
  onOpen: () => void;
}

function CheckedInRow({ c, idx, onOpen }: CheckedInRowProps) {
  const waitingMs = c.checkedInAt ? Date.now() - new Date(c.checkedInAt).getTime() : 0;
  const waitingMins = Math.floor(waitingMs / 60_000);

  return (
    <div
      onClick={onOpen}
      className="px-4 py-3 border-b border-line grid items-center gap-3 cursor-pointer hover:bg-surface-2"
      style={{ gridTemplateColumns: 'auto auto 1fr auto auto' }}
    >
      <span className="mono w-[22px] text-[11px] text-ink-4 text-center tracking-[-0.02em]">
        #{idx + 1}
      </span>
      <Avatar name={c.clientName} size={30} />
      <div className="min-w-0">
        <div className="text-[13.5px] font-medium">{c.clientName}</div>
        <div className="text-[11.5px] text-ink-3 flex items-center gap-1">
          <span
            className="inline-block w-[7px] h-[7px] rounded-[2px]"
            style={{ background: typeColor(c.timeslotType) }}
          />
          {c.timeslotType}
        </div>
      </div>
      <div className="text-right">
        <div className={cn('text-[11.5px] font-medium', waitingMins > 10 ? 'text-coral-2' : 'text-ink-2')}>
          {waitingMins === 0 ? 'Just arrived' : `Waiting ${waitingMins}m`}
        </div>
      </div>
      <Icon name="chevronR" size={14} className="text-ink-4" />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Scheduled row
// ─────────────────────────────────────────────────────────────────
interface ScheduledRowProps {
  c: Booking;
  onOpen: () => void;
}

function ScheduledRow({ c, onOpen }: ScheduledRowProps) {
  const requestedDate = new Date(c.requestedAt);
  const timeLabel = `${String(requestedDate.getHours()).padStart(2, '0')}:${String(requestedDate.getMinutes()).padStart(2, '0')}`;

  return (
    <div
      onClick={onOpen}
      className="px-4 py-[10px] border-b border-line grid items-center gap-3 cursor-pointer hover:bg-surface-2"
      style={{ gridTemplateColumns: 'auto 1fr auto auto' }}
    >
      <Avatar name={c.clientName} size={26} />
      <div className="min-w-0">
        <div className="text-[13px] font-medium">{c.clientName}</div>
        <div className="text-[11.5px] text-ink-3 flex items-center gap-1">
          <span
            className="inline-block w-[7px] h-[7px] rounded-[2px]"
            style={{ background: typeColor(c.timeslotType) }}
          />
          {c.timeslotType} · {c.estimatedDuration} min
        </div>
      </div>
      <div className="mono tnum text-[12.5px] text-ink-2">{timeLabel}</div>
      <button
        onClick={(e) => e.stopPropagation()}
        className="border-0 bg-transparent cursor-pointer text-ink-3 p-1.5 rounded-md hover:bg-surface-2"
      >
        <Icon name="dotsH" size={14} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Booking detail modal content
// ─────────────────────────────────────────────────────────────────
function BookingDetailContent({ c }: { c: Booking }) {
  return (
    <div>
      <div className="flex items-center gap-3.5">
        <Avatar name={c.clientName} size={48} />
        <div>
          <div className="text-[17px] font-medium tracking-[-0.01em]">{c.clientName}</div>
          <div className="text-[12.5px] text-ink-3">
            {c.clientPhone ?? '+27 8x ••• ••••'} · no email on file
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-[18px]">
        <Card padding={12}>
          <div className="text-[11px] text-ink-4 uppercase tracking-[0.05em]">Type</div>
          <div className="text-[13.5px] font-medium mt-1">
            {c.timeslotType} · {c.estimatedDuration} min
          </div>
        </Card>
        <Card padding={12}>
          <div className="text-[11px] text-ink-4 uppercase tracking-[0.05em]">Status</div>
          <div className="text-[13.5px] font-medium mt-1 capitalize">
            {c.status.replace('_', ' ')}
          </div>
        </Card>
      </div>

      <div className="mt-4">
        <div className="text-[11px] text-ink-4 uppercase tracking-[0.05em] mb-1.5">Visit history</div>
        <Card padding={0}>
          {[
            ['18 May 2026', 'Today', 'Pending'],
            ['12 Mar 2026', 'Consult · 30 min', 'Completed'],
            ['04 Jan 2026', 'Follow-up · 15 min', 'Completed'],
            ['27 Sep 2025', 'Consult · 30 min', 'Completed'],
          ].map(([d, t, s], i, arr) => (
            <div
              key={i}
              className={cn(
                'px-3.5 py-[10px] grid items-center gap-3',
                i < arr.length - 1 && 'border-b border-line',
              )}
              style={{ gridTemplateColumns: 'auto 1fr auto' }}
            >
              <div className="mono text-[12px] text-ink-3">{d}</div>
              <div className="text-[13px]">{t}</div>
              <Pill tone={s === 'Pending' ? 'amber' : 'success'}>{s}</Pill>
            </div>
          ))}
        </Card>
      </div>

      <div className="mt-4">
        <div className="text-[11px] text-ink-4 uppercase tracking-[0.05em] mb-1.5">Private notes</div>
        <textarea
          defaultValue="History of mild seasonal allergies. Prefers afternoon appointments."
          className="w-full min-h-[70px] p-[10px] border border-line-2 rounded-lg bg-surface text-ink font-[inherit] outline-none resize-y text-[13.5px]"
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Feed-kind dot (notification type indicator)
// ─────────────────────────────────────────────────────────────────
type FeedKindType = 'alert' | 'request' | 'service';

function FeedKind({ kind }: { kind: FeedKindType }) {
  const styles: Record<FeedKindType, string> = {
    alert:   'bg-coral-tint text-coral-2',
    request: 'bg-amber-tint text-amber',
    service: 'bg-teal-tint text-teal-ink',
  };
  const icons: Record<FeedKindType, 'alert' | 'bell' | 'info'> = {
    alert:   'alert',
    request: 'bell',
    service: 'info',
  };
  return (
    <span
      className={cn(
        'mt-0.5 w-[26px] h-[26px] rounded-md flex-none flex items-center justify-center',
        styles[kind],
      )}
    >
      <Icon name={icons[kind]} size={13} />
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────
// Mini stat tile
// ─────────────────────────────────────────────────────────────────
interface MiniStatProps {
  label: string;
  value: string;
  tone?: 'success' | 'coral' | 'ink';
}

function MiniStat({ label, value, tone = 'ink' }: MiniStatProps) {
  const colorClass =
    tone === 'success' ? 'text-success' :
    tone === 'coral'   ? 'text-coral-2' :
    'text-ink';

  return (
    <div>
      <div className="text-[11.5px] text-ink-3">{label}</div>
      <div className={cn('tnum text-[20px] font-medium tracking-[-0.015em]', colorClass)}>
        {value}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Notifications mock
// ─────────────────────────────────────────────────────────────────
const NOTIFICATIONS = [
  {
    kind: 'alert' as FeedKindType,
    title: 'Running 12 min behind schedule',
    body: 'Delay alert sent to 3 clients in your queue.',
    t: '2m ago',
  },
  {
    kind: 'request' as FeedKindType,
    title: 'New request from Beth Cele',
    body: 'Requested 15:00 · Consult.',
    t: '5m ago',
  },
  {
    kind: 'service' as FeedKindType,
    title: 'Sarah Mokoena checked in',
    body: 'Arrived in waiting room.',
    t: '14m ago',
  },
];

// ─────────────────────────────────────────────────────────────────
// Placeholder sub-views (timeconfig / notifications / profile)
// ─────────────────────────────────────────────────────────────────
type ToggleState = Record<string, boolean>;

function TimeConfigsView() {
  const [enabled, setEnabled] = useState<ToggleState>({
    Consult: true,
    'Follow-up': true,
    'Quick check': false,
  });

  const rows = [
    { name: 'Consult',      duration: 30, color: '#0f6e56' },
    { name: 'Follow-up',    duration: 15, color: '#2a6fcc' },
    { name: 'Quick check',  duration: 10, color: '#b6791f' },
  ];

  return (
    <>
      <TopBar
        title="Time configurations"
        subtitle="Choose which services you accept for your seat."
        breadcrumb={['Dashboard', 'Time configurations']}
      />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px' }}>
        <Card style={{ padding: 0, maxWidth: 720 }}>
          {rows.map((r, i) => (
            <div
              key={r.name}
              className={cn(
                'flex items-center gap-3 px-4 py-3.5',
                i < rows.length - 1 && 'border-b border-line',
              )}
            >
              <span
                className="w-6 h-6 rounded-[6px] inline-flex items-center justify-center text-white flex-none"
                style={{ background: r.color }}
              >
                <Icon name="clock" size={12} />
              </span>
              <div className="flex-1">
                <div className="text-[13.5px] font-medium">{r.name}</div>
                <div className="text-[12px] text-ink-3">{r.duration} min · org-wide</div>
              </div>
              <Toggle
                on={enabled[r.name]}
                onChange={(v) => setEnabled(prev => ({ ...prev, [r.name]: v }))}
              />
            </div>
          ))}
        </Card>
        <p className="text-[12.5px] text-ink-3 mt-3">
          Only super users can add new timeslot types.
        </p>
      </div>
    </>
  );
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className="relative border-0 cursor-pointer rounded-full transition-colors duration-150 flex-none"
      style={{
        width: 36,
        height: 22,
        background: on ? 'var(--teal)' : 'var(--line-2)',
      }}
    >
      <span
        className="absolute top-[2px] w-[18px] h-[18px] rounded-full bg-white shadow-sm transition-[left] duration-150"
        style={{ left: on ? 16 : 2 }}
      />
    </button>
  );
}

function NotificationsView() {
  return (
    <>
      <TopBar title="Notifications" />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px' }}>
        <Card style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>
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
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px' }}>
        <Card style={{ padding: 24, textAlign: 'center', color: 'var(--ink-3)' }}>
          Profile (placeholder).
        </Card>
      </div>
    </>
  );
}
