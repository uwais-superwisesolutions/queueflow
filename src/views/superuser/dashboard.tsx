 
import { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, Button, Card, Pill, Avatar, Kpi, SkeletonBox, SkeletonLine } from '@/components/ui';
import { ProfileMenu, Sidebar, TopBar } from '@/components/layout';
import { agoLabel } from '@/lib/time';
import { cn } from '@/lib/utils';
import { usePolling } from '@/hooks/use-polling';
import { POLL_INTERVAL_MS } from '@/lib/realtime-channels';
import { useAuthStore } from '@/stores/authStore';
import { useClientAuthStore } from '@/stores/clientAuthStore';
import { getApiErrorMessage } from '@/lib/api-error';
import { listDepartments } from '@/services/departmentApi';
import { listSeats } from '@/services/seatApi';
import { listActiveSessions } from '@/services/sessionApi';
import type {
  ActiveSessionResponse,
  DepartmentResponse,
  SeatResponse,
  SidebarNavItem,
} from '@/types';
import { OrgUsersView } from './org-users';
import { SeatsView } from './seats';
import { TimeslotsView } from './timeslot-types';
import { SettingsView } from './settings';
import { PortalLinksView } from './portal-links';
import { AnalyticsView } from './management';

const SU_NAV: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard',           icon: 'grid' },
  { id: 'queues',    label: 'Queues',              icon: 'users', count: 23 },
  { id: 'orgusers',  label: 'Org users',           icon: 'users' },
  { id: 'seats',     label: 'Seats & departments', icon: 'chair' },
  { id: 'timeslots', label: 'Timeslot types',      icon: 'clock' },
  { id: 'links',     label: 'Client portal links', icon: 'link' },
  { id: 'analytics', label: 'Analytics',           icon: 'zap' },
  { heading: 'Workspace' },
  { id: 'settings',  label: 'Settings',            icon: 'settings' },
  { id: 'billing',   label: 'Billing',             icon: 'shield' },
];

const NAV_PATHS: Record<string, string> = {
  dashboard: '/dashboard',
  queues:    '/dashboard/queues',
  orgusers:  '/dashboard/users',
  seats:     '/dashboard/seats',
  timeslots: '/dashboard/timeslots',
  links:     '/dashboard/links',
  analytics: '/dashboard/analytics',
  settings:  '/dashboard/settings',
  billing:   '/dashboard/billing',
};

const PATH_TO_NAV: Record<string, string> = Object.fromEntries(
  Object.entries(NAV_PATHS).map(([id, path]) => [path, id]),
);

/** Derived seat tile combining a SeatResponse + (maybe) the org_member currently assigned to it. */
interface SeatTile {
  id: string;
  name: string;
  department: string;
  session: ActiveSessionResponse | null;
}


interface SuperUserDashboardProps {
  onLogout?: () => void;
  onPersona?: (persona: string) => void;
  onOpenClientPortal?: () => void;
  initialPage?: string;
}

