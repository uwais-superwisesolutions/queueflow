// src/views/superuser/management.tsx
// Holds the dashboard pages that don't yet have backend APIs:
//   - ClientLinksView  (M7 — pending)
//   - AnalyticsView    (M9+ — pending)
//
// API-backed pages live in their own files:
//   - OrgUsersView   → ./org-users.tsx
//   - SeatsView      → ./seats.tsx
//   - TimeslotsView  → ./timeslot-types.tsx
//   - SettingsView   → ./settings.tsx

import { useState } from 'react';
import {
  Button,
  Card,
  Field,
  Kpi,
  Modal,
  Pill,
  QRCode,
  SelectInput,
  TextInput,
} from '@/components/ui';
import { TopBar } from '@/components/layout';
import { cn } from '@/lib/utils';
import { useCopy } from '@/hooks/use-copy';
import { DataGrid, type DataGridColumn, type DataGridRow } from './shared';

/* ─────────────────────────────────────────────────
   Mock data (M7/M9 not implemented backend-side)
───────────────────────────────────────────────── */

interface PortalLink {
  id: number;
  name: string;
  url: string;
  scope: string;
  created: string;
  scans: number;
}

const LINKS: PortalLink[] = [
  { id: 1, name: 'Main entrance QR',         url: 'queueflow.io/q/bryanstonfp',             scope: 'Whole org',               created: '12 Feb 2026', scans: 1842 },
  { id: 2, name: 'Reception desk handout',   url: 'queueflow.io/q/bryanstonfp?l=reception', scope: 'Whole org',               created: '14 Feb 2026', scans: 612 },
  { id: 3, name: 'Dental waiting area',      url: 'queueflow.io/q/bryanstonfp/dental',      scope: 'Department · Dental',     created: '03 Mar 2026', scans: 287 },
  { id: 4, name: 'Triage walk-in poster',    url: 'queueflow.io/q/bryanstonfp/triage',      scope: 'Seat · Triage desk',      created: '21 Apr 2026', scans: 96 },
  { id: 5, name: 'Pediatrics referral card', url: 'queueflow.io/q/bryanstonfp/peds',        scope: 'Department · Pediatrics', created: '08 May 2026', scans: 11 },
];

const BOOKINGS_30D: number[] = [62, 71, 68, 84, 78, 92, 88, 74, 80, 96, 102, 89, 95, 100, 87, 84, 110, 105, 98, 112, 108, 99, 116, 121, 104, 95, 108, 102, 118, 87];

const WAIT_BY_DEPT = [
  { name: 'General Practice', min: 24 },
  { name: 'Dental',           min: 18 },
  { name: 'Pediatrics',       min: 31 },
  { name: 'Triage',           min: 12 },
];

const SEAT_UTIL = [
  { name: 'Consultation room 1', util: 84 },
  { name: 'Consultation room 2', util: 78 },
  { name: 'Consultation room 3', util: 22 },
  { name: 'Dental chair A',      util: 91 },
  { name: 'Dental chair B',      util: 67 },
  { name: 'Triage desk',         util: 73 },
  { name: 'Peds room',           util: 14 },
];

/* ─────────────────────────────────────────────────
   #14  ClientLinksView
───────────────────────────────────────────────── */

type LinkScope = 'Whole org' | 'Department' | 'Specific seat';

interface ClientLinksViewProps {
  onOpenClientPortal?: () => void;
}

