import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Avatar, Pill } from '@/components/ui';

interface ClientReturningScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

const VISITS = [
  { date: '12 Mar 2026', label: 'Dr. Okonkwo · Consult' },
  { date: '04 Jan 2026', label: 'Dr. Okonkwo · Follow-up' },
  { date: '27 Sep 2025', label: 'Dr. Dlamini · Consult' },
  { date: '18 Jun 2025', label: 'Dr. Okonkwo · Consult' },
] as const;

export function ClientReturningScreen({ onContinue, onBack }: ClientReturningScreenProps) {
  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-10">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-ink-2 text-[13px] cursor-pointer mb-[18px]"
        >
          <Icon name="chevronL" size={14} /> Use a different number
        </button>

        {/* Welcome back card */}
        <div
          className="mb-4 p-4 rounded-[16px] flex items-center gap-3"
          style={{
            background: 'linear-gradient(180deg, var(--teal-tint), var(--surface-2))',
            border: '1px solid color-mix(in oklab, var(--teal) 20%, transparent)',
          }}
        >
          <Avatar name="Sarah Mokoena" size={52} />
          <div>
            <div className="text-[11.5px] text-teal-ink font-semibold tracking-[0.03em] uppercase">
              Welcome back
            </div>
            <div className="text-[19px] font-medium tracking-[-0.01em] mt-0.5">
              Sarah Mokoena
            </div>
            <div className="text-[12px] text-ink-3 mt-0.5">
              Last visit: 12 March 2026
            </div>
          </div>
        </div>

        <h2 className="mt-5 mb-1.5 text-[18px] font-medium tracking-[-0.015em]">
          You've been here 4 times before
        </h2>
        <p className="m-0 mb-4 text-[13px] text-ink-3">
          We've kept your details on file. Pick how you'd like to be seen and we'll get you set up.
        </p>

        {/* Visit history */}
        <div className="flex flex-col gap-2 mb-[18px]">
          {VISITS.map(({ date, label }, i) => (
            <div
              key={i}
              className="px-3 py-2.5 border border-line rounded-[10px] flex items-center gap-2.5 bg-surface"
            >
              <Icon name="check" size={13} className="text-success" />
              <div className="flex-1">
                <div className="text-[13px] font-medium">{label}</div>
                <div className="mono text-[11px] text-ink-3">{date}</div>
              </div>
              <Pill tone="success" className="text-[10px]">Completed</Pill>
            </div>
          ))}
        </div>

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
      </div>
    </PhoneFrame>
  );
}
