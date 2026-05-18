import { useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Avatar, Pill } from '@/components/ui';
import { cn } from '@/lib/utils';

interface SlotSelection {
  providerId: string;
  slot: string;
  type?: string;
  duration?: number;
}

interface ClientSlotPickerScreenProps {
  onSelect: (sel: SlotSelection) => void;
  onBack: () => void;
}

interface SlotDef {
  time: string;
  today: boolean;
  type: string;
  duration: number;
}

interface ProviderDef {
  id: string;
  name: string;
  role: string;
  queue: number;
  next: string;
  slots: SlotDef[];
}

const PROVIDERS: ProviderDef[] = [
  {
    id: 'a', name: 'Dr. Amara Okonkwo', role: 'GP · Room 1', queue: 3, next: '15:00',
    slots: [
      { time: '15:00', today: true,  type: 'Consult',   duration: 30 },
      { time: '15:30', today: true,  type: 'Consult',   duration: 30 },
      { time: '16:00', today: true,  type: 'Follow-up', duration: 15 },
      { time: '09:00', today: false, type: 'Consult',   duration: 30 },
      { time: '10:00', today: false, type: 'Follow-up', duration: 15 },
    ],
  },
  {
    id: 'b', name: 'Dr. Sipho Dlamini', role: 'GP · Room 2', queue: 1, next: '14:55',
    slots: [
      { time: '14:55', today: true, type: 'Follow-up', duration: 15 },
      { time: '15:30', today: true, type: 'Consult',   duration: 30 },
    ],
  },
  {
    id: 'c', name: 'Nurse Lerato Smith', role: 'Triage · Desk', queue: 8, next: '15:10',
    slots: [
      { time: '15:10', today: true, type: 'Triage', duration: 10 },
      { time: '15:20', today: true, type: 'Triage', duration: 10 },
    ],
  },
];

const OTHER_ANY: [string, string, string][] = [
  ['Dr. Okonkwo',    '15:00', 'Consult · 30 min'],
  ['Nurse L. Smith', '15:10', 'Triage · 10 min'],
  ['Dr. Okonkwo',    '15:30', 'Consult · 30 min'],
];

