import { useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Field, TextInput } from '@/components/ui';

export interface NewDetailsResult {
  /** Trimmed reason for visit, or null when empty. Forwarded to the booking-create payload. */
  clientReason: string | null;
}

interface ClientNewDetailsScreenProps {
  onContinue: (result: NewDetailsResult) => void;
  onBack: () => void;
}

// First name / last name / email / SMS consent are captured visually but not
// persisted yet — the backend has no client-profile-update endpoint as of
// Phase 1. Reason-for-visit *is* persisted via CreateBookingRequest.clientReason.
export function ClientNewDetailsScreen({ onContinue, onBack }: ClientNewDetailsScreenProps) {
  const [reason, setReason] = useState('');

  const handleContinue = () => {
    const trimmed = reason.trim();
    onContinue({ clientReason: trimmed.length > 0 ? trimmed : null });
  };

  return (
    <PhoneFrame>
      <div className="px-5 pt-6 pb-6">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 bg-transparent border-0 p-0 text-ink-2 text-[13px] cursor-pointer mb-[18px]"
        >
          <Icon name="chevronL" size={14} /> Back
        </button>

        <h1 className="m-0 mb-1.5 text-[22px] font-medium tracking-[-0.02em]">
          Welcome — a couple of quick details.
        </h1>
        <p className="m-0 mb-[22px] text-ink-3 text-[13.5px] leading-relaxed">
          We don't have you on file. Once you're set up, you won't need to do this again.
        </p>

        <div className="flex flex-col gap-3.5">
          {/* Name row — cosmetic until a client-profile endpoint exists. */}
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="First name">
              <TextInput
                defaultValue="Sarah"
                wrapClassName="h-[46px]"
              />
            </Field>
            <Field label="Last name">
              <TextInput
                defaultValue="Mokoena"
                wrapClassName="h-[46px]"
              />
            </Field>
          </div>

          {/* Email — cosmetic until a client-profile endpoint exists. */}
          <Field label="Email" hint="Optional — for receipts and reminders.">
            <TextInput
              placeholder="sarah@example.com"
              icon="send"
              wrapClassName="h-[46px]"
            />
          </Field>

          {/* Reason — captured and forwarded as CreateBookingRequest.clientReason. */}
          <Field label="Reason for visit" hint="Optional — helps the consultant prepare.">
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Persistent cough for 5 days"
              className="w-full min-h-[78px] px-3 py-2.5 border border-line-2 rounded-[10px] bg-surface text-ink font-[inherit] text-[inherit] outline-none resize-y"
            />
          </Field>

          {/* SMS consent — cosmetic until a client-profile endpoint exists. */}
          <label className="flex items-start gap-2.5 px-3 py-2.5 bg-surface-2 border border-line rounded-[10px] text-[12.5px] text-ink-2 leading-relaxed cursor-pointer">
            <input type="checkbox" defaultChecked className="mt-0.5" />
            <span>I agree to receive SMS updates about my appointments at this number.</span>
          </label>
        </div>

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-[18px] h-[52px]"
          onClick={handleContinue}
          iconRight="arrowR"
        >
          Continue
        </Button>
      </div>
    </PhoneFrame>
  );
}
