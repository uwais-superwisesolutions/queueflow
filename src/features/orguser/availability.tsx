import { useMemo } from 'react';
import { Icon, Button, Card, Pill } from '@/components/ui';
import { TopBar } from '@/components/layout';
import { cn } from '@/lib/utils';

// ─────────────────────────────────────────────────────────────────
// Static mock data
// ─────────────────────────────────────────────────────────────────
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATES = [18, 19, 20, 21, 22, 23, 24];

// Working hours per day: [startSlot, endSlot] (each slot = 30 min, 0 = 08:00)
// null means day off
const WORK: ([number, number] | null)[] = [
  [2, 18],  // Mon  09:00–17:00
  [2, 18],  // Tue
  [4, 18],  // Wed  10:00–17:00
  [2, 18],  // Thu
  [2, 14],  // Fri  09:00–15:00
  null,     // Sat  off
  null,     // Sun  off
];

interface BookingOverlay {
  name: string;
  type: string;
  color: string;
}

// Key format: "dayIndex-slotIndex"
const BOOKINGS: Record<string, BookingOverlay> = {
  '0-4':  { name: 'Sarah M.',   type: 'Consult',   color: '#0f6e56' },
  '0-7':  { name: 'Jabu K.',    type: 'Follow-up', color: '#2a6fcc' },
  '1-6':  { name: 'Beth C.',    type: 'Consult',   color: '#0f6e56' },
  '1-10': { name: 'Lerato D.',  type: 'Consult',   color: '#0f6e56' },
  '2-8':  { name: 'Naledi S.',  type: 'Consult',   color: '#0f6e56' },
  '3-3':  { name: 'Khanyi M.',  type: 'Follow-up', color: '#2a6fcc' },
  '4-6':  { name: 'Tom O.',     type: 'Consult',   color: '#0f6e56' },
};

const SLOT_HEIGHT = 24; // px per 30-min slot

// ─────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────
export function AvailabilityView() {
  // Generate time slots: 08:00 to 17:30 in 30-min increments (20 slots)
  const slots = useMemo(() => {
    const out: string[] = [];
    for (let h = 8; h < 18; h++) {
      for (let m = 0; m < 60; m += 30) {
        out.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      }
    }
    return out;
  }, []);

  return (
    <>
      <TopBar
        title="My availability"
        subtitle="Working hours and exceptions for your week."
        breadcrumb={['Dashboard', 'Availability']}
        right={
          <div className="flex gap-2">
            <Button variant="secondary" icon="refresh">Recurring schedule</Button>
            <Button variant="primary" icon="plus">Add exception</Button>
          </div>
        }
      />

      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '16px 24px 40px' }}>
        {/* Conflict warning banner */}
        <div
          className="flex items-center gap-[10px] px-3.5 py-[10px] rounded-[10px] border mb-4"
          style={{
            background: 'var(--coral-tint)',
            borderColor: 'color-mix(in oklab, var(--coral) 30%, transparent)',
          }}
        >
          <Icon name="alert" size={16} className="text-coral-2 flex-none" />
          <span className="text-[13px] text-coral-2 flex-1">
            <b className="font-semibold">3 scheduled bookings</b> fall in newly-blocked hours.
          </span>
          <Button variant="secondary" size="sm">Review →</Button>
        </div>

        {/* Week navigation toolbar */}
        <div className="flex items-center gap-3 mb-3">
          <div className="flex gap-1">
            <Button variant="ghost" size="sm" icon="chevronL" />
            <Button variant="secondary" size="sm">This week</Button>
            <Button variant="ghost" size="sm" icon="chevronR" />
          </div>
          <span className="text-[13.5px] font-medium">18 — 24 May 2026</span>
          <span className="flex-1" />
          <div className="flex gap-1">
            {(['Day', 'Week', 'Month'] as const).map((v, i) => (
              <Button key={v} variant={i === 1 ? 'secondary' : 'ghost'} size="sm">{v}</Button>
            ))}
          </div>
        </div>

        {/* Calendar grid */}
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {/* Day header row */}
          <div
            className="border-b border-line bg-surface-2"
            style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, 1fr)` }}
          >
            <div /> {/* empty corner */}
            {DAYS.map((d, i) => (
              <div
                key={d}
                className="flex items-baseline gap-1.5 px-3 py-[10px] border-l border-line"
              >
                <span className="text-[11.5px] text-ink-3 font-medium">{d}</span>
                <span
                  className={cn(
                    'tnum text-[14px] font-medium',
                    i === 0 ? 'text-teal' : 'text-ink',
                  )}
                >
                  {DATES[i]}
                </span>
                {!WORK[i] && (
                  <Pill tone="neutral" className="ml-auto text-[10px]">Off</Pill>
                )}
              </div>
            ))}
          </div>

          {/* Time grid body */}
          <div
            className="relative"
            style={{ display: 'grid', gridTemplateColumns: `56px repeat(7, 1fr)` }}
          >
            {/* Hour labels column */}
            <div>
              {slots.map((s, i) => (
                <div
                  key={s}
                  className={cn(
                    'relative text-right px-2',
                    i < slots.length - 1 && 'border-b border-line',
                  )}
                  style={{ height: SLOT_HEIGHT, fontSize: 10.5, color: 'var(--ink-4)' }}
                >
                  {s.endsWith(':00') && (
                    <span className="mono absolute right-2" style={{ top: -5 }}>{s}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Day columns */}
            {DAYS.map((d, dayIdx) => {
              const w = WORK[dayIdx];
              const dayBookings = Object.entries(BOOKINGS).filter(([k]) =>
                k.startsWith(`${dayIdx}-`),
              );

              return (
                <div key={d} className="relative border-l border-line">
                  {/* Slot cells (background shading for off/out-of-hours) */}
                  {slots.map((_s, i) => {
                    const outOfHours = !w || i < w[0] || i >= w[1];
                    return (
                      <div
                        key={i}
                        className={cn(i < slots.length - 1 && 'border-b border-line')}
                        style={{
                          height: SLOT_HEIGHT,
                          background: outOfHours ? 'var(--surface-2)' : 'transparent',
                        }}
                      />
                    );
                  })}

                  {/* Working-hours highlight overlay */}
                  {w && (
                    <div
                      className="absolute left-1 right-1 rounded-[4px] pointer-events-none"
                      style={{
                        top: w[0] * SLOT_HEIGHT,
                        height: (w[1] - w[0]) * SLOT_HEIGHT,
                        background: 'color-mix(in oklab, var(--teal) 8%, transparent)',
                        border: '1px solid color-mix(in oklab, var(--teal) 25%, transparent)',
                      }}
                    />
                  )}

                  {/* Booking chips */}
                  {dayBookings.map(([k, b]) => {
                    const slotIdx = parseInt(k.split('-')[1], 10);
                    return (
                      <div
                        key={k}
                        className="absolute overflow-hidden rounded-[4px] shadow-sm"
                        style={{
                          top: slotIdx * SLOT_HEIGHT,
                          height: SLOT_HEIGHT * 2,   // bookings span 2 slots (1 hour)
                          left: 6,
                          right: 6,
                          background: 'var(--surface)',
                          border: '1px solid var(--line-2)',
                          borderLeft: `3px solid ${b.color}`,
                          padding: '3px 6px',
                        }}
                      >
                        <div
                          className="font-medium leading-[1.2] text-ink"
                          style={{ fontSize: 11 }}
                        >
                          {b.name}
                        </div>
                        <div className="text-ink-3" style={{ fontSize: 10 }}>{b.type}</div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </>
  );
}
