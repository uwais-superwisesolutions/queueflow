import { useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Field } from '@/components/ui';

interface ClientPhoneScreenProps {
  onContinue: () => void;
}

export function ClientPhoneScreen({ onContinue }: ClientPhoneScreenProps) {
  const [phone, setPhone] = useState('82 414 4521');

  return (
    <PhoneFrame>
      <div className="px-6 pt-7 pb-6">
        {/* Practice header */}
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[9px] bg-teal text-white inline-flex items-center justify-center text-[13px] font-semibold flex-none">
            BF
          </span>
          <div>
            <div className="text-[14px] font-semibold tracking-[-0.005em]">Bryanston Family Practice</div>
            <div className="text-[11.5px] text-ink-3">General · Dental · Peds</div>
          </div>
        </div>

        {/* Hero text */}
        <h1 className="mt-8 mb-1.5 text-[24px] font-medium tracking-[-0.02em] leading-[1.2] text-balance">
          Skip the waiting room.<br />
          Get notified when it's your turn.
        </h1>
        <p className="mt-0 mb-6 text-ink-3 text-[13.5px] leading-relaxed">
          Enter your phone number to join. We'll text you a code and a live link to your spot in the queue.
        </p>

        {/* Phone field */}
        <Field label="Phone number">
          <div className="flex items-center gap-2 bg-surface border border-line-2 rounded-[10px] px-3 h-[50px]">
            <span className="inline-flex items-center gap-1.5 pr-2 border-r border-line h-[60%]">
              <span className="text-[16px]">🇿🇦</span>
              <span className="mono tnum text-[14px]">+27</span>
              <Icon name="chevronD" size={11} className="text-ink-3" />
            </span>
            <input
              value={phone}
              onChange={e => setPhone(e.target.value)}
              placeholder="82 123 4567"
              inputMode="tel"
              className="flex-1 h-full border-0 bg-transparent font-[inherit] text-[16px] text-ink outline-none"
            />
          </div>
        </Field>

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-[18px] h-[52px]"
          onClick={onContinue}
          iconRight="arrowR"
        >
          Continue
        </Button>

        {/* Returning user toggle */}
        <button
          className="mt-[18px] w-full px-3.5 py-3 bg-surface-2 border border-line rounded-[10px] cursor-pointer text-left flex items-center gap-2.5"
          onClick={onContinue}
        >
          <Icon name="refresh" size={15} className="text-ink-3" />
          <div className="flex-1">
            <div className="text-[12.5px] font-medium">I've been here before</div>
            <div className="text-[11px] text-ink-3">Verify with the same phone — we'll skip the details.</div>
          </div>
        </button>

        {/* Privacy note */}
        <div className="mt-6 px-3.5 py-3 bg-surface-2 rounded-[10px] flex gap-2.5 items-start">
          <Icon name="shield" size={14} className="text-ink-3 mt-0.5" />
          <div className="text-[11.5px] text-ink-3 leading-relaxed">
            We use your number only to send queue updates. Stored securely; not shared with third parties.
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}