export function ClientLinksView({ onOpenClientPortal }: ClientLinksViewProps = {}) {
  const [showModal, setShowModal] = useState(false);
  const [scope, setScope] = useState<LinkScope>('Whole org');
  const scopeOptions: LinkScope[] = ['Whole org', 'Department', 'Specific seat'];

  return (
    <>
      <TopBar
        title="Client portal links"
        subtitle="QR codes and shareable URLs for joining your queue."
        right={
          <Button variant="primary" icon="plus" onClick={() => setShowModal(true)}>
            Generate new link
          </Button>
        }
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
          {LINKS.map((l) => (
            <LinkCard key={l.id} link={l} onOpenClientPortal={onOpenClientPortal} />
          ))}
        </div>
      </div>

      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title="Generate a new link"
        footer={
          <>
            <Button variant="ghost" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" icon="link" onClick={() => setShowModal(false)}>
              Generate link
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-[14px]">
          <Field label="Link name" hint="Where will you post this?">
            <TextInput defaultValue="Side entrance QR" />
          </Field>
          <Field label="Scope">
            <div className="grid gap-2" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
              {scopeOptions.map((o) => (
                <button
                  key={o}
                  onClick={() => setScope(o)}
                  className={cn(
                    'px-3 py-[10px] rounded-[8px] cursor-pointer text-left text-[12.5px] font-medium',
                    'border transition-[background,border-color,color] duration-100',
                    scope === o
                      ? 'bg-teal-tint border-teal text-teal-ink'
                      : 'bg-surface border-line-2 text-ink hover:bg-surface-2',
                  )}
                >
                  {o}
                </button>
              ))}
            </div>
          </Field>
          {scope === 'Department' && (
            <Field label="Department">
              <SelectInput
                defaultValue="General Practice"
                options={['General Practice', 'Dental', 'Pediatrics']}
              />
            </Field>
          )}
          {scope === 'Specific seat' && (
            <Field label="Seat">
              <SelectInput
                defaultValue="Triage desk"
                options={['Triage desk', 'Consultation room 1', 'Dental chair A']}
              />
            </Field>
          )}
        </div>
      </Modal>
    </>
  );
}

function LinkCard({
  link,
  onOpenClientPortal,
}: {
  link: PortalLink;
  onOpenClientPortal?: () => void;
}) {
  const { copy, copied } = useCopy();
  const fullUrl = link.url.startsWith('http') ? link.url : `https://${link.url}`;

  return (
    <Card hover style={{ padding: 14, overflow: 'hidden' }}>
      <div className="flex items-start gap-3 min-w-0">
        <QRCode size={72} value={fullUrl} />
        <div className="flex-1 min-w-0">
          <div className="text-[13.5px] font-medium truncate">{link.name}</div>
          <div className="mono text-[11px] text-ink-3 mt-[2px] leading-[1.4] break-all">
            {link.url}
          </div>
          <Pill tone="neutral" className="mt-2">
            {link.scope}
          </Pill>
        </div>
      </div>
      <div className="mt-3 pt-3 border-t border-line">
        <div className="flex items-center gap-[6px] min-w-0 mb-2">
          <span className="tnum text-[13px] font-medium">{link.scans.toLocaleString()}</span>
          <span className="text-[11.5px] text-ink-3">scans</span>
          <span className="text-[11.5px] text-ink-4 truncate">· {link.created}</span>
        </div>
        <div className="flex items-center flex-wrap gap-[6px] justify-end">
          <Button
            variant="ghost"
            size="sm"
            icon={copied ? 'check' : 'copy'}
            onClick={() => void copy(fullUrl)}
          >
            {copied ? 'Copied' : 'Copy'}
          </Button>
          <Button variant="ghost" size="sm" icon="download">QR</Button>
          <Button
            variant="secondary"
            size="sm"
            iconRight="arrowR"
            onClick={onOpenClientPortal}
          >
            Open
          </Button>
        </div>
      </div>
    </Card>
  );
}

/* ─────────────────────────────────────────────────
   #15  AnalyticsView + chart primitives
───────────────────────────────────────────────── */

function LineChart({ data, height = 160 }: { data: number[]; height?: number }) {
  const W = 800;
  const H = height;
  const pad = { l: 30, r: 12, t: 8, b: 24 };
  const maxVal = Math.max(...data) * 1.15;
  const minVal = 0;

  const sx = (i: number) => pad.l + (i / (data.length - 1)) * (W - pad.l - pad.r);
  const sy = (v: number) => pad.t + (1 - (v - minVal) / (maxVal - minVal)) * (H - pad.t - pad.b);

  const avg = data.map((_, i) => {
    const slice = data.slice(Math.max(0, i - 6), i + 1);
    return slice.reduce((a, b) => a + b, 0) / slice.length;
  });

  const linePath = data.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
  const avgPath = avg.map((v, i) => `${i === 0 ? 'M' : 'L'}${sx(i)},${sy(v)}`).join(' ');
  const area = `${linePath} L${sx(data.length - 1)},${H - pad.b} L${sx(0)},${H - pad.b} Z`;
  const yTicks = [0, 0.5, 1].map((p) => p * maxVal);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      <defs>
        <linearGradient id="qfLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--teal)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {yTicks.map((v, i) => (
        <g key={i}>
          <line x1={pad.l} x2={W - pad.r} y1={sy(v)} y2={sy(v)} stroke="var(--line)" strokeDasharray="2,3" />
          <text
            x={pad.l - 6}
            y={sy(v) + 3}
            fontSize="10"
            fill="var(--ink-4)"
            textAnchor="end"
            fontFamily="var(--font-mono)"
          >
            {Math.round(v)}
          </text>
        </g>
      ))}
      <path d={area} fill="url(#qfLineFill)" />
      <path d={linePath} stroke="var(--teal)" strokeWidth="1.75" fill="none" strokeLinejoin="round" strokeLinecap="round" />
      <path d={avgPath} stroke="var(--ink-3)" strokeWidth="1.25" fill="none" strokeDasharray="4,3" />
      {([0, 7, 14, 21, 29] as number[]).map((i) => (
        <text
          key={i}
          x={sx(i)}
          y={H - 8}
          fontSize="10"
          fill="var(--ink-4)"
          textAnchor="middle"
          fontFamily="var(--font-mono)"
        >{`-${29 - i}d`}</text>
      ))}
    </svg>
  );
}

