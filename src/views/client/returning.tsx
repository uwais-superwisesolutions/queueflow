 
import { useEffect, useMemo, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Avatar, Pill, SkeletonBox, SkeletonLine } from '@/components/ui';
import { getClientMe } from '@/services/clientApi';
import { listMyClientBookings } from '@/services/clientBookingApi';
import { getApiErrorMessage } from '@/lib/api-error';
import type { BookingResponse, ClientProfileResponse } from '@/types';

interface ClientReturningScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

function fullName(p: ClientProfileResponse | null): string {
  if (!p) return 'there';
  const parts = [p.firstName, p.lastName].filter(Boolean) as string[];
  return parts.length ? parts.join(' ') : 'there';
}

function fmtVisit(b: BookingResponse): string {
  const d = new Date(b.scheduledStartAt);
  return d.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

const COMPLETED_STATUSES = new Set(['completed', 'no_show', 'cancelled', 'rejected', 'expired']);

export function ClientReturningScreen({ onContinue, onBack }: ClientReturningScreenProps) {
  const [profile, setProfile] = useState<ClientProfileResponse | null>(null);
  const [history, setHistory] = useState<BookingResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [meRes, bookingsRes] = await Promise.all([
          getClientMe(),
          listMyClientBookings(),
        ]);
        if (cancelled) return;
        setProfile(meRes.data);
        setHistory(bookingsRes.data);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load your profile.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const completedHistory = useMemo(
    () =>
      history
        .filter((b) => COMPLETED_STATUSES.has(b.status))
        .sort((a, b) => b.scheduledStartAt.localeCompare(a.scheduledStartAt))
        .slice(0, 4),
    [history],
  );

  const lastVisit = completedHistory[0];
  const visitsCount = completedHistory.length;

  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-ink-2 text-[13px] cursor-pointer mb-[18px]"
        >
          <Icon name="chevronL" size={14} /> Use a different number
        </button>

        {loading ? (
          <ReturningSkeleton />
        ) : error ? (
          <div className="p-4 text-[13px] text-ink-3">{error}</div>
        ) : (
          <>
            <div
              className="mb-4 p-4 rounded-[16px] flex items-center gap-3"
              style={{
                background: 'linear-gradient(180deg, var(--teal-tint), var(--surface-2))',
                border: '1px solid color-mix(in oklab, var(--teal) 20%, transparent)',
              }}
            >
              <Avatar name={fullName(profile)} size={52} />
              <div className="min-w-0">
                <div className="text-[11.5px] text-teal-ink font-semibold tracking-[0.03em] uppercase">
                  Welcome back
                </div>
                <div className="text-[19px] font-medium tracking-[-0.01em] mt-0.5 truncate">
                  {fullName(profile)}
                </div>
                <div className="text-[12px] text-ink-3 mt-0.5">
                  {lastVisit
                    ? `Last visit: ${fmtVisit(lastVisit)}`
                    : 'First time booking with us today'}
                </div>
              </div>
            </div>

            {visitsCount > 0 && (
              <>
                <h2 className="mt-5 mb-1.5 text-[18px] font-medium tracking-[-0.015em]">
                  {visitsCount === 1
                    ? "You've been here once before"
                    : `You've been here ${visitsCount} times before`}
                </h2>
                <p className="m-0 mb-4 text-[13px] text-ink-3">
                  We've kept your details on file. Pick how you'd like to be seen and we'll get you set up.
                </p>
                <div className="flex flex-col gap-2 mb-[18px]">
                  {completedHistory.map((b) => (
                    <div
                      key={b.id}
                      className="px-3 py-2.5 border border-line rounded-[10px] flex items-center gap-2.5 bg-surface"
                    >
                      <Icon
                        name={b.status === 'completed' ? 'check' : 'x'}
                        size={13}
                        className={b.status === 'completed' ? 'text-success' : 'text-ink-3'}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="text-[13px] font-medium truncate">
                          {b.clientReason ?? 'Visit'}
                        </div>
                        <div className="mono text-[11px] text-ink-3">{fmtVisit(b)}</div>
                      </div>
                      <Pill
                        tone={b.status === 'completed' ? 'success' : 'neutral'}
                        className="text-[10px]"
                      >
                        {b.status.replace('_', ' ')}
                      </Pill>
                    </div>
                  ))}
                </div>
              </>
            )}

            <Button
              variant="primary"
              size="lg"
              full
              className="h-[52px]"
              onClick={onContinue}
              iconRight="arrowR"
            >
              Continue to slot picker
            </Button>
          </>
        )}
      </div>
    </PhoneFrame>
  );
}

function ReturningSkeleton() {
  return (
    <>
      <div
        className="mb-4 p-4 rounded-[16px] flex items-center gap-3"
        style={{ background: 'var(--surface-2)', border: '1px solid var(--line)' }}
      >
        <SkeletonBox w={52} h={52} circle />
        <div className="flex-1 min-w-0">
          <SkeletonLine w={70} h={10} />
          <SkeletonLine w="60%" h={18} className="mt-2" />
          <SkeletonLine w="40%" h={10} className="mt-2" />
        </div>
      </div>
      <SkeletonLine w="80%" h={16} className="mb-2" />
      <SkeletonLine w="100%" h={11} />
      <div className="flex flex-col gap-2 mt-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonBox key={i} w="100%" h={48} />
        ))}
      </div>
      <SkeletonBox w="100%" h={48} className="mt-5" />
    </>
  );
}
