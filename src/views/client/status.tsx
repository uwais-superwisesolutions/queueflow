import { useState, useEffect, useRef } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Card } from '@/components/ui';
import { useTick } from '@/hooks/use-tick';
import { formatHMS } from '@/lib/time';
import { cn } from '@/lib/utils';

interface ClientStatusScreenProps {
  onCancel: () => void;
}

const BOOKING_DETAILS = [
  { label: 'Provider',  value: 'Dr. Amara Okonkwo',       icon: 'user'     },
  { label: 'Seat',      value: 'Consultation room 1',      icon: 'chair'    },
  { label: 'Type',      value: 'Consult · 30 min',          icon: 'clock'    },
  { label: 'Scheduled', value: 'Today, 15:00',              icon: 'calendar' },
] as const;

const UPDATES = [
  {
    tone: 'coral',
    icon: 'alert',
    text: <>Dr. Okonkwo is running ~10 min late. We've updated your estimated time.</>,
    age: '2m ago',
  },
  {
    tone: 'blue',
    icon: 'user',
    text: <>You moved up — now <b>#3</b>.</>,
    age: '8m ago',
  },
  {
    tone: 'success',
    icon: 'check',
    text: <>Your booking was approved by Dr. Okonkwo.</>,
    age: '27m ago',
  },
] as const;

const TOTAL = 5;
const INITIAL_ETA = 18 * 60 + 4;

export function ClientStatusScreen({ onCancel }: ClientStatusScreenProps) {
  const pos = 3;
  const etaRef = useRef(INITIAL_ETA);
  const [, forceRender] = useState(0);

  useTick(1000);

  useEffect(() => {
    const id = setInterval(() => {
      etaRef.current = Math.max(0, etaRef.current - 1);
      forceRender(n => n + 1);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneFrame>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-[7px] bg-teal text-white inline-flex items-center justify-center text-[11px] font-semibold flex-none">
            BF
          </span>
          <div className="flex-1">
            <div className="text-[13px] font-semibold">Bryanston Family Practice</div>
            <div className="text-[10.5px] text-ink-3 flex items-center gap-1">
              <span className="qf-live-dot" style={{ width: 5, height: 5 }} />
              Live status · updated 3s ago
            </div>
          </div>
          <button className="border-0 bg-surface-2 rounded-[8px] p-[7px] cursor-pointer text-ink-3">
            <Icon name="refresh" size={14} />
          </button>
        </div>

        {/* Big position number */}
        <div className="px-6 pb-6 text-center">
          <div className="mono text-[11px] text-ink-4 uppercase tracking-[0.08em] font-semibold">
            Your place in line
          </div>
          <div className="inline-flex items-baseline gap-1.5 my-2.5">
            <span className="text-[22px] text-ink-3 font-normal">#</span>
            <span
              className="tnum text-teal"
              style={{ fontSize: 84, fontWeight: 500, lineHeight: 0.95, letterSpacing: '-0.04em' }}
            >
              {pos}
            </span>
          </div>
          <div className="text-[13px] text-ink-2">
            of <span className="tnum">{TOTAL}</span> in Dr. Okonkwo's queue
          </div>

          {/* Queue dots */}
          <div className="flex gap-[7px] justify-center mt-5">
            {Array.from({ length: TOTAL }).map((_, i) => {
              const ahead = i < pos - 1;
              const me = i === pos - 1;
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 relative">
                  <span
                    className="rounded-full transition-all duration-300"
                    style={{
                      width:      me ? 18 : 12,
                      height:     me ? 18 : 12,
                      background: ahead ? 'var(--ink-4)' : me ? 'var(--teal)' : 'var(--line-2)',
                      boxShadow:  me ? '0 0 0 4px var(--teal-tint)' : 'none',
                    }}
                  />
                  {me && (
                    <span className="absolute top-6 text-[10px] text-teal-ink font-medium whitespace-nowrap">
                      You
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ETA card */}
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
              {formatHMS(etaRef.current)}
            </div>
            <div className="text-[11.5px] text-ink-3 mt-1">
              Around 15:08 · we'll text you 5 min before
            </div>
          </div>
        </div>

        {/* Booking details */}
        <div className="px-4 pb-4">
          <Card padding={0}>
            {BOOKING_DETAILS.map(({ label, value, icon }, i) => (
              <div
                key={i}
                className={cn(
                  'px-3.5 py-2.5 flex items-center gap-2.5',
                  i < BOOKING_DETAILS.length - 1 && 'border-b border-line',
                )}
              >
                <Icon name={icon} size={14} className="text-ink-3" />
                <span className="text-[12px] text-ink-3 w-[70px]">{label}</span>
                <span className="text-[13px] font-medium">{value}</span>
              </div>
            ))}
          </Card>
        </div>

        {/* Updates feed */}
        <div className="px-4 pb-4">
          <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
            Recent updates
          </div>
          <Card padding={0}>
            {UPDATES.map((u, i) => (
              <div
                key={i}
                className={cn('px-3.5 py-2.5 flex gap-2.5', i < UPDATES.length - 1 && 'border-b border-line')}
              >
                <span
                  className="w-[22px] h-[22px] rounded-[6px] flex-none inline-flex items-center justify-center"
                  style={{
                    background: `var(--${u.tone}-tint)`,
                    color:
                      u.tone === 'coral'   ? 'var(--coral-2)' :
                      u.tone === 'blue'    ? 'var(--blue)'    : 'var(--success)',
                  }}
                >
                  <Icon name={u.icon} size={12} />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] text-ink-2 leading-[1.45]">{u.text}</div>
                  <div className="text-[11px] text-ink-4 mt-0.5">{u.age}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Actions */}
        <div className="px-4 pb-6 flex flex-col gap-2">
          <Button variant="secondary" full className="h-[46px]" icon="clock">
            I'm running late
          </Button>
          <Button variant="danger-ghost" full className="h-[46px]" icon="x" onClick={onCancel}>
            Cancel my spot
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}