function ProviderTile({
  p, open, onToggle, onSelect,
}: {
  p: ProviderDef;
  open: boolean;
  onToggle: () => void;
  onSelect: (sel: SlotSelection) => void;
}) {
  const todaySlots = p.slots.filter(s => s.today);
  const tomorrowSlots = p.slots.filter(s => !s.today);

  return (
    <div
      className={cn(
        'bg-surface rounded-[12px] overflow-hidden transition-[border-color,box-shadow] duration-150',
        open
          ? 'border border-teal shadow-[0_0_0_3px_var(--teal-tint)]'
          : 'border border-line-2 shadow-sm',
      )}
    >
      <button
        onClick={onToggle}
        className="w-full p-3 bg-transparent border-0 cursor-pointer text-left grid items-center gap-3"
        style={{ gridTemplateColumns: 'auto 1fr auto' }}
      >
        <Avatar name={p.name} size={40} active />
        <div>
          <div className="text-[14px] font-medium">{p.name}</div>
          <div className="text-[11.5px] text-ink-3">{p.role} · {p.queue} in queue</div>
        </div>
        <div className="text-right">
          <div className="mono tnum text-[16px] font-medium">{p.next}</div>
          <div className="text-[10px] text-ink-4 uppercase tracking-[0.05em]">next slot</div>
        </div>
      </button>

      {open && (
        <div className="border-t border-line p-3">
          {todaySlots.length > 0 && (
            <>
              <div className="text-[11px] text-ink-4 uppercase tracking-[0.05em] font-semibold mb-2">
                Today
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {todaySlots.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect({ providerId: p.id, slot: s.time, type: s.type, duration: s.duration })}
                    className="py-2.5 px-1 bg-surface border border-line-2 rounded-[8px] cursor-pointer flex flex-col items-center gap-0.5"
                  >
                    <span className="mono tnum text-[14px] font-medium">{s.time}</span>
                    <span className="text-[10px] text-ink-3">{s.duration}m</span>
                  </button>
                ))}
              </div>
            </>
          )}
          {tomorrowSlots.length > 0 && (
            <>
              <div className="text-[11px] text-ink-4 uppercase tracking-[0.05em] font-semibold mt-2.5 mb-2">
                Tomorrow
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                {tomorrowSlots.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => onSelect({ providerId: p.id, slot: s.time })}
                    className="py-2.5 px-1 bg-surface border border-line-2 rounded-[8px] cursor-pointer flex flex-col items-center gap-0.5"
                  >
                    <span className="mono tnum text-[14px] font-medium">{s.time}</span>
                    <span className="text-[10px] text-ink-3">{s.duration}m</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export function ClientSlotPickerScreen({ onSelect, onBack }: ClientSlotPickerScreenProps) {
  const [tab, setTab] = useState<'specific' | 'any'>('specific');
  const [expanded, setExpanded] = useState<string | null>('a');

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
          Welcome back, Sarah.
        </h1>
        <p className="m-0 mb-[18px] text-ink-3 text-[13.5px]">
          Choose how you'd like to be seen. Your last visit was 12 March.
        </p>

        {/* Tab switcher */}
        <div className="grid grid-cols-2 gap-1 bg-surface-2 p-1 rounded-[10px] mb-3.5">
          {(['specific', 'any'] as const).map(id => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'py-2.5 px-2 border-0 rounded-[7px] text-[13px] font-medium cursor-pointer transition-all duration-150',
                tab === id
                  ? 'bg-surface text-ink shadow-sm'
                  : 'bg-transparent text-ink-3',
              )}
            >
              {id === 'specific' ? 'Pick a person' : 'Any available'}
            </button>
          ))}
        </div>

        {tab === 'specific' ? (
          <div className="flex flex-col gap-2.5">
            {PROVIDERS.map(p => (
              <ProviderTile
                key={p.id}
                p={p}
                open={expanded === p.id}
                onToggle={() => setExpanded(expanded === p.id ? null : p.id)}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {/* Earliest highlight */}
            <div
              className="p-4 rounded-[12px]"
              style={{
                background: 'var(--teal-tint)',
                border: '1px solid color-mix(in oklab, var(--teal) 25%, transparent)',
              }}
            >
              <Pill tone="teal" dot>Earliest available</Pill>
              <div className="mt-2.5 flex items-center gap-3">
                <Avatar name="Sipho Dlamini" size={36} />
                <div className="flex-1">
                  <div className="text-[14px] font-medium">Dr. Sipho Dlamini</div>
                  <div className="text-[11.5px] text-ink-3">Follow-up · 15 min</div>
                </div>
                <div className="mono tnum text-[18px] font-medium text-teal-ink">14:55</div>
              </div>
              <Button
                variant="primary"
                full
                className="mt-3.5 h-[48px]"
                onClick={() => onSelect({ providerId: 'b', slot: '14:55' })}
              >
                Take this slot
              </Button>
            </div>

            <div className="mt-1 text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold">
              Other options today
            </div>

            {OTHER_ANY.map(([name, time, label], i) => (
              <button
                key={i}
                onClick={() => onSelect({ providerId: 'a', slot: time })}
                className="bg-surface border border-line-2 rounded-[10px] p-3 text-left cursor-pointer grid items-center gap-2.5"
                style={{ gridTemplateColumns: 'auto 1fr auto' }}
              >
                <Avatar name={name} size={28} />
                <div>
                  <div className="text-[13px] font-medium">{name}</div>
                  <div className="text-[11.5px] text-ink-3">{label}</div>
                </div>
                <div className="mono tnum text-[16px] font-medium text-ink">{time}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PhoneFrame>
  );
}