type BarTone = 'teal' | 'coral' | 'amber';

function Bar({ value, max, tone = 'teal' }: { value: number; max: number; tone?: BarTone }) {
  const colorMap: Record<BarTone, string> = {
    teal: 'var(--teal)',
    coral: 'var(--coral)',
    amber: 'var(--amber)',
  };
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: colorMap[tone] }} />
    </div>
  );
}

function Legend({ items }: { items: { label: string; color: string; dashed?: boolean }[] }) {
  return (
    <div className="flex gap-3">
      {items.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-[5px] text-[11.5px] text-ink-3">
          <span
            style={{
              width: 12,
              height: 0,
              borderTop: `2px ${it.dashed ? 'dashed' : 'solid'} ${it.color}`,
              display: 'inline-block',
            }}
          />
          {it.label}
        </span>
      ))}
    </div>
  );
}

export function AnalyticsView() {
  const seatUtilColumns: DataGridColumn[] = [
    { key: 'name', label: 'Seat', width: '1.4fr' },
    { key: 'bar', label: '', width: '1.6fr' },
    { key: 'val', label: '', width: '70px' },
  ];

  const seatUtilRows: DataGridRow[] = SEAT_UTIL.map((s) => ({
    key: s.name,
    name: <span className="text-[12.5px]">{s.name}</span>,
    bar: <Bar value={s.util} max={100} tone={s.util < 30 ? 'coral' : s.util > 85 ? 'amber' : 'teal'} />,
    val: <span className="tnum text-[12.5px] font-medium text-right block">{s.util}%</span>,
  }));

  return (
    <>
      <TopBar
        title="Analytics"
        subtitle="The last 30 days"
        right={
          <div className="flex gap-2">
            <SelectInput
              defaultValue="Last 30 days"
              options={['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'This year']}
            />
            <Button variant="secondary" icon="download">Export</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto px-6 pt-4 pb-10 qf-scroll">
        <div className="grid grid-cols-4 gap-3 mb-4">
          <Kpi label="Bookings" value="2,831" sub="+18% vs prev" hint="30d" />
          <Kpi label="Avg wait" value="24" sub="min" hint="30d" />
          <Kpi label="Seat utilization" value="62" sub="%" hint="avg across seats" />
          <Kpi label="No-show rate" value="6.2" sub="%" hint="↓ 1.1pp" tone="teal" />
        </div>

        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div className="flex items-baseline gap-[10px] mb-[14px]">
            <h3 className="m-0 text-[14px] font-semibold tracking-[-0.005em]">Bookings per day</h3>
            <span className="text-[12px] text-ink-3">Last 30 days</span>
            <span className="flex-1" />
            <Legend
              items={[
                { label: 'Bookings', color: 'var(--teal)' },
                { label: '7-day avg', color: 'var(--ink-3)', dashed: true },
              ]}
            />
          </div>
          <LineChart data={BOOKINGS_30D} height={180} />
        </Card>

        <div className="grid gap-4" style={{ gridTemplateColumns: '1.1fr 1.4fr' }}>
          <Card style={{ padding: 18 }}>
            <h3 className="m-0 mb-[14px] text-[14px] font-semibold">Avg wait by department</h3>
            <div className="flex flex-col gap-3">
              {WAIT_BY_DEPT.map((d) => (
                <div key={d.name}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[12.5px] text-ink-2">{d.name}</span>
                    <span className="mono tnum text-[12.5px] font-medium">{d.min} min</span>
                  </div>
                  <Bar value={d.min} max={40} />
                </div>
              ))}
            </div>
          </Card>

          <Card style={{ padding: 0 }}>
            <div className="px-[18px] py-[14px] border-b border-line flex items-center gap-[10px]">
              <h3 className="m-0 text-[14px] font-semibold">Seat utilization</h3>
              <span className="text-[12px] text-ink-3">% of available hours with an active session</span>
            </div>
            <DataGrid columns={seatUtilColumns} rows={seatUtilRows} />
          </Card>
        </div>
      </div>
    </>
  );
}
