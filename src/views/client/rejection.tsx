import { PhoneFrame } from '@/components/layout';
import { Icon, Button } from '@/components/ui';

interface ClientRejectionScreenProps {
  reason: string | null;
  onPickAnother: () => void;
  onCancel: () => void;
}

export function ClientRejectionScreen({ reason, onPickAnother, onCancel }: ClientRejectionScreenProps) {
  return (
    <PhoneFrame>
      <div className="px-5 pt-8 pb-8 text-center">
        <div className="mx-auto mb-[18px] w-[76px] h-[76px] rounded-full bg-surface-2 text-ink-3 flex items-center justify-center border border-line">
          <Icon name="info" size={28} stroke={1.5} />
        </div>

        <h1 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em] text-balance">
          That slot didn't work out
        </h1>
        <p className="m-0 mb-[22px] text-ink-3 text-[13.5px] leading-relaxed">
          We couldn't fit your request in at that time. There are still other openings today and tomorrow.
        </p>

        {reason && (
          <div className="mb-[22px] p-3.5 bg-surface-2 border border-line rounded-[12px] text-left">
            <div className="text-[11.5px] text-ink-3 mb-1.5">Reason from the team</div>
            <p className="m-0 text-[13px] text-ink-2 leading-relaxed italic">"{reason}"</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            variant="primary"
            size="lg"
            full
            className="h-[52px]"
            onClick={onPickAnother}
            iconRight="arrowR"
          >
            Pick a different slot
          </Button>
          <Button variant="ghost" full onClick={onCancel}>
            I'll come back later
          </Button>
        </div>
      </div>
    </PhoneFrame>
  );
}
