import { useState, useEffect, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon, Button, Card, Pill, Avatar, Kpi, QRPlaceholder } from '@/components/ui';
import { ProfileMenu, Sidebar, TopBar } from '@/components/layout';
import { agoLabel } from '@/lib/time';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';
import { useClientAuthStore } from '@/stores/clientAuthStore';
import type { SidebarNavItem } from '@/types';
import { OrgUsersView } from './org-users';
import { SeatsView } from './seats';
import { TimeslotsView } from './timeslot-types';
import { SettingsView } from './settings';
import { ClientLinksView, AnalyticsView } from './management';

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

interface DashSeat {
  id: number;
  name: string;
  dept: string;
  user: string | null;
  role: string | null;
  active: boolean;
  queue: number;
  serving: string | null;
  alert?: boolean;
  idle?: boolean;
}

const DASH_SEATS: DashSeat[] = [
  { id: 1, name: 'Consultation room 1', dept: 'General Practice', user: 'Amara Okonkwo',  role: 'Doctor',  active: true,  queue: 5, serving: 'Sarah Mokoena' },
  { id: 2, name: 'Consultation room 2', dept: 'General Practice', user: 'Sipho Dlamini',  role: 'Doctor',  active: true,  queue: 3, serving: 'Jabu Khumalo' },
  { id: 3, name: 'Consultation room 3', dept: 'General Practice', user: null,             role: null,      active: false, queue: 4, serving: null, alert: true },
  { id: 4, name: 'Dental chair A',      dept: 'Dental',           user: 'Naledi Brown',   role: 'Dentist', active: true,  queue: 2, serving: 'Michael v.d. Berg' },
  { id: 5, name: 'Dental chair B',      dept: 'Dental',           user: 'Khaya Mthembu',  role: 'Dentist', active: true,  queue: 1, serving: null, idle: true },
  { id: 6, name: 'Peds room',           dept: 'Pediatrics',       user: null,             role: null,      active: false, queue: 0, serving: null },
  { id: 7, name: 'Triage desk',         dept: 'General Practice', user: 'Lerato Smith',   role: 'Nurse',   active: true,  queue: 8, serving: 'Anwar Pillay' },
];

interface FeedItem {
  t: number;
  text: ReactNode;
  kind: 'service' | 'request' | 'alert' | 'complete' | 'session';
}

