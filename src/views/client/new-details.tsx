import { useState } from 'react';
import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Field, TextInput } from '@/components/ui';
import { updateClientMe } from '@/services/clientApi';
import { getApiErrorMessage } from '@/lib/api-error';

export interface NewDetailsResult {
  /** Trimmed reason for visit, or null when empty. Forwarded to the booking-create payload. */
  clientReason: string | null;
}

interface ClientNewDetailsScreenProps {
  onContinue: (result: NewDetailsResult) => void;
  onBack: () => void;
}

// First name / last name / email are persisted via PATCH /api/client/me on
// Continue. SMS consent is cosmetic — there's no backend column for it yet.
// Reason-for-visit is persisted via CreateBookingRequest.clientReason on the
// next screen.
export function ClientNewDetailsScreen({ onContinue, onBack }: ClientNewDetailsScreenProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [reason, setReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleContinue = async () => {
    setError(null);

    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();
    const trimmedEmail = email.trim();
    const trimmedReason = reason.trim();

    if (trimmedEmail.length > 0 && !trimmedEmail.includes('@')) {
      setError('Email is not valid.');
      return;
    }

    setSaving(true);
    try {
      // Only PATCH when the user actually filled something in. New clients
      // arrive with empty fields, so an all-empty submit shouldn't fire a
      // request.
      if (trimmedFirst || trimmedLast || trimmedEmail) {
        await updateClientMe({
          firstName: trimmedFirst || null,
          lastName: trimmedLast || null,
          email: trimmedEmail || null,
        });
      }
      onContinue({ clientReason: trimmedReason.length > 0 ? trimmedReason : null });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not save your details.'));
    } finally {
      setSaving(false);
    }
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
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="First name">
              <TextInput
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
                wrapClassName="h-[46px]"
              />
            </Field>
            <Field label="Last name">
              <TextInput
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
                wrapClassName="h-[46px]"
              />
            </Field>
          </div>

          <Field label="Email" hint="Optional — for receipts and reminders.">
            <TextInput
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="sarah@example.com"
              icon="send"
              type="email"
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

          {/* SMS consent — cosmetic. No backend column yet; a schema migration
              would be needed before this can be persisted. */}
          <label className="flex items-start gap-2.5 px-3 py-2.5 bg-surface-2 border border-line rounded-[10px] text-[12.5px] text-ink-2 leading-relaxed cursor-pointer">
            <input type="checkbox" defaultChecked className="mt-0.5" />
            <span>I agree to receive SMS updates about my appointments at this number.</span>
          </label>

          {error && (
            <div className="text-[12.5px] text-coral" role="alert">
              <Icon name="alert" size={12} /> {error}
            </div>
          )}
        </div>

        <Button
          variant="primary"
          size="lg"
          full
          className="mt-[18px] h-[52px]"
          onClick={handleContinue}
          iconRight="arrowR"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Continue'}
        </Button>
      </div>
    </PhoneFrame>
  );
}
