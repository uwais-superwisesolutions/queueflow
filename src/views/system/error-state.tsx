import { Icon, Button, Card, Pill, Avatar, Field, TextInput } from '@/components/ui';

function FailedBookingMock() {
  return (
    <Card padding={0} className="overflow-hidden max-w-[380px] mx-auto">
      <div className="p-5 pb-0">
        {/* Practice header */}
        <div className="flex items-center gap-2.5">
          <span className="w-8 h-8 rounded-[8px] bg-teal text-white inline-flex items-center justify-center text-[12px] font-semibold flex-none">
            BF
          </span>
          <div>
            <div className="text-[13px] font-semibold">Bryanston Family Practice</div>
            <div className="text-[11px] text-ink-3">Confirming your booking…</div>
          </div>
        </div>

        {/* Phone field (errored) */}
        <div className="mt-[18px]">
          <Field label="Phone number">
            <TextInput defaultValue="+27 82 414 4521" error />
          </Field>
        </div>

        {/* Error banner */}
        <div
          className="mt-3.5 p-3 rounded-[10px] flex gap-2.5 items-start"
          style={{
            background: 'var(--coral-tint)',
            border: '1px solid color-mix(in oklab, var(--coral) 30%, transparent)',
          }}
        >
          <Icon name="alert" size={16} className="text-coral-2 mt-px flex-none" />
          <div className="min-w-0">
            <div className="text-[12.5px] text-coral-2 font-semibold">
              We couldn't hold your slot
            </div>
            <div className="text-[12px] text-coral-2 mt-0.5 leading-relaxed">
              Someone else just took 15:00 with Dr. Okonkwo. Your details are saved —
              pick another time below.
            </div>
          </div>
        </div>

        {/* Next available */}
        <div className="mt-3.5 p-3 bg-surface-2 border border-line rounded-[10px]">
          <div className="text-[11px] text-ink-4 uppercase tracking-[0.05em] font-semibold mb-1.5">
            Next available
          </div>
          {[
            ['Dr. Okonkwo', '15:30', 'Consult · 30 min'],
            ['Dr. Dlamini', '14:55', 'Follow-up · 15 min'],
            ['Nurse Smith', '15:10', 'Triage · 10 min'],
          ].map(([name, time, label]) => (
            <div key={name} className="py-2 flex items-center gap-2.5 border-t border-line">
              <Avatar name={name} size={24} />
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium">{name}</div>
                <div className="text-[11px] text-ink-3">{label}</div>
              </div>
              <span className="mono tnum text-[13px] font-medium">{time}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="p-4">
        <Button variant="primary" full className="h-[46px]" iconRight="arrowR">
          Try 15:30
        </Button>
      </div>
    </Card>
  );
}

function ConnectionLostMock() {
  return (
    <Card padding={0} className="overflow-hidden">
      {/* Banner */}
      <div
        className="px-4 py-2.5 border-b flex items-center gap-2.5 text-coral-2"
        style={{
          background: 'var(--coral-tint)',
          borderBottomColor: 'color-mix(in oklab, var(--coral) 25%, transparent)',
        }}
      >
        <span
          className="w-[7px] h-[7px] rounded-full bg-coral flex-none"
          style={{ opacity: 0.6 }}
        />
        <span className="text-[12.5px] font-medium flex-1">
          Connection lost · showing data from 47s ago
        </span>
        <Button variant="secondary" size="sm" icon="refresh">Retry</Button>
      </div>

      {/* Stale queue rows */}
      <div className="p-[18px] flex flex-col gap-3" style={{ opacity: 0.55 }}>
        {[
          ['Beth Cele',          'Consult · requested 15:00',    'amber'],
          ['Michael v.d. Berg',  'Follow-up · requested 15:15',  'amber'],
          ['Sarah Mokoena',      'In service · 4:23 elapsed',    'blue'],
        ].map(([name, label, tone], i) => (
          <div key={i} className="p-3 border border-line rounded-[10px] flex items-center gap-2.5">
            <Avatar name={name} size={28} />
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium">{name}</div>
              <div className="text-[11.5px] text-ink-3">{label}</div>
            </div>
            <Pill tone={tone as 'amber' | 'blue'}>—</Pill>
          </div>
        ))}
      </div>

      {/* Footer note */}
      <div className="px-4 py-2.5 border-t border-line bg-surface-2 text-[12px] text-ink-3">
        Actions are paused while reconnecting. Your queue stays visible.
      </div>
    </Card>
  );
}

export function ErrorStateScreen() {
  return (
    <div className="min-h-screen bg-bg px-6 py-8">
      <div className="max-w-[1100px] mx-auto">
        <div className="flex items-center gap-2.5 mb-1.5">
          <h1 className="m-0 text-[22px] font-medium tracking-[-0.02em]">Error states</h1>
          <Pill tone="neutral">Inline · never destructive toast</Pill>
        </div>
        <p className="m-0 mb-6 text-[13.5px] text-ink-3">
          Failures surface where the user is looking. Always with a path forward — never a dead end.
        </p>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
              Failed booking submission · client
            </div>
            <FailedBookingMock />
          </div>

          <div>
            <div className="text-[11px] text-ink-4 uppercase tracking-[0.06em] font-semibold mb-2">
              Connection lost · org user queue
            </div>
            <ConnectionLostMock />
          </div>
        </div>
      </div>
    </div>
  );
}
