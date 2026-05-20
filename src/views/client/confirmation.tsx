import { useEffect, useRef, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, SkeletonBox, SkeletonLine } from '@/components/ui';
import { formatMS } from '@/lib/time';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  cancelMyClientBooking,
  createClientBooking,
  listMyClientBookings,
} from '@/services/clientBookingApi';
import { getCachedPortalScan } from '@/lib/client-org';
import type { BookingResponse, SlotResponse } from '@/types';

export interface ConfirmationDeparture {
  reason: 'approved' | 'rejected' | 'expired' | 'cancelled';
  booking: BookingResponse;
}

interface ClientConfirmationScreenProps {
  slot: SlotResponse;
  /** Optional reason-for-visit captured on /client/details for new clients. */
  clientReason?: string | null;
  onResolved: (departure: ConfirmationDeparture) => void;
  onPickAnother: () => void;
}

const POLL_INTERVAL_MS = 4_000;

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function durationMin(slot: SlotResponse): number {
  return Math.round((new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60_000);
}

export function ClientConfirmationScreen({ slot, clientReason, onResolved, onPickAnother }: ClientConfirmationScreenProps) {
  const [booking, setBooking] = useState<BookingResponse | null>(null);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [holdMs, setHoldMs] = useState<number>(0);
  const [expanded, setExpanded] = useState(false);
  const [releasing, setReleasing] = useState(false);
  const createdRef = useRef(false);

  // Create the booking exactly once.
  useEffect(() => {
    if (createdRef.current) return;
    createdRef.current = true;

    const scan = getCachedPortalScan();
    // Pass seatId only when the client came in via a seat-scoped portal link.
    // Otherwise the backend resolves the seat from the chosen member's active
    // seat assignment.
    const seatId =
      scan?.scope?.type === 'seat' && scan.scope.id ? scan.scope.id : null;

    (async () => {
      try {
        const resp = await createClientBooking({
          seatId: seatId ?? undefined,
          orgMemberId: slot.orgMemberId,
          timeslotTypeId: slot.timeslotTypeId,
          scheduledStartAt: slot.startAt,
          clientReason: clientReason ?? null,
        });
        setBooking(resp.data);
      } catch (err) {
        setError(getApiErrorMessage(err, 'Could not request this slot.'));
      } finally {
        setCreating(false);
      }
    })();
  }, [slot, clientReason]);

  // Live countdown for the soft-hold.
  useEffect(() => {
    if (!booking?.heldUntil) return;
    const update = () => {
      const remaining = new Date(booking.heldUntil!).getTime() - Date.now();
      setHoldMs(Math.max(0, remaining));
    };
    update();
    const id = window.setInterval(update, 1000);
    return () => window.clearInterval(id);
  }, [booking?.heldUntil]);

  // Poll for status changes (approved / rejected / expired).
  useEffect(() => {
    if (!booking) return;
    if (booking.status !== 'pending_approval') return;
    const id = window.setInterval(async () => {
      try {
        const resp = await listMyClientBookings();
        const fresh = resp.data.find((b) => b.id === booking.id);
        if (!fresh) return;
        setBooking(fresh);
        if (fresh.status === 'scheduled' || fresh.status === 'checked_in' || fresh.status === 'in_service') {
          onResolved({ reason: 'approved', booking: fresh });
        } else if (fresh.status === 'rejected') {
          onResolved({ reason: 'rejected', booking: fresh });
        } else if (fresh.status === 'expired') {
          onResolved({ reason: 'expired', booking: fresh });
        } else if (fresh.status === 'cancelled') {
          onResolved({ reason: 'cancelled', booking: fresh });
        }
      } catch {
        // poll failures are non-fatal
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [booking, onResolved]);

  const handleRelease = async () => {
    if (!booking) {
      onPickAnother();
      return;
    }
    setReleasing(true);
    try {
      await cancelMyClientBooking(booking.id, { reason: 'Picked another slot.' });
      onPickAnother();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not release the slot.'));
      setReleasing(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-10 text-center">
        <div className="mx-auto mb-4 w-[84px] h-[84px] rounded-full bg-teal-tint flex items-center justify-center relative">
          <span className="absolute inset-0 rounded-full border-2 border-teal opacity-40 animate-qf-pulse" />
          <Icon name="clock" size={32} className="text-teal-ink" stroke={1.5} />
        </div>

        <h1 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">
          {error
            ? 'Could not request this slot'
            : booking?.status === 'scheduled'
              ? 'Approved'
              : 'Your request is being reviewed'}
        </h1>
        <p className="m-0 mb-[18px] text-ink-3 text-[13.5px] leading-relaxed">
          {error
            ? 'See the message below and try a different slot.'
            : booking?.status === 'scheduled'
              ? 'You\'re on the schedule. Tap continue to track your spot.'
              : 'We\'re holding your slot while the team confirms. This usually takes 1–2 minutes.'}
        </p>

        {creating ? (
          <div className="mb-4 p-4 bg-surface border border-line rounded-[14px] text-left">
            <SkeletonLine w={80} h={11} />
            <SkeletonBox w="100%" h={48} className="mt-3" />
          </div>
        ) : error ? (
          <div
            className="mb-4 px-3.5 py-3.5 rounded-[12px] text-left text-[12.5px]"
            style={{
              background: 'var(--coral-tint)',
              border: '1px solid color-mix(in oklab, var(--coral) 30%, transparent)',
            }}
          >
            <Icon name="alert" size={14} className="text-coral mr-1.5 inline align-middle" />
            {error}
          </div>
        ) : (
          <div className="mb-4 p-4 bg-surface border border-line rounded-[14px] text-left">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.05em] font-semibold">
                  Time
                </div>
                <div className="mono tnum text-[16px] font-medium mt-0.5">
                  {fmtTime(slot.startAt)}
                </div>
              </div>
              <div>
                <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.05em] font-semibold">
                  Duration
                </div>
                <div className="text-[13px] mt-1 flex items-center gap-1.5">
                  <span className="w-[7px] h-[7px] rounded-[2px] bg-teal flex-none" />
                  {durationMin(slot)} min
                </div>
              </div>
            </div>
          </div>
        )}

        {booking && booking.status === 'pending_approval' && (
          <div
            className="mb-4 px-3.5 py-3.5 rounded-[12px] flex items-center gap-3"
            style={{
              background: 'var(--amber-tint)',
              border: '1px solid color-mix(in oklab, var(--amber) 30%, transparent)',
            }}
          >
            <Icon name="clock" size={18} className="text-amber" />
            <div className="flex-1 text-left">
              <div className="text-[11.5px] text-amber font-semibold tracking-[0.02em]">
                Slot held for
              </div>
              <div className="mono tnum text-[18px] font-medium text-amber">
                {holdMs > 0 ? formatMS(Math.floor(holdMs / 1000)) : '00:00'}
              </div>
            </div>
            <span className="qf-live-dot" />
          </div>
        )}

        {!error && (
          <>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="w-full text-left px-3.5 py-3 bg-surface-2 border border-line rounded-[10px] cursor-pointer flex items-center gap-2"
            >
              <Icon name="info" size={15} className="text-ink-3" />
              <span className="text-[13px] font-medium flex-1">What happens next?</span>
              <Icon name={expanded ? 'chevronU' : 'chevronD'} size={13} className="text-ink-3" />
            </button>
            {expanded && (
              <div className="px-3.5 py-3.5 bg-surface border border-line border-t-0 rounded-b-[10px] text-[12.5px] text-ink-2 leading-relaxed text-left">
                <p className="m-0">
                  Once the team approves, you'll get an SMS with a live link to your spot. You can
                  leave home — we'll text you 5 minutes before it's your turn.
                </p>
                <p className="m-0 mt-2 text-ink-3">
                  If you'd rather pick something different, you can release the hold below.
                </p>
              </div>
            )}
          </>
        )}

        <div className="mt-4 flex flex-col gap-1.5">
          {error ? (
            <Button variant="primary" full onClick={onPickAnother}>
              Pick a different slot
            </Button>
          ) : (
            <button
              onClick={handleRelease}
              disabled={releasing}
              className="bg-transparent border-0 text-ink-3 text-[12.5px] cursor-pointer underline underline-offset-[3px]"
            >
              {releasing ? 'Releasing…' : 'Release this slot & pick a different one'}
            </button>
          )}
        </div>
      </div>
    </PhoneFrame>
  );
}
