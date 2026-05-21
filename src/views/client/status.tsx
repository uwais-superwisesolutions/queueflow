 
import { useEffect, useMemo, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Card, Pill, SkeletonBox, SkeletonLine, useConfirm } from '@/components/ui';
import { useTick } from '@/hooks/use-tick';
import { usePolling } from '@/hooks/use-polling';
import { POLL_INTERVAL_MS } from '@/lib/realtime-channels';
import { agoLabel, formatHMS } from '@/lib/time';
import { cn } from '@/lib/utils';
import { fmtTime, fmtDate } from '@/lib/date';
import { describeNotification } from '@/lib/notification-display';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  cancelMyClientBooking,
  listMyClientBookings,
} from '@/services/clientBookingApi';
import { listMyClientNotifications } from '@/services/clientApi';
import { getCachedPortalScan } from '@/lib/client-org';
import type { BookingResponse, BookingStatus, NotificationResponse } from '@/types';

interface ClientStatusScreenProps {
  bookingId?: string;
  onCancel: () => void;
  onBookAnother: () => void;
}

const ACTIVE_STATUSES = new Set<BookingStatus>([
  'pending_approval',
  'scheduled',
  'checked_in',
  'in_service',
]);


export function ClientStatusScreen({ bookingId, onCancel, onBookAnother }: ClientStatusScreenProps) {
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [otherActive, setOtherActive] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<number>(0);
  const scan = useMemo(() => getCachedPortalScan(), []);
  const confirm = useConfirm();

  useTick(1000);

  const refresh = async () => {
    try {
      const resp = await listMyClientBookings();
      const list = resp.data;
      const focus = bookingId
        ? list.find((b) => b.id === bookingId) ?? null
        : list.find((b) => ACTIVE_STATUSES.has(b.status)) ?? null;
      setBooking(focus);
      setOtherActive(
        list.filter((b) => ACTIVE_STATUSES.has(b.status) && b.id !== focus?.id),
      );
      setUpdatedAt(Date.now());
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load your booking.'));
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      await refresh();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
     
  }, [bookingId]);

  // Stand-in for the `booking:{bookingId}` Supabase Realtime channel — see
  // REALTIME_CHANNELS.md §5. Phase 1: poll /api/client/bookings/me.
  usePolling(refresh, POLL_INTERVAL_MS.bookingStatus);

  const handleCancel = async () => {
    if (!booking) return;
    const ok = await confirm({
      title: 'Cancel your spot?',
      body: 'You can always re-book another slot.',
      confirmLabel: 'Cancel spot',
      cancelLabel: 'Keep my spot',
      tone: 'danger',
    });
    if (!ok) return;
    setCancelling(true);
    setError(null);
    try {
      await cancelMyClientBooking(booking.id);
      onCancel();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not cancel.'));
      setCancelling(false);
    }
  };

  // ─────────────────────────────────────────────────────────────────
  // Loading / empty / non-active states
  // ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PhoneFrame>
        <div className="p-6">
          <SkeletonLine w={140} h={11} />
          <SkeletonBox w={120} h={70} className="mx-auto mt-6" />
          <SkeletonBox w="100%" h={88} className="mt-6" />
          <SkeletonBox w="100%" h={160} className="mt-3" />
        </div>
      </PhoneFrame>
    );
  }

  if (!booking) {
    return (
      <PhoneFrame>
        <div className="p-6 flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-[12px] bg-surface-2 text-ink-3 inline-flex items-center justify-center">
            <Icon name="info" size={20} />
          </span>
          <h2 className="m-0 mt-3 text-[18px] font-medium">No active booking</h2>
          <p className="m-0 mt-1 text-[13px] text-ink-3">
            You don't have anything in the queue right now.
          </p>
          <Button variant="primary" className="mt-4" onClick={onBookAnother} iconRight="arrowR">
            Pick a slot
          </Button>
        </div>
      </PhoneFrame>
    );
  }

  if (!ACTIVE_STATUSES.has(booking.status)) {
    const messages: Partial<Record<BookingStatus, string>> = {
      completed: 'Your visit is complete. See you next time.',
      cancelled: 'This booking was cancelled.',
      rejected: booking.rejectionReason
        ? `Your request was declined: ${booking.rejectionReason}`
        : 'Your request was declined. Try another slot.',
      expired: 'The soft-hold expired before the team could review.',
      no_show: 'This booking was marked as a no-show.',
    };
    return (
      <PhoneFrame>
        <div className="p-6 flex flex-col items-center text-center">
          <span className="w-12 h-12 rounded-[12px] bg-surface-2 text-ink-3 inline-flex items-center justify-center">
            <Icon
              name={booking.status === 'completed' ? 'check' : 'info'}
              size={20}
            />
          </span>
          <h2 className="m-0 mt-3 text-[18px] font-medium capitalize">
            {booking.status.replace('_', ' ')}
          </h2>
          <p className="m-0 mt-1 text-[13px] text-ink-3">
            {messages[booking.status] ?? 'This booking is no longer active.'}
          </p>
          <Button variant="primary" className="mt-4" onClick={onBookAnother} iconRight="arrowR">
            Pick another slot
          </Button>
        </div>
      </PhoneFrame>
    );
  }

  // Seconds-until-scheduled. (The legacy name was `minsUntil` but the math is
  // ms → seconds; passing it again multiplied by 1000 to formatHMS inflated
  // the displayed countdown 1000×.)
  const secondsUntil = Math.max(
    0,
    Math.floor((new Date(booking.scheduledStartAt).getTime() - Date.now()) / 1000),
  );

  return (
    <PhoneFrame>
      <div className="flex flex-col min-h-full">
        <div className="px-6 pt-5 pb-4 flex items-center gap-2.5">
          <span
            className="w-7 h-7 rounded-[7px] inline-flex items-center justify-center text-[11px] font-semibold flex-none text-white"
            style={{ background: scan?.brandColor ?? 'var(--teal)' }}
          >
            {(scan?.orgName ?? '?').slice(0, 2).toUpperCase()}
          </span>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-semibold truncate">{scan?.orgName ?? 'Your queue'}</div>
            <div className="text-[10.5px] text-ink-3 flex items-center gap-1">
              <span className="qf-live-dot" style={{ width: 5, height: 5 }} />
              Live status · updated {updatedAt ? `${Math.max(0, Math.floor((Date.now() - updatedAt) / 1000))}s ago` : 'just now'}
            </div>
          </div>
          <button
            onClick={refresh}
            className="border-0 bg-surface-2 rounded-[8px] p-[7px] cursor-pointer text-ink-3"
            aria-label="Refresh"
          >
            <Icon name="refresh" size={14} />
          </button>
        </div>

        {error && (
          <div
            className="mx-6 mb-3 px-3 py-2 rounded-[8px] text-[12px]"
            style={{
              background: 'var(--coral-tint)',
              border: '1px solid color-mix(in oklab, var(--coral) 25%, transparent)',
            }}
          >
            <Icon name="alert" size={12} /> {error}
          </div>
        )}

        <div className="px-6 pb-6 text-center">
          <div className="mono text-[11px] text-ink-4 uppercase tracking-[0.08em] font-semibold">
            Status
          </div>
          <div
            className="text-teal mt-2"
            style={{ fontSize: 38, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.02em' }}
          >
            {labelForStatus(booking.status)}
          </div>
          <div className="text-[13px] text-ink-2 mt-2">
            {booking.status === 'in_service'
              ? 'You\'re being seen now.'
              : booking.status === 'checked_in'
                ? 'You\'re checked in — they\'ll call you soon.'
                : `Scheduled for ${fmtDate(booking.scheduledStartAt)} at ${fmtTime(booking.scheduledStartAt)}`}
          </div>
        </div>

        <div className="px-4 pb-4">
          <div
            className="p-4 rounded-[14px] text-center"
            style={{
              background: 'linear-gradient(180deg, var(--teal-tint), var(--surface-2))',
              border: '1px solid color-mix(in oklab, var(--teal) 20%, transparent)',
            }}
          >
            <div className="text-[11px] text-teal-ink uppercase tracking-[0.06em] font-semibold">
              Estimated time until called
            </div>
            <div
              className="mono tnum text-teal-ink mt-1.5"
              style={{ fontSize: 38, fontWeight: 500, letterSpacing: '-0.03em' }}
            >
              {booking.status === 'in_service' ? 'Now' : formatHMS(secondsUntil)}
            </div>
            <div className="text-[11.5px] text-ink-3 mt-1">
              Around {fmtTime(booking.scheduledStartAt)} · we'll text you 5 min before
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <Card padding={0}>
            <DetailRow icon="calendar" label="When" value={`${fmtDate(booking.scheduledStartAt)}, ${fmtTime(booking.scheduledStartAt)}`} />
            <DetailRow icon="clock" label="Length" value={`${Math.round((new Date(booking.scheduledEndAt).getTime() - new Date(booking.scheduledStartAt).getTime()) / 60000)} min`} last />
          </Card>
        </div>

        <UpdatesSection bookingId={booking.id} />

        {otherActive.length > 0 && (
          <div className="px-4 pb-4">
            <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
              Other active bookings
            </div>
            <Card padding={0}>
              {otherActive.map((b, i) => (
                <div
                  key={b.id}
                  className={cn(
                    'px-3.5 py-2.5 flex items-center gap-3',
                    i < otherActive.length - 1 && 'border-b border-line',
                  )}
                >
                  <Icon name="calendar" size={13} className="text-ink-3" />
                  <div className="flex-1">
                    <div className="text-[12.5px] font-medium">
                      {fmtDate(b.scheduledStartAt)}, {fmtTime(b.scheduledStartAt)}
                    </div>
                    <div className="text-[11px] text-ink-3 capitalize">
                      {b.status.replace('_', ' ')}
                    </div>
                  </div>
                </div>
              ))}
            </Card>
          </div>
        )}

        <div className="px-4 pb-6 flex flex-col gap-2 mt-auto">
          {booking.status === 'pending_approval' || booking.status === 'scheduled' ? (
            <Button
              variant="danger-ghost"
              full
              className="h-[46px]"
              icon="x"
              onClick={handleCancel}
              disabled={cancelling}
            >
              {cancelling ? 'Cancelling…' : 'Cancel my spot'}
            </Button>
          ) : null}
        </div>
      </div>
    </PhoneFrame>
  );
}

function labelForStatus(status: BookingStatus): string {
  switch (status) {
    case 'pending_approval':
      return 'Reviewing';
    case 'scheduled':
      return 'You\'re on';
    case 'checked_in':
      return 'Checked in';
    case 'in_service':
      return 'In service';
    case 'completed':
      return 'Complete';
    default:
      return status.replace('_', ' ');
  }
}

function DetailRow({
  icon,
  label,
  value,
  last,
}: {
  icon: 'calendar' | 'clock' | 'user' | 'chair';
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <div className={cn('px-3.5 py-2.5 flex items-center gap-2.5', !last && 'border-b border-line')}>
      <Icon name={icon} size={14} className="text-ink-3" />
      <span className="text-[12px] text-ink-3 w-[70px]">{label}</span>
      <span className="text-[13px] font-medium truncate">{value}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────
// Updates — every SMS we sent (or tried to send) about this booking. The
// /api/client/notifications endpoint is JWT-scoped to the caller's ClientId
// on the backend, so even a `?bookingId=` collision can only return rows
// that belong to this client.
// ─────────────────────────────────────────────────

const PORTAL_URL_SUFFIX_RE = /\s*Track your spot:\s*\S+\s*$/i;

function stripPortalUrl(body: string): string {
  return body.replace(PORTAL_URL_SUFFIX_RE, '').trim();
}

function UpdatesSection({ bookingId }: { bookingId: string }) {
  const [items, setItems] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await listMyClientNotifications({ bookingId, limit: 25 });
      setItems(res.data);
      setError(null);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not load updates.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wrap in an IIFE so the effect body itself doesn't await setState calls
    // — matches the pattern used by the main refresh effect above and
    // satisfies the react-hooks/set-state-in-effect lint rule.
    let cancelled = false;
    (async () => {
      try {
        const res = await listMyClientNotifications({ bookingId, limit: 25 });
        if (cancelled) return;
        setItems(res.data);
        setError(null);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load updates.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [bookingId]);

  usePolling(load, POLL_INTERVAL_MS.notifications);

  if (loading && items.length === 0) {
    return (
      <div className="px-4 pb-4">
        <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
          Updates
        </div>
        <Card padding={0}>
          <div className="px-3.5 py-3 text-[12.5px] text-ink-3">Loading…</div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 pb-4">
        <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
          Updates
        </div>
        <Card padding={0}>
          <div className="px-3.5 py-3 text-[12.5px] text-coral" role="alert">
            <Icon name="alert" size={12} /> {error}
          </div>
        </Card>
      </div>
    );
  }

  // No notifications yet — the booking may have just been created and the
  // approval/scheduled message hasn't fired. Hide the section entirely so it
  // doesn't show an awkward empty box on a fresh booking.
  if (items.length === 0) return null;

  return (
    <div className="px-4 pb-4">
      <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
        Updates
      </div>
      <Card padding={0}>
        {items.map((n, i) => (
          <UpdateRow
            key={n.id}
            notification={n}
            divider={i < items.length - 1}
          />
        ))}
      </Card>
    </div>
  );
}

function UpdateRow({
  notification,
  divider,
}: {
  notification: NotificationResponse;
  divider: boolean;
}) {
  const { tone, title } = describeNotification(notification.notificationType);
  const ms = Date.now() - new Date(notification.createdAt).getTime();
  const body = stripPortalUrl(notification.body);

  // Status pill only shown when delivery isn't a clean "sent" — keeps the
  // happy path uncluttered. Failed rows surface a soft "Couldn't deliver"
  // hint so the client knows to update their number.
  const statusPill =
    notification.status === 'failed' ? (
      <Pill tone="coral" className="flex-none text-[10px]">
        Couldn't deliver
      </Pill>
    ) : notification.status === 'pending' ? (
      <Pill tone="neutral" className="flex-none text-[10px]">
        Queued
      </Pill>
    ) : null;

  return (
    <div className={cn('px-3.5 py-2.5 flex gap-2.5', divider && 'border-b border-line')}>
      <UpdateToneBadge tone={tone} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="text-[12.5px] font-medium truncate">{title}</div>
          {statusPill}
        </div>
        <div className="text-[11.5px] text-ink-3 mt-0.5 leading-relaxed">{body}</div>
        <div className="text-[11px] text-ink-4 mt-1">{agoLabel(ms)}</div>
      </div>
    </div>
  );
}

function UpdateToneBadge({ tone }: { tone: 'coral' | 'amber' | 'blue' }) {
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
