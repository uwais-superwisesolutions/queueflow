import { PhoneFrame } from '@/components/layout';
import { Icon, Button, Avatar } from '@/components/ui';

interface ClientRejectionScreenProps {
  onPickAnother: () => void;
  onCancel: () => void;
}

export function ClientRejectionScreen({ onPickAnother, onCancel }: ClientRejectionScreenProps) {
  return (
    <PhoneFrame>
      <div className="px-5 pt-8 pb-8 text-center">
        {/* Info icon circle */}
        <div className="mx-auto mb-[18px] w-[76px] h-[76px] rounded-full bg-surface-2 text-ink-3 flex items-center justify-center border border-line">
          <Icon name="info" size={28} stroke={1.5} />
        </div>

        <h1 className="m-0 mb-2 text-[22px] font-medium tracking-[-0.02em] text-balance">
          That slot didn't work out
        </h1>
        <p className="m-0 mb-[22px] text-ink-3 text-[13.5px] leading-relaxed">
          Dr. Okonkwo couldn't fit you in at 15:00. There are still plenty of other times today and tomorrow.
        </p>

        {/* Doctor's note */}
        <div className="mb-[22px] p-3.5 bg-surface-2 border border-line rounded-[12px] text-left">
          <div className="flex items-center gap-2 mb-2">
            <Avatar name="Amara Okonkwo" size={26} />
            <div>
              <div className="text-[12.5px] font-medium">Dr. Amara Okonkwo</div>
              <div className="text-[11px] text-ink-3">10:14, today</div>
            </div>
          </div>
          <p className="m-0 text-[13px] text-ink-2 leading-relaxed italic">
            "Sorry Sarah — I'm fully booked this afternoon. I have openings tomorrow
            morning from 09:00 that should work better for an unhurried consult."
          </p>
        </div>

        {/* CTAs */}
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

        {/* Alternative suggestion */}
        <div className="mt-[22px] p-3 bg-teal-tint rounded-[10px] flex items-center gap-2.5">
          <Icon name="sparkles" size={14} className="text-teal-ink" />
          <span className="text-[12px] text-teal-ink text-left">
            Dr. Dlamini has openings <b>at 14:55, 15:30 and 16:00</b> if you can't wait.
          </span>
        </div>
      </div>
    </PhoneFrame>
  );
}
