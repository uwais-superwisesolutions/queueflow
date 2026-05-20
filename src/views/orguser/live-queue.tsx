/* eslint-disable react-hooks/set-state-in-effect */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Avatar,
  Button,
  Card,
  Field,
  Icon,
  Modal,
  Pill,
  SkeletonBox,
  SkeletonLine,
  TextInput,
  useConfirm,
} from '@/components/ui';
import { ProfileMenu, TopBar } from '@/components/layout';
import { useTick } from '@/hooks/use-tick';
import { usePolling } from '@/hooks/use-polling';
import { POLL_INTERVAL_MS } from '@/lib/realtime-channels';
import { formatHMS } from '@/lib/time';
import { cn } from '@/lib/utils';
import { getApiErrorMessage } from '@/lib/api-error';
import { useAuthStore } from '@/stores/authStore';
import { useClientAuthStore } from '@/stores/clientAuthStore';
import { listSeats } from '@/services/seatApi';
import { listTimeslotTypes } from '@/services/timeslotTypeApi';
import {
  bookingDecision,
  cancelBooking,
  checkInBooking,
  completeBooking,
  getQueue,
  noShowBooking,
  startBooking,
} from '@/services/queueBookingApi';
import {
  endShift,
  getMySeatAssignment,
  heartbeat,
} from '@/services/sessionApi';
import type {
  BookingResponse,
  QueueResponse,
  SeatAssignmentResponse,
  SeatResponse,
  TimeslotTypeResponse,
} from '@/types';
import { fmtTime, minutesSince } from '@/lib/date';

interface OrgUserQueueScreenProps {
  /** Called when "End shift" succeeds — route wrapper sends user to /claim. */
  onShiftEnded: () => void;
  /** Called when the user clicks "Sign out" from the profile menu. */
  onSignOut?: () => void;
}

const EMPTY_QUEUE: QueueResponse = {
  pendingApproval: [],
  scheduled: [],
  checkedIn: [],
  inService: [],
};

function clientLabel(b: BookingResponse): string {
  if (b.clientId) return `Client ${b.clientId.slice(0, 6)}`;
  return 'Client';
}