export function SuperUserDashboard({
  onPersona,
  onOpenClientPortal,
  initialPage = 'dashboard',
}: SuperUserDashboardProps) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const active = PATH_TO_NAV[pathname] ?? initialPage;
  const fullName = useAuthStore((s) => s.fullName);
  const email = useAuthStore((s) => s.email);
  const role = useAuthStore((s) => s.role);
  const organisationName = useAuthStore((s) => s.organisationName);
  const clearAuth = useAuthStore((s) => s.clear);
  const clearClientAuth = useClientAuthStore((s) => s.clear);

  const handleLogout = () => {
    clearAuth();
    clearClientAuth();
    navigate('/login', { replace: true });
  };
  const setActive = (id: string) => {
    const path = NAV_PATHS[id];
    if (path) navigate(path);
  };
  const [now, setNow] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(n => n + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: '100vh' }}
    >
      <Sidebar
        items={SU_NAV}
        active={active}
        onSelect={setActive}
        orgName={organisationName ?? undefined}
        footer={
          <ProfileMenu
            fullName={fullName ?? ''}
            email={email}
            role={role}
            items={[
              ...(role === 'super_user'
                ? [
                    {
                      id: 'persona',
                      label: 'Switch to org user view',
                      icon: 'refresh' as const,
                       onSelect: () => onPersona?.('orguser-claim'),
                    },
                  ]
                : []),
              {
                id: 'logout',
                label: 'Sign out',
                icon: 'logout' as const,
                tone: 'danger' as const,
                onSelect: handleLogout,
              },
            ]}
          />
        }
      />

      <main className="flex-1 min-w-0 flex flex-col bg-bg overflow-hidden">
        {active === 'dashboard' && <DashboardBody now={now} setActive={setActive} />}
        {active === 'orgusers'  && <OrgUsersView />}
        {active === 'seats'     && <SeatsView />}
        {active === 'timeslots' && <TimeslotsView />}
        {active === 'links'     && <PortalLinksView onOpenClientPortal={onOpenClientPortal} />}
        {active === 'analytics' && <AnalyticsView />}
        {active === 'queues'    && <QueuesPlaceholder />}
        {active === 'settings'  && <SettingsView />}
        {active === 'billing'   && <BillingPlaceholder />}
      </main>
    </div>
  );
}

function QueuesPlaceholder() {
  return (
    <>
      <TopBar title="Queues" subtitle="All live queues across your org." />
      <div className="flex-1 overflow-auto p-6 qf-scroll">
        <Card style={{ padding: 32, textAlign: 'center' }} className="text-ink-3">
          Org-wide queues view — see the per-seat tiles on the Dashboard.
        </Card>
      </div>
    </>
  );
}

function BillingPlaceholder() {
  return (
    <>
      <TopBar title="Billing" subtitle="Plan and seat usage." />
      <div className="flex-1 overflow-auto p-6 qf-scroll">
        <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr', maxWidth: 800 }}>
          <Card padding={20}>
            <Pill tone="teal">Trial</Pill>
            <h3 className="text-[22px] font-medium mt-2.5 mb-1">9 days left</h3>
            <p className="m-0 text-ink-3 text-[13px]">
              Add a card to keep your team running after 27 May.
            </p>
            <Button variant="primary" className="mt-3.5">Add payment method</Button>
          </Card>
          <Card padding={20}>
            <div className="text-[12px] text-ink-3">Estimated monthly</div>
            <div className="tnum text-[28px] font-medium mt-1">R 2,940</div>
            <p className="text-[12px] text-ink-3 mt-1 mb-3.5">6 seats × R 490 / month</p>
            <Button variant="secondary" icon="link">Manage subscription</Button>
          </Card>
        </div>
      </div>
    </>
  );
}

interface DashboardBodyProps {
  now: number;
  setActive: (id: string) => void;
}