const FEED: FeedItem[] = [
  { t: 12,  text: <>Dr. Okonkwo started serving <b>Sarah Mokoena</b></>,            kind: 'service' },
  { t: 73,  text: <>New booking request for <b>Chair A</b> at 15:10</>,             kind: 'request' },
  { t: 142, text: <>Triage queue passed 8 — consider adding a seat</>,              kind: 'alert' },
  { t: 220, text: <>Dr. Dlamini completed appointment with <b>Beth Cele</b></>,     kind: 'complete' },
  { t: 360, text: <>Sipho Dlamini claimed <b>Consultation room 2</b></>,            kind: 'session' },
  { t: 480, text: <>Delay alert sent to <b>3 clients</b> in Room 1's queue</>,      kind: 'alert' },
  { t: 720, text: <>Khaya Mthembu started shift at <b>Dental chair B</b></>,        kind: 'session' },
];

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
      style={{ height: 'calc(100vh - 48px)' }}
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
        {active === 'links'     && <ClientLinksView onOpenClientPortal={onOpenClientPortal} />}
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
  return (
    <>
      <TopBar
        title="Dashboard"
        subtitle="Tuesday, 18 May"
        right={
          <div className="flex gap-2 items-center">
            <span className="flex items-center gap-1.5 text-[12px] text-ink-3">
              <span className="qf-live-dot" />
              Live
            </span>
            <Button variant="ghost" icon="bell" />
            <Button variant="secondary" icon="filter">Filter</Button>
            <Button variant="primary" icon="link" onClick={() => setActive('links')}>
              Get join link
            </Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto qf-scroll" style={{ padding: '20px 24px 40px' }}>
        <div
          className="grid items-start gap-5"
          style={{ gridTemplateColumns: '1fr 320px' }}
        >
          <div className="flex flex-col gap-5">
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
              <Kpi label="Active sessions"  value="4"  sub="/ 7 seats"         hint="now" />
              <Kpi label="In queue now"     value="23" sub="across all seats"   hint="now" />
              <Kpi label="Avg wait today"   value="24" sub="min"               hint="rolling" />
              <Kpi label="Bookings today"   value="87" sub="of 120 capacity"   hint="so far" />
            </div>

            <section>
              <div className="flex items-center mb-2.5 gap-2.5">
                <h2 className="m-0 text-[14px] font-semibold" style={{ letterSpacing: '-0.005em' }}>
                  Active seats
                </h2>
                <Pill tone="teal" dot>Live</Pill>
                <span className="flex-1" />
                <Button variant="ghost" size="sm" icon="grid">Grid</Button>
                <Button variant="ghost" size="sm" icon="list">List</Button>
              </div>
              <div
                className="grid gap-3"
                style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}
              >
                {DASH_SEATS.map(s => <SeatCard key={s.id} seat={s} />)}
              </div>
            </section>
          </div>

          <aside className="flex flex-col gap-3.5" style={{ position: 'sticky', top: 20 }}>
            <Card padding={0}>
              <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
                <span className="qf-live-dot" />
                <span className="text-[12.5px] font-medium">Activity</span>
                <span className="ml-auto text-[11.5px] text-ink-3">Updated just now</span>
              </div>
              <div className="overflow-auto qf-scroll" style={{ maxHeight: 480 }}>
                {FEED.map((f, i) => (
                  <div
                    key={i}
                    className={cn(
                      'px-4 py-2.5 flex gap-2.5',
                      i < FEED.length - 1 && 'border-b border-line',
                    )}
                  >
                    <FeedKindIcon kind={f.kind} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[12.5px] text-ink-2 leading-[1.45]">{f.text}</div>
                      <div className="text-[11px] text-ink-4 mt-0.5">
                        {agoLabel((f.t + now) * 1000)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card padding={16}>
              <div className="flex items-center gap-2.5 mb-2.5">
                <Icon name="qr" size={16} className="text-ink-3" />
                <span className="text-[12.5px] font-medium">Main entrance QR</span>
              </div>
              <div className="flex gap-3 items-center">
                <QRPlaceholder size={84} seed="qf-main" />
                <div>
                  <div
                    className="mono text-[11.5px] text-ink-2 mb-1.5"
                    style={{ lineHeight: 1.4 }}
                  >
                    queueflow.io/q/bryanston-family-practice
                  </div>
                  <Button variant="ghost" size="sm" icon="copy">Copy link</Button>
                </div>
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

function SeatCard({ seat }: { seat: DashSeat }) {
  const unmanned = !seat.active && seat.queue > 0;
  const idle = seat.active && !seat.serving && seat.queue <= 1;

  return (
    <div
      className="bg-surface rounded-xl p-3.5 relative transition-[border-color,box-shadow] duration-150"
      style={{
        border: `1px solid ${unmanned ? 'var(--coral)' : 'var(--line)'}`,
        boxShadow: unmanned
          ? '0 0 0 4px var(--coral-tint), var(--shadow-sm)'
          : 'var(--shadow-sm)',
      }}
    >
      {unmanned && (
        <Pill
          tone="coral"
          icon="alert"
          className="absolute top-2.5 right-2.5"
        >
          Unmanned
        </Pill>
      )}

      <div className="flex items-center gap-2.5">
        <span
          className="inline-flex items-center justify-center bg-surface-2 text-ink-3 rounded-[8px] flex-none"
          style={{ width: 30, height: 30 }}
        >
          <Icon name="chair" size={14} />
        </span>
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-medium">{seat.name}</div>
          <div className="text-[11.5px] text-ink-3">{seat.dept}</div>
        </div>
      </div>

      <div className="mt-3 p-3 bg-surface-2 border border-line rounded-[8px] flex items-center gap-2.5">
        {seat.user ? (
          <>
            <Avatar name={seat.user} size={26} active={seat.active} />
            <div className="flex-1 min-w-0">
              <div className="text-[12.5px] font-medium">{seat.user}</div>
              <div className="text-[11px] text-ink-3">
                {seat.role} · {seat.active ? 'On shift' : 'Off'}
              </div>
            </div>
            {seat.active && <span className="qf-live-dot" />}
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

      <div className="grid gap-2.5 mt-2.5" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div>
          <div
            className="text-[10.5px] text-ink-4 font-semibold uppercase"
            style={{ letterSpacing: '0.05em' }}
          >
            In queue
          </div>
          <div
            className={cn('tnum text-[18px] font-medium mt-0.5', seat.queue > 5 ? 'text-coral-2' : 'text-ink')}
          >
            {seat.queue}
          </div>
        </div>
        <div className="min-w-0">
          <div
            className="text-[10.5px] text-ink-4 font-semibold uppercase"
            style={{ letterSpacing: '0.05em' }}
          >
            Now serving
          </div>
          <div
            className={cn(
              'text-[13px] font-medium mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap',
              seat.serving ? 'text-ink' : 'text-ink-4',
            )}
          >
            {seat.serving || (idle ? 'Waiting…' : '—')}
          </div>
        </div>
      </div>
    </div>
  );
}
