// src/views/superuser/management.tsx
// Holds the dashboard pages that don't yet have backend APIs:
//   - AnalyticsView    (M9+ — pending)
//
// API-backed pages live in their own files:
//   - OrgUsersView    → ./org-users.tsx
//   - SeatsView       → ./seats.tsx
//   - TimeslotsView   → ./timeslot-types.tsx
//   - SettingsView    → ./settings.tsx
//   - PortalLinksView → ./portal-links.tsx

import {
  Button,
  Card,
  Kpi,
  SelectInput,
} from '@/components/ui';
import { TopBar } from '@/components/layout';
import { DataGrid, type DataGridColumn, type DataGridRow } from './shared';

/* ─────────────────────────────────────────────────
   Mock data (M9+ analytics not implemented backend-side)
───────────────────────────────────────────────── */

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
          <div className="flex flex-wrap gap-2">
            <SelectInput
              defaultValue="Last 30 days"
              options={['Today', 'Last 7 days', 'Last 30 days', 'Last 90 days', 'This year']}
            />
            <Button variant="secondary" icon="download">Export</Button>
          </div>
        }
      />
      <div className="flex-1 overflow-auto qf-page qf-scroll">
        <div className="qf-kpi-grid gap-3 mb-4">
          <Kpi label="Bookings" value="2,831" sub="+18% vs prev" hint="30d" />
          <Kpi label="Avg wait" value="24" sub="min" hint="30d" />
          <Kpi label="Seat utilization" value="62" sub="%" hint="avg across seats" />
          <Kpi label="No-show rate" value="6.2" sub="%" hint="↓ 1.1pp" tone="teal" />
        </div>

        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div className="flex flex-wrap items-baseline gap-[10px] mb-[14px]">
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

        <div className="qf-analytics-grid gap-4">
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
            <div className="px-[18px] py-[14px] border-b border-line flex flex-wrap items-center gap-[10px]">
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
