import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Field, TextInput } from '@/components/ui';

interface ClientNewDetailsScreenProps {
  onContinue: () => void;
  onBack: () => void;
}

export function ClientNewDetailsScreen({ onContinue, onBack }: ClientNewDetailsScreenProps) {
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
          {/* Name row */}
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

          {/* Email */}
          <Field label="Email" hint="Optional — for receipts and reminders.">
            <TextInput
              placeholder="sarah@example.com"
              icon="send"
              wrapClassName="h-[46px]"
            />
          </Field>

          {/* Reason */}
          <Field label="Reason for visit" hint="Optional — helps the consultant prepare.">
            <textarea
              placeholder="e.g. Persistent cough for 5 days"
              className="w-full min-h-[78px] px-3 py-2.5 border border-line-2 rounded-[10px] bg-surface text-ink font-[inherit] text-[inherit] outline-none resize-y"
            />
          </Field>

          {/* SMS consent */}
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
          onClick={onContinue}
          iconRight="arrowR"
        >
          Continue
        </Button>
      </div>
    </PhoneFrame>
  );
}
