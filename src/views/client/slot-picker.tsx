 
import { useEffect, useMemo, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Pill, SkeletonBox } from '@/components/ui';
import { cn } from '@/lib/utils';
import { searchSlots } from '@/services/slotApi';
import { getApiErrorMessage } from '@/lib/api-error';
import type { SlotResponse } from '@/types';

export interface SlotSelection {
  /** Original SlotResponse — handed off to the confirmation screen. */
  slot: SlotResponse;
  /** What we display to the user on confirm (short label). */
  label: string;
}

interface ClientSlotPickerScreenProps {
  onSelect: (sel: SlotSelection) => void;
  onBack: () => void;
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function fmtTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}

function durationMin(slot: SlotResponse): number {
  return Math.round((new Date(slot.endAt).getTime() - new Date(slot.startAt).getTime()) / 60_000);
}

function dayBucket(slot: SlotResponse, today: Date, tomorrow: Date): 'today' | 'tomorrow' | 'later' {
  const start = new Date(slot.startAt);
  const d = isoDate(start);
  if (d === isoDate(today)) return 'today';
  if (d === isoDate(tomorrow)) return 'tomorrow';
  return 'later';
}

export function ClientSlotPickerScreen({ onSelect, onBack }: ClientSlotPickerScreenProps) {
  const [slots, setSlots] = useState<SlotResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<'today' | 'tomorrow'>('today');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const today = new Date();
        const horizon = new Date();
        horizon.setDate(today.getDate() + 6); // today + next 6 days
        const resp = await searchSlots({ from: isoDate(today), to: isoDate(horizon) });
        if (!cancelled) {
          const sorted = [...resp.data].sort((a, b) => a.startAt.localeCompare(b.startAt));
          setSlots(sorted);
        }
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load slots.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    return t;
  }, []);

  const grouped = useMemo(() => {
    const todays: SlotResponse[] = [];
    const tomorrows: SlotResponse[] = [];
    const laters: SlotResponse[] = [];
    for (const s of slots) {
      const bucket = dayBucket(s, today, tomorrow);
      if (bucket === 'today') todays.push(s);
      else if (bucket === 'tomorrow') tomorrows.push(s);
      else laters.push(s);
    }
    return { todays, tomorrows, laters };
  }, [slots, today, tomorrow]);

  const visibleSlots = tab === 'today' ? grouped.todays : grouped.tomorrows;
  const earliest = grouped.todays[0] ?? grouped.tomorrows[0] ?? grouped.laters[0];

  const handleSelect = (slot: SlotResponse) => {
    onSelect({
      slot,
      label: `${fmtTime(slot.startAt)} · ${durationMin(slot)} min`,
    });
  };

  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-20">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-ink-2 text-[13px] cursor-pointer mb-4"
        >
          <Icon name="chevronL" size={14} /> Back
        </button>

        <h1 className="m-0 mb-1.5 text-[22px] font-medium tracking-[-0.02em]">
          Choose how you'd like to be seen.
        </h1>
        <p className="m-0 mb-[18px] text-ink-3 text-[13.5px]">
          Slots show what's open right now across your team.
        </p>

        {/* Earliest available highlight */}
        {earliest && !loading && (
          <div
            className="p-4 rounded-[12px] mb-3.5"
            style={{
              background: 'var(--teal-tint)',
              border: '1px solid color-mix(in oklab, var(--teal) 25%, transparent)',
            }}
          >
            <Pill tone="teal" dot>
              Earliest available
            </Pill>
            <div className="mt-2.5 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-medium truncate">
                  {fmtTime(earliest.startAt)}
                </div>
                <div className="text-[11.5px] text-ink-3 truncate">
                  {durationMin(earliest)} min · {dayBucket(earliest, today, tomorrow) === 'today' ? 'Today' : 'Tomorrow'}
                </div>
              </div>
              <div className="mono tnum text-[18px] font-medium text-teal-ink">
                {fmtTime(earliest.startAt)}
              </div>
            </div>
            <Button
              variant="primary"
              full
              className="mt-3.5 h-[48px]"
              onClick={() => handleSelect(earliest)}
            >
              Take this slot
            </Button>
          </div>
        )}

        {/* Day tabs */}
        <div className="grid grid-cols-2 gap-1 bg-surface-2 p-1 rounded-[10px] mb-3.5">
          {(
            [
              { id: 'today', label: `Today (${grouped.todays.length})` },
              { id: 'tomorrow', label: `Tomorrow (${grouped.tomorrows.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'py-2.5 px-2 border-0 rounded-[7px] text-[13px] font-medium cursor-pointer transition-all duration-150',
                tab === t.id ? 'bg-surface text-ink shadow-sm' : 'bg-transparent text-ink-3',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        {error && (
          <div className="text-coral text-[12.5px] mb-3" role="alert">
            <Icon name="alert" size={12} /> {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-3 gap-1.5">
            {Array.from({ length: 9 }).map((_, i) => (
              <SkeletonBox key={i} w="100%" h={52} />
            ))}
          </div>
        ) : visibleSlots.length === 0 ? (
          <div className="p-4 text-center text-[13px] text-ink-3 border border-line rounded-[10px] bg-surface">
            {tab === 'today'
              ? 'No more openings today.'
              : "Nothing's open tomorrow yet — check later in the week."}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {visibleSlots.map((s) => (
              <button
                key={`${s.orgMemberId}-${s.startAt}`}
                onClick={() => handleSelect(s)}
                className="py-2.5 px-1 bg-surface border border-line-2 rounded-[8px] cursor-pointer flex flex-col items-center gap-0.5 hover:border-teal transition-colors duration-150"
              >
                <span className="mono tnum text-[14px] font-medium">
                  {fmtTime(s.startAt)}
                </span>
                <span className="text-[10px] text-ink-3">{durationMin(s)} min</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
