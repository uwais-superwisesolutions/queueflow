import { useState, useEffect } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Avatar } from '@/components/ui';
import { formatMS } from '@/lib/time';

interface ClientConfirmationScreenProps {
  onApproved: () => void;
  onPickAnother: () => void;
}

export function ClientConfirmationScreen({ onApproved, onPickAnother }: ClientConfirmationScreenProps) {
  const [hold, setHold] = useState(14 * 60 + 32);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const id = setInterval(() => setHold(h => Math.max(0, h - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-10 text-center">
        {/* Pulsing clock icon */}
        <div className="mx-auto mb-4 w-[84px] h-[84px] rounded-full bg-teal-tint flex items-center justify-center relative">
          <span className="absolute inset-0 rounded-full border-2 border-teal opacity-40 animate-qf-pulse" />
          <Icon name="clock" size={32} className="text-teal-ink" stroke={1.5} />
        </div>

        <h1 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">
          Your request is being reviewed
        </h1>
        <p className="m-0 mb-[18px] text-ink-3 text-[13.5px] leading-relaxed">
          We're holding your slot while Dr. Okonkwo confirms. This usually takes 1–2 minutes.
        </p>

        {/* Slot card */}
        <div className="mb-4 p-4 bg-surface border border-line rounded-[14px] text-left">
          <div className="flex items-center gap-2.5">
            <Avatar name="Amara Okonkwo" size={36} active />
            <div className="flex-1">
              <div className="text-[13.5px] font-medium">Dr. Amara Okonkwo</div>
              <div className="text-[11.5px] text-ink-3">General Practice · Room 1</div>
            </div>
          </div>
          <div
            className="mt-3 pt-3 border-t border-line grid grid-cols-2 gap-2.5"
          >
            <div>
              <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.05em] font-semibold">Time</div>
              <div className="mono tnum text-[16px] font-medium mt-0.5">15:00</div>
            </div>
            <div>
              <div className="text-[10.5px] text-ink-4 uppercase tracking-[0.05em] font-semibold">Type</div>
              <div className="text-[13px] mt-1 flex items-center gap-1.5">
                <span className="w-[7px] h-[7px] rounded-[2px] bg-teal flex-none" />
                Consult · 30 min
              </div>
            </div>
          </div>
        </div>

        {/* Soft-hold countdown */}
        <div
          className="mb-4 px-3.5 py-3.5 rounded-[12px] flex items-center gap-3"
          style={{
            background: 'var(--amber-tint)',
            border: '1px solid color-mix(in oklab, var(--amber) 30%, transparent)',
          }}
        >
          <Icon name="clock" size={18} className="text-amber" />
          <div className="flex-1 text-left">
            <div className="text-[11.5px] text-amber font-semibold tracking-[0.02em]">Slot held for</div>
            <div className="mono tnum text-[18px] font-medium text-amber">{formatMS(hold)}</div>
          </div>
          <Button variant="primary" size="sm" onClick={onApproved}>
            Simulate approval
          </Button>
        </div>

        {/* Expandable accordion */}
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full text-left px-3.5 py-3 bg-surface-2 border border-line rounded-[10px] cursor-pointer flex items-center gap-2"
        >
          <Icon name="info" size={15} className="text-ink-3" />
          <span className="text-[13px] font-medium flex-1">What happens next?</span>
          <Icon name={expanded ? 'chevronU' : 'chevronD'} size={13} className="text-ink-3" />
        </button>
        {expanded && (
          <div
            className="px-3.5 py-3.5 bg-surface border border-line border-t-0 rounded-b-[10px] text-[12.5px] text-ink-2 leading-relaxed text-left"
          >
            <p className="m-0">
              Once Dr. Okonkwo approves, you'll get an SMS with a live link to your spot.
              You can leave home — we'll text you 5 minutes before it's your turn.
            </p>
            <p className="m-0 mt-2 text-ink-3">
              If you'd rather pick something different, you can release the hold below.
            </p>
          </div>
        )}

        <button
          onClick={onPickAnother}
          className="mt-3.5 bg-transparent border-0 text-ink-3 text-[12.5px] cursor-pointer underline underline-offset-[3px]"
        >
          Release this slot &amp; pick a different one
        </button>
      </div>
    </PhoneFrame>
  );
}
