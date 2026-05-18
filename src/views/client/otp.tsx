import { useState, useEffect, useRef } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button } from '@/components/ui';
import { cn } from '@/lib/utils';

interface ClientOTPScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export function ClientOTPScreen({ onContinue, onBack }: ClientOTPScreenProps) {
  const [digits, setDigits] = useState<string[]>(['4', '8', '2', '', '', '']);
  const [cd, setCd] = useState(30);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cd <= 0) return;
    const id = setTimeout(() => setCd(c => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cd]);

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const nd = [...digits];
    nd[i] = val;
    setDigits(nd);
    if (val && i < 5) {
      inputRefs.current[i + 1]?.focus();
    }
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputRefs.current[i - 1]?.focus();
    }
  };

  return (
    <PhoneFrame>
      <div className="px-6 pt-7 pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-ink-2 text-[13px] cursor-pointer mb-[22px]"
        >
          <Icon name="chevronL" size={14} /> Back
        </button>

        <h1 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em]">
          Enter the code we sent you
        </h1>
        <p className="m-0 mb-6 text-ink-3 text-[13.5px]">
          We sent a 6-digit code to{' '}
          <span className="mono tnum text-ink">+27 82 ••• 4521</span>.
        </p>

        {/* OTP inputs */}
        <div className="flex gap-2 justify-between">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={el => { inputRefs.current[i] = el; }}
              value={d}
              onChange={e => handleDigit(i, e.target.value)}
              onKeyDown={e => handleKeyDown(i, e)}
              maxLength={1}
              inputMode="numeric"
              className={cn(
                'w-[50px] h-[60px] text-center text-[22px] font-[inherit] mono',
                'bg-surface rounded-[10px] outline-none text-ink',
                'border-[1.5px] transition-colors duration-150',
                d ? 'border-teal' : 'border-line-2',
              )}
            />
          ))}
        </div>

        {/* Resend row */}
        <div className="flex items-center justify-between mt-[18px]">
          <span className="text-[12.5px] text-ink-3">Didn't get a code?</span>
          {cd > 0 ? (
            <span className="text-[12.5px] text-ink-4">
              Resend in <span className="mono tnum">{cd}s</span>
            </span>
          ) : (
            <button
              className="text-[12.5px] text-teal-ink bg-transparent border-0 font-medium cursor-pointer"
              onClick={() => setCd(30)}
            >
              Resend code
            </button>
          )}
        </div>

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-7 h-[52px]"
          onClick={onContinue}
          iconRight="arrowR"
        >
          Verify
        </Button>

        <div className="text-center mt-4">
          <button className="bg-transparent border-0 text-ink-3 text-[12.5px] cursor-pointer">
            Use a different number
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
