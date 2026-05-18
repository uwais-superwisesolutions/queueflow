import { Icon, Pill, Avatar } from '@/components/ui';
import { QFLogo } from '@/components/layout';
import { cn } from '@/lib/utils';

interface ClaimSeat {
  id: number;
  name: string;
  dept: string;
  claimedBy: string | null;
  mine?: boolean;
}

const CLAIM_SEATS: ClaimSeat[] = [
  { id: 1, name: 'Consultation room 1', dept: 'General Practice', claimedBy: null, mine: true },
  { id: 2, name: 'Consultation room 2', dept: 'General Practice', claimedBy: 'Sipho Dlamini' },
  { id: 3, name: 'Consultation room 3', dept: 'General Practice', claimedBy: null },
  { id: 4, name: 'Dental chair A',      dept: 'Dental',           claimedBy: 'Naledi Brown' },
  { id: 5, name: 'Triage desk',         dept: 'General Practice', claimedBy: null },
  { id: 6, name: 'Peds room',           dept: 'Paediatrics',      claimedBy: null },
];

interface OrgUserClaimScreenProps {
  onClaim: (seatName: string) => void;
}

export function OrgUserClaimScreen({ onClaim }: OrgUserClaimScreenProps) {
  return (
    <div className="min-h-screen bg-bg flex flex-col">
      {/* Header */}
      <header className="px-8 py-5 border-b border-line bg-surface flex items-center gap-4">
        <QFLogo size={18} />
        <span className="text-[12.5px] text-ink-3">Bryanston Family Practice</span>
        <span className="flex-1" />
        <div className="flex items-center gap-[10px]">
          <Avatar name="Amara Okonkwo" size={26} />
          <div className="text-right">
            <div className="text-[12.5px] font-medium">Dr. Amara Okonkwo</div>
            <div className="text-[11px] text-ink-3">Org user · Doctor</div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex justify-center px-8 py-12">
        <div className="w-full max-w-[880px]">
          <h1 className="m-0 mb-1.5 text-[26px] font-medium tracking-[-0.025em]">
            Good morning, Amara.
          </h1>
          <p className="m-0 mb-7 text-ink-3 text-[15px]">
            Claim a seat to start your shift. New booking requests will route to whichever seat you're in.
          </p>

          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
            {CLAIM_SEATS.map((s) => {
              const taken = !!s.claimedBy;
              return (
                <button
                  key={s.id}
                  onClick={() => !taken && onClaim(s.name)}
                  disabled={taken}
                  className={cn(
                    'text-left border rounded-[12px] p-4 flex flex-col gap-[10px]',
                    'transition-[border-color,box-shadow,transform] duration-150',
                    taken
                      ? 'bg-surface-2 border-line cursor-not-allowed opacity-70'
                      : s.mine
                        ? 'bg-surface border-teal cursor-pointer hover:-translate-y-px'
                        : 'bg-surface border-line cursor-pointer shadow-sm hover:-translate-y-px',
                  )}
                  style={s.mine && !taken ? { boxShadow: '0 0 0 3px var(--teal-tint)' } : undefined}
                >
                  {/* Top row: icon + name + optional pill */}
                  <div className="flex items-center gap-[10px]">
                    <span
                      className={cn(
                        'w-9 h-9 rounded-lg inline-flex items-center justify-center flex-none',
                        s.mine ? 'bg-teal-tint text-teal-ink' : 'bg-surface-2 text-ink-3',
                      )}
                    >
                      <Icon name="chair" size={18} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-medium">{s.name}</div>
                      <div className="text-[12px] text-ink-3">{s.dept}</div>
                    </div>
                    {s.mine && <Pill tone="teal">Default</Pill>}
                  </div>

                  {/* Bottom row: claimed-by or CTA */}
                  {taken ? (
                    <div className="flex items-center gap-2">
                      <Avatar name={s.claimedBy!} size={22} active />
                      <span className="text-[12.5px] text-ink-3">Claimed by {s.claimedBy}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 text-teal-ink text-[12.5px] font-medium">
                      Claim seat <Icon name="arrowR" size={12} />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