function DashboardBody({ now, setActive }: DashboardBodyProps) {
  const [seats, setSeats] = useState<SeatResponse[]>([]);
  const [departments, setDepartments] = useState<DepartmentResponse[]>([]);
  const [sessions, setSessions] = useState<ActiveSessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<number>(Date.now());

  const refreshSessions = async () => {
    try {
      const resp = await listActiveSessions();
      setSessions(resp.data.sessions);
      setUpdatedAt(Date.now());
    } catch {
      // best-effort poll; keep previous data on transient errors
    }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [seatsRes, deptsRes, sessionsRes] = await Promise.all([
          listSeats(),
          listDepartments(),
          listActiveSessions(),
        ]);
        if (cancelled) return;
        setSeats([...seatsRes.data].sort((a, b) => a.displayOrder - b.displayOrder));
        setDepartments(deptsRes.data);
        setSessions(sessionsRes.data.sessions);
        setUpdatedAt(Date.now());
      } catch (err) {
        if (!cancelled) setError(getApiErrorMessage(err, 'Could not load dashboard.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Stand-in for the `org:{orgId}:dashboard` Supabase Realtime channel — see
  // REALTIME_CHANNELS.md §3. Phase 1: poll /secure/sessions/active.
  usePolling(refreshSessions, POLL_INTERVAL_MS.orgDashboard);

  const sessionsBySeat = useMemo(() => {
    const m = new Map<string, ActiveSessionResponse>();
    for (const s of sessions) m.set(s.seatId, s);
    return m;
  }, [sessions]);

  const deptNameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const d of departments) m.set(d.id, d.name);
    return m;
  }, [departments]);

  const tiles: SeatTile[] = useMemo(
    () =>
      seats.map((s) => ({
        id: s.id,
        name: s.name,
        department: deptNameById.get(s.departmentId) ?? 'Department',
        session: sessionsBySeat.get(s.id) ?? null,
      })),
    [seats, sessionsBySeat, deptNameById],
  );

  const activeCount = sessions.length;
  const totalSeats = seats.length;
  const subtitle = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle={subtitle}
        right={
          <div className="flex gap-2 items-center">
            <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
              <span className="qf-live-dot" />
              Live
            </span>
            <Button variant="ghost" icon="refresh" onClick={refreshSessions}>Refresh</Button>
            <Button variant="primary" icon="link" onClick={() => setActive('links')}>
              Get join link
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '20px 24px 40px' }}>
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

        <div className="grid items-start gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
          <div className="flex flex-col gap-5">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} padding={14}>
                    <SkeletonLine w={84} h={11} />
                    <SkeletonLine w={48} h={24} className="mt-2" />
                    <SkeletonLine w={64} h={10} className="mt-2" />
                  </Card>
                ))
              ) : (
                <>
                  <Kpi
                    label="Active sessions"
                    value={String(activeCount)}
                    sub={`/ ${totalSeats} seats`}
                    hint="now"
                    tone={activeCount === 0 ? 'neutral' : 'teal'}
                  />
                  <Kpi label="In queue now" value="—" sub="across all seats" hint="not wired" />
                  <Kpi label="Avg wait today" value="—" sub="min" hint="not wired" />
                  <Kpi label="Bookings today" value="—" sub="not wired" hint="" />
                </>
              )}
            </div>

            <section>
              <div className="flex items-center mb-2.5 gap-2.5">
                <h2 className="m-0 text-[14px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
                  Active seats
                </h2>
                <Pill tone="teal" dot>
                  Live
                </Pill>
                <span className="flex-1" />
                <span className="text-[11.5px] text-ink-3">
                  Updated {agoLabel(updatedAt)}
                </span>
              </div>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
              >
                {loading ? (
                  Array.from({ length: 6 }).map((_, i) => <SeatCardSkeleton key={i} />)
                ) : tiles.length === 0 ? (
                  <Card padding={20} className="col-span-full">
                    <div className="text-[13px] text-ink-3 text-center">
                      No seats yet. Head to{' '}
                      <button
                        className="text-teal-ink underline bg-transparent border-0 cursor-pointer p-0 font-medium"
                        onClick={() => setActive('seats')}
                      >
                        Seats &amp; departments
                      </button>{' '}
                      to add some.
                    </div>
                  </Card>
                ) : (
                  tiles.map((t) => <SeatCard key={t.id} tile={t} />)
                )}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-3.5" style={{ position: 'sticky', top: 20 }}>
            <Card padding={0}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
                <span className="qf-live-dot" />
                <span className="text-[12.5px] font-medium">Activity</span>
                <span className="ml-auto text-[11.5px] text-ink-3">
                  {sessions.length === 0 ? 'No sessions' : `${sessions.length} live`}
                </span>
              </div>
              <div className="overflow-auto qf-scroll" style={{ maxHeight: 480 }}>
                {sessions.length === 0 ? (
                  <div className="px-4 py-6 text-center text-[12.5px] text-ink-3">
                    No active sessions yet. Org users will appear here when they claim a seat.
                  </div>
                ) : (
                  sessions.map((s, i) => (
                    <div
                      key={s.assignmentId}
                      className={cn(
                        'px-4 py-2.5 flex gap-2.5',
                        i < sessions.length - 1 && 'border-b border-line',
                      )}
                    >
                      <FeedKindIcon kind="session" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[12.5px] text-ink-2 leading-[1.45]">
                          <b>{s.memberName}</b> on shift at <b>{s.seatName}</b>
                        </div>
                        <div className="text-[11px] text-ink-4 mt-0.5">
                          Started {agoLabel(new Date(s.startedAt).getTime())}
                          {' · '}
                          last seen {agoLabel(new Date(s.lastSeenAt).getTime() + now * 0)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}

type FeedKind = 'service' | 'request' | 'alert' | 'complete' | 'session';

const FEED_KIND_MAP: Record<FeedKind, { ic: string; bg: string; fg: string }> = {
  service:  { ic: 'user',  bg: 'var(--blue-tint)',    fg: 'var(--blue)' },
  request:  { ic: 'bell',  bg: 'var(--amber-tint)',   fg: 'var(--amber)' },
  alert:    { ic: 'alert', bg: 'var(--coral-tint)',   fg: 'var(--coral-2)' },
  complete: { ic: 'check', bg: 'var(--success-tint)', fg: 'var(--success)' },
  session:  { ic: 'chair', bg: 'var(--teal-tint)',    fg: 'var(--teal-ink)' },
};

function FeedKindIcon({ kind }: { kind: FeedKind }) {
  const m = FEED_KIND_MAP[kind] ?? FEED_KIND_MAP.session;
  return (
    <span
      className="inline-flex items-center justify-center rounded-[6px] flex-none"
      style={{ width: 22, height: 22, background: m.bg, color: m.fg }}
    >
      <Icon name={m.ic as Parameters<typeof Icon>[0]['name']} size={12} />
    </span>
  );
}

function SeatCard({ tile }: { tile: SeatTile }) {
  const session = tile.session;
  return (
    <div
      className="bg-surface rounded-xl p-3.5 relative transition-[border-color,box-shadow] duration-150"
      style={{ border: '1px solid var(--line)', boxShadow: 'var(--shadow-sm)' }}
    >
      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex items-center justify-center bg-surface-2 text-ink-3 rounded-[8px] flex-none"
          style={{ width: 30, height: 30 }}
        >
          <Icon name="chair" size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-medium truncate">{tile.name}</div>
          <div className="text-[11.5px] text-ink-3 truncate">{tile.department}</div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-surface-2 border border-line rounded-[8px] flex items-center gap-2.5">
        {session ? (
          <>
            <Avatar name={session.memberName} size={26} active />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium truncate">{session.memberName}</div>
              <div className="text-[11px] text-ink-3">
                Started {agoLabel(new Date(session.startedAt).getTime())}
              </div>
            </div>
            <span className="qf-live-dot" />
          </>
        ) : (
          <>
            <span
              className="inline-flex items-center justify-center rounded-full text-ink-4 flex-none"
              style={{
                width: 26,
                height: 26,
                border: '1.5px dashed var(--line-2)',
              }}
            >
              <Icon name="user" size={13} />
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium text-ink-3">Unclaimed</div>
              <div className="text-[11px] text-ink-4">Available to claim</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SeatCardSkeleton() {
  return (
    <div
      className="bg-surface rounded-xl p-3.5"
      style={{ border: '1px solid var(--line)' }}
    >
      <div className="flex items-center gap-2.5">
        <SkeletonBox w={30} h={30} />
        <div className="flex-1 min-w-0">
          <SkeletonLine w="60%" h={12} />
          <SkeletonLine w="40%" h={10} className="mt-1.5" />
        </div>
      </div>
      <div className="mt-3 p-3 bg-surface-2 border border-line rounded-[8px] flex items-center gap-2.5">
        <SkeletonBox w={26} h={26} circle />
        <div className="flex-1">
          <SkeletonLine w="70%" h={11} />
          <SkeletonLine w="50%" h={10} className="mt-1.5" />
        </div>
      </div>
    </div>
  );
}
