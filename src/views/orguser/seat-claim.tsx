 
import { useEffect, useMemo, useState } from 'react';
import { Icon, Pill, Avatar, SkeletonBox, SkeletonLine } from '@/components/ui';
import { ProfileMenu, QFLogo } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useClientAuthStore } from '@/stores/clientAuthStore';
import { listDepartments } from '@/services/departmentApi';
import { listSeats } from '@/services/seatApi';
import {
  claimSeat,
  getMySeatAssignment,
  listActiveSessions,
} from '@/services/sessionApi';
import { getApiErrorMessage } from '@/lib/api-error';
import type {
  ActiveSessionResponse,
  DepartmentResponse,
  SeatResponse,
} from '@/types';

interface OrgUserClaimScreenProps {
  /** Called after a successful claim — route wrapper navigates to the live queue. */
  onClaim: (seatName: string) => void;
  /** Called when the user clicks "Sign out" from the profile menu. */
  onSignOut?: () => void;
}

interface ClaimTile {
  id: string;
  name: string;
  department: string;
  claimedBy: ActiveSessionResponse | null;
  isMine: boolean;
}

export function OrgUserClaimScreen({ onClaim, onSignOut }: OrgUserClaimScreenProps) {
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role);
  const orgName = useAuthStore((s) => s.organisationName);
  const orgMemberId = useAuthStore((s) => s.orgMemberId);
  const clearAuth = useAuthStore((s) => s.clear);
  const clearClientAuth = useClientAuthStore((s) => s.clear);

  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [sessions, setSessions] = useState<ActiveSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimingId, setClaimingId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        // If we already have an active shift, jump straight to the queue.
        const myAssignment = await getMySeatAssignment();
        if (cancelled) return;
        if (myAssignment.data && !myAssignment.data.endedAt) {
          // Find the seat name so the route wrapper can pass it to /queue if needed.
          onClaim('');
          return;
        }

        const [seatsRes, deptsRes, sessionsRes] = await Promise.all([
          listSeats(),
          listDepartments(),
          listActiveSessions(),
        ]);
        if (cancelled) return;
        setSeats([...seatsRes.data].sort((a, b) => a.displayOrder - b.displayOrder));
        setDepartments(deptsRes.data);
        setSessions(sessionsRes.data.sessions);
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load seats.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onClaim]);

  const deptName = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.id, d.name);
    return m;
  }, [departments]);

  const tiles: ClaimTile[] = useMemo(() => {
    const claimMap = new Map<string, ActiveSessionResponse>();
    for (const s of sessions) claimMap.set(s.seatId, s);
    return seats.map((s) => ({
      id: s.id,
      name: s.name,
      department: deptName.get(s.departmentId) ?? 'Department',
      claimedBy: claimMap.get(s.id) ?? null,
      isMine: claimMap.get(s.id)?.orgMemberId === orgMemberId,
    }));
  }, [seats, sessions, deptName, orgMemberId]);

  const handleClaim = async (tile: ClaimTile) => {
    if (tile.claimedBy && !tile.isMine) return;
    setError(null);
    setClaimingId(tile.id);
    try {
      await claimSeat(tile.id);
      onClaim(tile.name);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not claim that seat.'));
      setClaimingId(null);
    }
  };

  const handleSignOut = () => {
    clearAuth();
    clearClientAuth();
    onSignOut?.();
  };

  const greeting = greetingFor(new Date(), fullName);

  return (
    <div className="min-h-screen bg-bg flex flex-col">
      <header className="px-8 py-5 border-b border-line bg-surface flex items-center gap-4">
        <QFLogo size={18} />
        <span className="text-[12.5px] text-ink-3 truncate">{orgName ?? 'Your organisation'}</span>
        <span className="flex-1" />
        <div style={{ width: 220 }}>
          <ProfileMenu
            fullName={fullName ?? ''}
            email={email}
            role={role}
            items={[
              {
                id: 'logout',
                label: 'Sign out',
                icon: 'logout',
                tone: 'danger',
                onSelect: handleSignOut,
              },
            ]}
          />
        </div>
      </header>

      <main className="flex-1 flex justify-center px-8 py-12">
        <div className="w-full max-w-[880px]">
          <h1 className="m-0 mb-1.5 text-[26px] font-medium tracking-[-0.025em]">
            {greeting}
          </h1>
          <p className="m-0 mb-7 text-ink-3 text-[15px]">
            Claim a seat to start your shift. New booking requests will route to whichever seat you're in.
          </p>

          {error && (
            <div
              className="flex items-center gap-[10px] px-3.5 py-[10px] rounded-[10px] border mb-4"
              style={{
                background: 'var(--coral-tint)',
                borderColor: 'color-mix(in oklab, var(--coral) 30%, transparent)',
              }}
              role="alert"
            >
              <Icon name="alert" size={14} className="text-coral" />
              <span className="text-[12.5px]">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="border border-line rounded-[12px] p-4 bg-surface">
                  <div className="flex items-center gap-[10px]">
                    <SkeletonBox w={36} h={36} />
                    <div className="flex-1 min-w-0">
                      <SkeletonLine w="60%" h={13} />
                      <SkeletonLine w="40%" h={10} className="mt-1.5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <SkeletonLine w={90} h={11} />
                  </div>
                </div>
              ))}
            </div>
          ) : tiles.length === 0 ? (
            <div className="border border-line bg-surface rounded-[12px] p-8 text-center text-ink-3 text-[13.5px]">
              No seats configured yet. Ask your super user to add one.
            </div>
          ) : (
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))' }}>
              {tiles.map((tile) => {
                const taken = tile.claimedBy != null && !tile.isMine;
                const claiming = claimingId === tile.id;
                return (
                  <button
                    key={tile.id}
                    onClick={() => handleClaim(tile)}
                    disabled={taken || claiming}
                    className={cn(
                      'text-left border rounded-[12px] p-4 flex flex-col gap-[10px]',
                      'transition-[border-color,box-shadow,transform] duration-150',
                      taken
                        ? 'bg-surface-2 border-line cursor-not-allowed opacity-70'
                        : tile.isMine
                          ? 'bg-surface border-teal cursor-pointer hover:-translate-y-px'
                          : 'bg-surface border-line cursor-pointer shadow-sm hover:-translate-y-px',
                    )}
                    style={
                      tile.isMine && !taken
                        ? { boxShadow: '0 0 0 3px var(--teal-tint)' }
                        : undefined
                    }
                  >
                    <div className="flex items-center gap-[10px]">
                      <span
                        className={cn(
                          'w-9 h-9 rounded-lg inline-flex items-center justify-center flex-none',
                          tile.isMine ? 'bg-teal-tint text-teal-ink' : 'bg-surface-2 text-ink-3',
                        )}
                      >
                        <Icon name="chair" size={18} />
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[14px] font-medium truncate">{tile.name}</div>
                        <div className="text-[12px] text-ink-3 truncate">{tile.department}</div>
                      </div>
                      {tile.isMine && <Pill tone="teal">Yours</Pill>}
                    </div>

                    {taken ? (
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar name={tile.claimedBy!.memberName} size={22} active />
                        <span className="text-[12.5px] text-ink-3 truncate">
                          Claimed by {tile.claimedBy!.memberName}
                        </span>
                      </div>
                    ) : claiming ? (
                      <div className="text-[12.5px] text-ink-3">Claiming…</div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-teal-ink text-[12.5px] font-medium">
                        {tile.isMine ? 'Resume shift' : 'Claim seat'} <Icon name="arrowR" size={12} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function greetingFor(now: Date, fullName: string | null): string {
  const hour = now.getHours();
  const first = (fullName ?? '').split(' ')[0] || 'there';
  const period = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return `${period}, ${first}.`;
}
