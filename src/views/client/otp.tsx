import { useState, useEffect, useRef, useMemo } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button } from '@/components/ui';
import { cn } from '@/lib/utils';
import { confirmClientOtp, requestClientOtp } from '@/services/clientAuthApi';
import { listMyClientBookings } from '@/services/clientBookingApi';
import { resolveClientOrgId } from '@/lib/client-org';
import { useClientAuthStore } from '@/stores/clientAuthStore';
import { getApiErrorMessage } from '@/lib/api-error';
import type { BookingStatus } from '@/types';

export interface ClientOTPResult {
  isNewClient: boolean;
  /** True when the returning client has at least one in-flight booking — used
   *  to land them on /client/status (e.g. arriving from an SMS link) instead
   *  of the slot picker. */
  hasActiveBooking: boolean;
}

const ACTIVE_STATUSES = new Set<BookingStatus>([
  'pending_approval',
  'scheduled',
  'checked_in',
  'in_service',
]);

interface ClientOTPScreenProps {
  phone: string;
  onContinue: (result: ClientOTPResult) => void;
  onBack: () => void;
}

const CODE_LENGTH = 6;

function maskPhone(phone: string): string {
  // "+27821234521" → "+27 82 ••• 4521"
  if (phone.length < 6) return phone;
  const cc = phone.slice(0, 3);
  const head = phone.slice(3, 5);
  const tail = phone.slice(-4);
  return `${cc} ${head} ••• ${tail}`;
}

export function ClientOTPScreen({ phone, onContinue, onBack }: ClientOTPScreenProps) {
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [cd, setCd] = useState(30);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const setSession = useClientAuthStore((s) => s.setSession);
  const orgId = useMemo(() => resolveClientOrgId(), []);

  useEffect(() => {
    if (cd <= 0) return;
    const id = setTimeout(() => setCd((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cd]);

  const handleDigit = (i: number, val: string) => {
    if (!/^\d?$/.test(val)) return;
    const nd = [...digits];
    nd[i] = val;
    setDigits(nd);
    if (val && i < CODE_LENGTH - 1) inputRefs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) inputRefs.current[i - 1]?.focus();
  };

  const handleVerify = async () => {
    if (!orgId) {
      setError('Organisation context lost. Start again from the beginning.');
      return;
    }
    const code = digits.join('');
    if (code.length !== CODE_LENGTH) {
      setError('Enter all six digits.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const response = await confirmClientOtp({ orgId, phone, code });
      setSession(response.data, orgId, phone);

      // For returning clients, peek at their bookings so the route wrapper can
      // send them to /client/status (their active spot) rather than the slot
      // picker. New clients always have no bookings yet, so skip the call.
      let hasActiveBooking = false;
      if (!response.data.isNewClient) {
        try {
          const bookings = await listMyClientBookings();
          hasActiveBooking = bookings.data.some((b) => ACTIVE_STATUSES.has(b.status));
        } catch {
          // Non-fatal — fall back to the slot picker.
        }
      }

      onContinue({ isNewClient: response.data.isNewClient, hasActiveBooking });
    } catch (err) {
      setError(getApiErrorMessage(err, 'That code didn\'t work. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!orgId || cd > 0) return;
    setError(null);
    setResending(true);
    try {
      await requestClientOtp({ orgId, phone });
      setCd(30);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not resend code.'));
    } finally {
      setResending(false);
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
          <span className="mono tnum text-ink">{maskPhone(phone)}</span>.
        </p>

        <div className="flex gap-2 justify-between">
          {digits.map((d, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
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

        <div className="flex items-center justify-between mt-[18px]">
          <span className="text-[12.5px] text-ink-3">Didn't get a code?</span>
          {cd > 0 ? (
            <span className="text-[12.5px] text-ink-4">
              Resend in <span className="mono tnum">{cd}s</span>
            </span>
          ) : (
            <button
              className="text-[12.5px] text-teal-ink bg-transparent border-0 font-medium cursor-pointer disabled:opacity-50"
              onClick={handleResend}
              disabled={resending}
            >
              {resending ? 'Resending…' : 'Resend code'}
            </button>
          )}
        </div>

        {error && (
          <div className="text-coral text-[12.5px] mt-3" role="alert">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-7 h-[52px]"
          onClick={handleVerify}
          iconRight="arrowR"
          disabled={submitting}
        >
          {submitting ? 'Verifying…' : 'Verify'}
        </Button>

        <div className="text-center mt-4">
          <button
            className="bg-transparent border-0 text-ink-3 text-[12.5px] cursor-pointer"
            onClick={onBack}
          >
            Use a different number
          </button>
        </div>
      </div>
    </PhoneFrame>
  );
}