export function OrgUserQueueScreen({ onShiftEnded, onSignOut }: OrgUserQueueScreenProps) {
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role);
  const orgName = useAuthStore((s) => s.organisationName);
  const clearAuth = useAuthStore((s) => s.clear);
  const clearClientAuth = useClientAuthStore((s) => s.clear);

  const [queue, setQueue] = useState<QueueResponse>(EMPTY_QUEUE);
  const [seat, setSeat] = useState<SeatResponse | null>(null);
  const [assignment, setAssignment] = useState<SeatAssignmentResponse | null>(null);
  const [timeslotTypes, setTimeslotTypes] = useState<TimeslotTypeResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [endingShift, setEndingShift] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const confirm = useConfirm();

  // Live elapsed-time tick for the "In service" timer.
  useTick(1000);

  const ttById = useMemo(() => {
    const m = new Map<string, TimeslotTypeResponse>();
    for (const t of timeslotTypes) m.set(t.id, t);
    return m;
  }, [timeslotTypes]);

  const fetchQueue = useCallback(async () => {
    try {
      const resp = await getQueue();
      setQueue(resp.data);
      setUpdatedAt(Date.now());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not refresh queue.'));
    }
  }, []);

  // Initial load: bootstrap seat assignment + queue + timeslot types in parallel.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let assignmentRes: { data: SeatAssignmentResponse | null } = { data: null };
        try {
          assignmentRes = await getMySeatAssignment();
        } catch (err) {
          const status = err instanceof Error && 'response' in err
            ? (err as { response?: { status?: number } }).response?.status
            : undefined;
          if (status && status !== 404) throw err;
        }

        const [queueRes, ttRes, seatsRes] = await Promise.all([
          getQueue(),
          listTimeslotTypes(),
          listSeats(),
        ]);
        if (cancelled) return;
        setAssignment(assignmentRes.data);
        setQueue(queueRes.data);
        setTimeslotTypes(ttRes.data);
        const mySeat =
          assignmentRes.data
            ? seatsRes.data.find((s) => s.id === assignmentRes.data!.seatId) ?? null
            : null;
        setSeat(mySeat);
        setUpdatedAt(Date.now());
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load your queue.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Stand-in for the `seat:{seatId}:queue` Supabase Realtime channel — see
  // REALTIME_CHANNELS.md §4. Phase 1: poll the REST endpoint instead.
  usePolling(fetchQueue, POLL_INTERVAL_MS.seatQueue);

  // Heartbeat keeps the active seat_assignment alive. Failures are non-fatal:
  // the backend's SeatHeartbeatChecker auto-ends after ~5 min of silence.
  usePolling(async () => {
    try {
      await heartbeat();
    } catch {
      /* swallowed — see comment above */
    }
  }, POLL_INTERVAL_MS.heartbeat);

  const handleAction = async (
    bookingId: string,
    op: () => Promise<unknown>,
  ) => {
    setActionError(null);
    setActingId(bookingId);
    try {
      await op();
      await fetchQueue();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Action failed.'));
    } finally {
      setActingId(null);
    }
  };

  const handleApprove = (b: BookingResponse) =>
    handleAction(b.id, () => bookingDecision(b.id, { decision: 'approve' }));

  const handleReject = (bookingId: string, reason: string) =>
    handleAction(bookingId, () => bookingDecision(bookingId, { decision: 'reject', reason: reason || null }));

  const handleCheckIn = (b: BookingResponse) => handleAction(b.id, () => checkInBooking(b.id));
  const handleStart = (b: BookingResponse) => handleAction(b.id, () => startBooking(b.id));
  const handleComplete = (b: BookingResponse) => handleAction(b.id, () => completeBooking(b.id));
  const handleNoShow = (b: BookingResponse) => handleAction(b.id, () => noShowBooking(b.id));
  const handleCancel = async (b: BookingResponse) => {
    const ok = await confirm({
      title: 'Cancel this booking?',
      body: 'The client will be notified by SMS that the appointment was cancelled.',
      confirmLabel: 'Cancel booking',
      cancelLabel: 'Keep it',
      tone: 'danger',
    });
    if (!ok) return;
    return handleAction(b.id, () => cancelBooking(b.id));
  };

  const handleEndShift = async () => {
    const stillInQueue =
      queue.checkedIn.length + queue.scheduled.length + queue.pendingApproval.length;
    if (stillInQueue > 0) {
      const ok = await confirm({
        title: 'End your shift?',
        body: `${stillInQueue} client${stillInQueue === 1 ? ' is' : 's are'} still in your queue. The system will try to reassign them — anyone we can't reassign will be notified that their booking was cancelled.`,
        confirmLabel: 'End shift anyway',
        cancelLabel: 'Stay on shift',
        tone: 'danger',
      });
      if (!ok) return;
    }
    setEndingShift(true);
    setActionError(null);
    try {
      await endShift();
      onShiftEnded();
    } catch (err) {
      setActionError(getApiErrorMessage(err, 'Could not end shift.'));
      setEndingShift(false);
    }
  };

  const handleSignOut = () => {
    clearAuth();
    clearClientAuth();
    onSignOut?.();
  };

  const totalInQueue =
    queue.pendingApproval.length +
    queue.scheduled.length +
    queue.checkedIn.length +
    queue.inService.length;

  if (loading) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar
          title="Live queue"
          subtitle="Loading your shift…"
          breadcrumb={[orgName ?? 'Org', 'My queue']}
        />
        <div className="flex-1 overflow-auto qf-scroll p-6">
          <QueueSkeleton />
        </div>
      </div>
    );
  }

  if (!assignment) {
    return (
      <div className="flex-1 flex flex-col">
        <TopBar title="Live queue" subtitle="No active shift" />
        <div className="flex-1 overflow-auto qf-scroll p-6">
          <Card padding={28} className="max-w-[520px] mx-auto text-center">
            <span className="inline-flex w-12 h-12 rounded-[12px] bg-surface-2 items-center justify-center text-ink-3">
              <Icon name="chair" size={20} />
            </span>
            <h2 className="m-0 mt-3 mb-1 text-[18px] font-medium">You're not on shift</h2>
            <p className="m-0 text-[13.5px] text-ink-3 mb-5">
              Claim a seat to start serving clients.
            </p>
            <Button variant="primary" onClick={onShiftEnded} iconRight="arrowR">
              Pick a seat
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-bg" style={{ minHeight: 0 }}>
      <header className="px-6 py-3.5 border-b border-line bg-surface flex items-center gap-4">
        <span className="w-9 h-9 rounded-[10px] bg-teal-tint text-teal-ink inline-flex items-center justify-center flex-none">
          <Icon name="chair" size={16} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-medium truncate">{seat?.name ?? 'On shift'}</div>
          <div className="text-[11.5px] text-ink-3 truncate">
            {orgName ?? 'Your organisation'} · started{' '}
            {fmtTime(assignment.startedAt)}
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-[12px] text-ink-3 flex-none">
          <span className="qf-live-dot" />
          {updatedAt ? `Updated ${minutesSince(new Date(updatedAt).toISOString())}m ago` : 'Live'}
        </span>
        <Button
          variant="secondary"
          icon="logout"
          onClick={handleEndShift}
          disabled={endingShift}
        >
          {endingShift ? 'Ending…' : 'End shift'}
        </Button>
        <div style={{ width: 220 }}>
          <ProfileMenu
            fullName={fullName ?? ''}
            email={email}
            role={role}
            direction="down"
            items={[
              {
                id: 'logout',
                label: 'Sign out',
                icon: 'logout',
                tone: 'danger',
                onSelect: handleSignOut,
              },
            ]}
          />
        </div>
      </header>

      {(error || actionError) && (
        <div
          className="mx-6 mt-4 flex items-center gap-[10px] px-3.5 py-[10px] rounded-[10px] border"
          style={{
            background: 'var(--coral-tint)',
            borderColor: 'color-mix(in oklab, var(--coral) 30%, transparent)',
          }}
          role="alert"
        >
          <Icon name="alert" size={14} className="text-coral" />
          <span className="text-[12.5px] flex-1">{actionError ?? error}</span>
          <button
            onClick={() => {
              setError(null);
              setActionError(null);
            }}
            className="border-0 bg-transparent p-1 cursor-pointer text-ink-3"
          >
            <Icon name="x" size={12} />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 32px' }}>
        <div className="flex items-center gap-3 mb-4">
          <h1 className="m-0 text-[20px] font-medium tracking-[-0.02em]">My queue</h1>
          <Pill tone="neutral">{totalInQueue} active</Pill>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>
          <div className="flex flex-col gap-4">
            <QueueSection
              title="Pending approval"
              count={queue.pendingApproval.length}
              accent="amber"
              empty="No requests waiting for you."
            >
              {queue.pendingApproval.map((b) => (
                <PendingCard
                  key={b.id}
                  booking={b}
                  timeslot={b.timeslotTypeId ? ttById.get(b.timeslotTypeId) : undefined}
                  disabled={actingId === b.id}
                  onApprove={() => handleApprove(b)}
                  onReject={() => setRejectingId(b.id)}
                />
              ))}
            </QueueSection>

            <QueueSection
              title="In service now"
              count={queue.inService.length}
              accent="blue"
              empty="Nobody is in service right now."
            >
              {queue.inService.map((b) => (
                <InServiceCard
                  key={b.id}
                  booking={b}
                  timeslot={b.timeslotTypeId ? ttById.get(b.timeslotTypeId) : undefined}
                  disabled={actingId === b.id}
                  onComplete={() => handleComplete(b)}
                  onNoShow={() => handleNoShow(b)}
                />
              ))}
            </QueueSection>

            <QueueSection
              title="Checked in"
              count={queue.checkedIn.length}
              accent="teal"
              empty="No clients in the waiting room."
              action={
                queue.checkedIn.length > 0 ? (
                  <Button
                    variant="primary"
                    size="sm"
                    icon="arrowR"
                    onClick={() => handleStart(queue.checkedIn[0])}
                    disabled={actingId === queue.checkedIn[0]?.id}
                  >
                    Call next
                  </Button>
                ) : undefined
              }
            >
              {queue.checkedIn.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  timeslot={b.timeslotTypeId ? ttById.get(b.timeslotTypeId) : undefined}
                  accent="teal"
                  disabled={actingId === b.id}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="user"
                        onClick={() => handleStart(b)}
                        disabled={actingId === b.id}
                      >
                        Start
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleNoShow(b)}
                        disabled={actingId === b.id}
                      >
                        No-show
                      </Button>
                    </>
                  }
                />
              ))}
            </QueueSection>

            <QueueSection
              title="Scheduled today"
              count={queue.scheduled.length}
              accent="neutral"
              empty="No upcoming bookings today."
            >
              {queue.scheduled.map((b) => (
                <BookingRow
                  key={b.id}
                  booking={b}
                  timeslot={b.timeslotTypeId ? ttById.get(b.timeslotTypeId) : undefined}
                  accent="neutral"
                  disabled={actingId === b.id}
                  actions={
                    <>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="check"
                        onClick={() => handleCheckIn(b)}
                        disabled={actingId === b.id}
                      >
                        Check in
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon="trash"
                        onClick={() => handleCancel(b)}
                        disabled={actingId === b.id}
                      >
                        Cancel
                      </Button>
                    </>
                  }
                />
              ))}
            </QueueSection>
          </div>

          <aside className="flex flex-col gap-3.5" style={{ position: 'sticky', top: 16 }}>
            <NotificationPanel />
            <AtGlancePanel />
          </aside>
        </div>
      </main>

      <RejectModal
        bookingId={rejectingId}
        onClose={() => setRejectingId(null)}
        onSubmit={async (id, reason) => {
          setRejectingId(null);
          await handleReject(id, reason);
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────────

const SECTION_ACCENT: Record<string, string> = {
  amber: 'var(--amber)',
  blue: 'var(--blue)',
  teal: 'var(--teal)',
  neutral: 'var(--line-2)',
};

function QueueSection({
  title,
  count,
  accent,
  empty,
  action,
  children,
}: {
  title: string;
  count: number;
  accent: 'amber' | 'blue' | 'teal' | 'neutral';
  empty: string;
  action?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card padding={0}>
      <div className="px-4 py-3 border-b border-line flex items-center gap-2.5 relative">
        <span
          className="absolute left-0 top-[10px] bottom-[10px] w-[3px]"
          style={{ background: SECTION_ACCENT[accent] }}
        />
        <span className="text-[13px] font-medium pl-2.5">{title}</span>
        <Pill tone={accent === 'neutral' ? 'neutral' : (accent as 'amber' | 'blue' | 'teal')}>
          {count}
        </Pill>
        <span className="flex-1" />
        {action}
      </div>
      {count === 0 ? (
        <div className="px-4 py-5 text-[12.5px] text-ink-3 text-center">{empty}</div>
      ) : (
        <div>{children}</div>
      )}
    </Card>
  );
}

function PendingCard({
  booking,
  timeslot,
  onApprove,
  onReject,
  disabled,
}: {
  booking: BookingResponse;
  timeslot?: TimeslotTypeResponse;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}) {
  const holdRemaining = booking.heldUntil
    ? Math.max(0, new Date(booking.heldUntil).getTime() - Date.now())
    : 0;
  return (
    <div className="px-4 py-3 border-b border-line last:border-b-0 flex items-start gap-3">
      <Avatar name={clientLabel(booking)} size={32} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium">
          {clientLabel(booking)}
          {booking.clientReason && (
            <span className="font-normal text-ink-3"> · {booking.clientReason}</span>
          )}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-0.5 flex items-center gap-2 flex-wrap">
          <span>Requested {fmtTime(booking.scheduledStartAt)}</span>
          {timeslot && (
            <>
              <span className="text-ink-4">·</span>
              <span
                className="inline-flex items-center gap-1"
                style={{ color: timeslot.color ?? 'var(--ink-3)' }}
              >
                <Icon name="clock" size={10} />
                {timeslot.name} · {timeslot.durationMinutes} min
              </span>
            </>
          )}
          {holdRemaining > 0 && (
            <>
              <span className="text-ink-4">·</span>
              <span className="mono">
                hold {formatHMS(Math.floor(holdRemaining / 1000)).slice(3)}
              </span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button variant="primary" size="sm" onClick={onApprove} disabled={disabled}>
          Approve
        </Button>
        <Button variant="ghost" size="sm" onClick={onReject} disabled={disabled}>
          Reject
        </Button>
      </div>
    </div>
  );
}

function InServiceCard({
  booking,
  timeslot,
  onComplete,
  onNoShow,
  disabled,
}: {
  booking: BookingResponse;
  timeslot?: TimeslotTypeResponse;
  onComplete: () => void;
  onNoShow: () => void;
  disabled?: boolean;
}) {
  const started = booking.actualStartAt ?? booking.scheduledStartAt;
  const elapsed = Math.max(0, Date.now() - new Date(started).getTime());
  return (
    <div className="px-4 py-4 flex items-center gap-4 flex-wrap">
      <Avatar name={clientLabel(booking)} size={44} active />
      <div className="flex-1 min-w-0">
        <div className="text-[14.5px] font-medium">{clientLabel(booking)}</div>
        <div className="text-[12px] text-ink-3 mt-0.5 flex items-center gap-2 flex-wrap">
          {timeslot && (
            <span
              className="inline-flex items-center gap-1"
              style={{ color: timeslot.color ?? 'var(--ink-3)' }}
            >
              <Icon name="clock" size={11} /> {timeslot.name}
            </span>
          )}
          {booking.clientReason && (
            <>
              <span className="text-ink-4">·</span>
              <span>{booking.clientReason}</span>
            </>
          )}
        </div>
      </div>
      <div className="text-right">
        <div
          className="mono tnum text-[26px] font-medium"
          style={{ letterSpacing: '-0.01em' }}
        >
          {formatHMS(Math.floor(elapsed / 1000))}
        </div>
        <div className="text-[10.5px] text-ink-3 uppercase" style={{ letterSpacing: '0.06em' }}>
          Elapsed
        </div>
      </div>
      <div className="flex gap-1.5">
        <Button variant="primary" icon="check" onClick={onComplete} disabled={disabled}>
          Complete
        </Button>
        <Button variant="ghost" onClick={onNoShow} disabled={disabled}>
          No-show
        </Button>
      </div>
    </div>
  );
}

function BookingRow({
  booking,
  timeslot,
  accent,
  actions,
  disabled,
}: {
  booking: BookingResponse;
  timeslot?: TimeslotTypeResponse;
  accent: 'teal' | 'neutral';
  actions?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className={cn(
      'px-4 py-3 border-b border-line last:border-b-0 flex items-center gap-3',
      disabled && 'opacity-60',
    )}>
      <Avatar name={clientLabel(booking)} size={28} active={accent === 'teal'} />
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium truncate">{clientLabel(booking)}</div>
        <div className="text-[11.5px] text-ink-3 mt-0.5 flex items-center gap-1.5 flex-wrap">
          <span className="mono tnum">{fmtTime(booking.scheduledStartAt)}</span>
          {timeslot && (
            <>
              <span className="text-ink-4">·</span>
              <span style={{ color: timeslot.color ?? 'var(--ink-3)' }}>{timeslot.name}</span>
            </>
          )}
          {booking.clientReason && (
            <>
              <span className="text-ink-4">·</span>
              <span className="truncate">{booking.clientReason}</span>
            </>
          )}
        </div>
      </div>
      <div className="flex gap-1.5 flex-none">{actions}</div>
    </div>
  );
}

function RejectModal({
  bookingId,
  onClose,
  onSubmit,
}: {
  bookingId: string | null;
  onClose: () => void;
  onSubmit: (id: string, reason: string) => Promise<void> | void;
}) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!bookingId) {
      setReason('');
      setSubmitting(false);
    }
  }, [bookingId]);

  if (!bookingId) return null;

  return (
    <Modal
      open
      onClose={onClose}
      title="Reject this request?"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Keep it
          </Button>
          <Button
            variant="danger"
            onClick={async () => {
              setSubmitting(true);
              await onSubmit(bookingId, reason.trim());
            }}
            disabled={submitting}
          >
            {submitting ? 'Rejecting…' : 'Reject'}
          </Button>
        </>
      }
    >
      <Field label="Reason" hint="Sent to the client in the rejection SMS. Optional.">
        <TextInput
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="e.g. I'm fully booked this afternoon."
          autoFocus
        />
      </Field>
    </Modal>
  );
}

function QueueSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} padding={0}>
          <div className="px-4 py-3 border-b border-line flex items-center gap-2">
            <SkeletonLine w={120} h={13} />
            <SkeletonBox w={26} h={18} />
          </div>
          {Array.from({ length: 2 }).map((__, j) => (
            <div key={j} className="px-4 py-3 border-b border-line last:border-b-0 flex items-center gap-3">
              <SkeletonBox w={32} h={32} circle />
              <div className="flex-1 min-w-0">
                <SkeletonLine w="40%" h={12} />
                <SkeletonLine w="60%" h={10} className="mt-1.5" />
              </div>
              <SkeletonBox w={68} h={28} />
            </div>
          ))}
        </Card>
      ))}
    </div>
  );
}

function NotificationPanel() {
  const items: { tone: 'coral' | 'amber' | 'blue'; title: string; body: string; time: string }[] = [
    {
      tone: 'coral',
      title: 'Running 12 min behind schedule',
      body: 'Delay alert sent to 3 clients in your queue.',
      time: '2m ago',
    },
    {
      tone: 'amber',
      title: 'New request received',
      body: 'Requested 15:00 · Consult.',
      time: '5m ago',
    },
    {
      tone: 'blue',
      title: 'Client checked in',
      body: 'Arrived in waiting room.',
      time: '14m ago',
    },
  ];

  return (
    <Card padding={0}>
      <div className="px-4 py-3 border-b border-line flex items-center gap-2">
        <span className="qf-live-dot" />
        <span className="text-[12.5px] font-medium">Notifications</span>
        <Pill tone="coral" className="ml-auto">2 new</Pill>
      </div>
      <div>
        {items.map((n, i) => (
          <div
            key={n.title}
            className={cn(
              'px-4 py-2.5 flex gap-2.5',
              i < items.length - 1 && 'border-b border-line',
            )}
          >
            <FeedKindBadge tone={n.tone} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium">{n.title}</div>
              <div className="text-[11.5px] text-ink-3 mt-0.5">{n.body}</div>
              <div className="text-[11px] text-ink-4 mt-1">{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function AtGlancePanel() {
  return (
    <Card padding={14}>
      <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold">
        Today at a glance
      </div>
      <div className="grid gap-3 mt-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <MiniStat label="Completed" value="6" tone="success" />
        <MiniStat label="No-shows" value="1" tone="ink" />
        <MiniStat label="Avg consult" value="22m" tone="ink" />
        <MiniStat label="Behind" value="+12m" tone="coral" />
      </div>
    </Card>
  );
}

function MiniStat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'coral' | 'ink';
}) {
  const color =
    tone === 'success'
      ? 'var(--success)'
      : tone === 'coral'
        ? 'var(--coral-2)'
        : 'var(--ink)';
  return (
    <div>
      <div className="text-[11.5px] text-ink-3">{label}</div>
      <div className="tnum text-[20px] font-medium" style={{ color, letterSpacing: '-0.015em' }}>
        {value}
      </div>
    </div>
  );
}

function FeedKindBadge({ tone }: { tone: 'coral' | 'amber' | 'blue' }) {
  const map = {
    coral: { icon: 'alert', bg: 'var(--coral-tint)', fg: 'var(--coral-2)' },
    amber: { icon: 'bell', bg: 'var(--amber-tint)', fg: 'var(--amber)' },
    blue: { icon: 'info', bg: 'var(--blue-tint)', fg: 'var(--blue)' },
  } as const;
  const m = map[tone];
  return (
    <span
      className="inline-flex items-center justify-center rounded-[6px] flex-none"
      style={{ width: 22, height: 22, background: m.bg, color: m.fg }}
    >
      <Icon name={m.icon} size={12} />
    </span>
  );
}
