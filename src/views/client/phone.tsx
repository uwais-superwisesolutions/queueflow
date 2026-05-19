import { useMemo, useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Field } from '@/components/ui';
import { requestClientOtp } from '@/services/clientAuthApi';
import { resolveClientOrgId } from '@/lib/client-org';
import { getApiErrorMessage } from '@/lib/api-error';

interface ClientPhoneScreenProps {
  onContinue: (phone: string) => void;
}

const COUNTRY_DIAL_CODE = '+27';

function normalisePhone(input: string): string {
  const digits = input.replace(/\D+/g, '').replace(/^0+/, '');
  return `${COUNTRY_DIAL_CODE}${digits}`;
}

export function ClientPhoneScreen({ onContinue }: ClientPhoneScreenProps) {
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const orgId = useMemo(() => resolveClientOrgId(), []);

  const handleContinue = async () => {
    if (!orgId) {
      setError('No organisation selected. Open a QueueFlow portal link to start.');
      return;
    }
    const normalised = normalisePhone(phone);
    if (normalised.length <= COUNTRY_DIAL_CODE.length) {
      setError('Please enter a phone number.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await requestClientOtp({ orgId, phone: normalised });
      onContinue(normalised);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not send code. Try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PhoneFrame>
      <div className="px-6 pt-7 pb-6">
        <div className="flex items-center gap-2.5">
          <span className="w-9 h-9 rounded-[9px] bg-teal text-white inline-flex items-center justify-center text-[13px] font-semibold flex-none">
            BF
          </span>
          <div>
            <div className="text-[14px] font-semibold tracking-[-0.005em]">Bryanston Family Practice</div>
            <div className="text-[11.5px] text-ink-3">General · Dental · Peds</div>
          </div>
        </div>

        <h1 className="mt-8 mb-1.5 text-[24px] font-medium tracking-[-0.02em] leading-[1.2] text-balance">
          Skip the waiting room.<br />
          Get notified when it's your turn.
        </h1>
        <p className="mt-0 mb-6 text-ink-3 text-[13.5px] leading-relaxed">
          Enter your phone number to join. We'll text you a code and a live link to your spot in the queue.
        </p>

        <Field label="Phone number">
          <div className="flex items-center gap-2 bg-surface border border-line-2 rounded-[10px] px-3 h-[50px]">
            <span className="inline-flex items-center gap-1.5 pr-2 border-r border-line h-[60%]">
              <span className="text-[16px]">🇿🇦</span>
              <span className="mono tnum text-[14px]">{COUNTRY_DIAL_CODE}</span>
              <Icon name="chevronD" size={11} className="text-ink-3" />
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="82 123 4567"
              inputMode="tel"
              autoComplete="tel-national"
              className="flex-1 h-full border-0 bg-transparent font-[inherit] text-[16px] text-ink outline-none min-w-0"
            />
          </div>
        </Field>

        {error && (
          <div className="text-coral text-[12.5px] mt-3" role="alert">
            {error}
          </div>
        )}

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-[18px] h-[52px]"
          onClick={handleContinue}
          iconRight="arrowR"
          disabled={submitting}
        >
          {submitting ? 'Sending code…' : 'Continue'}
        </Button>

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
