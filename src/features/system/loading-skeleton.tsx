import { Card, Pill } from '@/components/ui';
import { cn } from '@/lib/utils';

function SkLine({ w, h = 12, className }: { w: number | string; h?: number; className?: string }) {
  return (
    <div
      className={cn('qf-shimmer rounded-[4px]', className)}
      style={{ width: w, height: h }}
    />
  );
}

function SkBox({
  w, h, circle, className,
}: {
  w: number | string;
  h: number;
  circle?: boolean;
  className?: string;
}) {
  return (
    <div
      className={cn('qf-shimmer', className)}
      style={{ width: w, height: h, borderRadius: circle ? '50%' : 6 }}
    />
  );
}

function SkRow({ big, last }: { big?: boolean; last?: boolean }) {
  return (
    <div
      className={cn(
        'grid items-center gap-3',
        big ? 'p-4' : 'px-4 py-3',
        !last && 'border-b border-line',
      )}
      style={{ gridTemplateColumns: big ? 'auto 1fr auto' : 'auto 1fr auto auto' }}
    >
      <SkBox w={big ? 48 : 30} h={big ? 48 : 30} circle />
      <div>
        <SkLine w={big ? 180 : 130} h={big ? 18 : 14} />
        <SkLine w={big ? 260 : 180} h={11} className="mt-1.5" />
      </div>
      {!big && <SkLine w={70} h={13} />}
      <SkBox w={big ? 124 : 36} h={big ? 64 : 24} />
    </div>
  );
}

type Section = { tone: string; rows: number; big?: boolean };
const SECTIONS: Section[] = [
  { tone: 'amber',   rows: 2 },
  { tone: 'blue',    rows: 1, big: true },
  { tone: 'teal',    rows: 3 },
  { tone: 'neutral', rows: 3 },
];

const ACCENT: Record<string, string> = {
  amber:   'var(--amber)',
  blue:    'var(--blue)',
  teal:    'var(--teal)',
  neutral: 'var(--line-2)',
};

export function LoadingSkeletonScreen() {
  return (
    <div className="min-h-screen bg-bg p-6">
      <div className="max-w-[1280px] mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-2.5 mb-6">
          <h1 className="m-0 text-[22px] font-medium tracking-[-0.02em]">Loading skeleton</h1>
          <Pill tone="neutral">Org user queue — first paint</Pill>
        </div>

        <Card padding={0} className="overflow-hidden">
          {/* Skeleton top bar */}
          <div className="px-6 py-3.5 border-b border-line flex items-center gap-4">
            <div className="flex-1">
              <SkLine w={160} h={16} />
              <SkLine w={240} h={11} className="mt-1.5" />
            </div>
            <SkBox w={140} h={32} />
            <SkBox w={92} h={32} />
          </div>

          {/* Main grid */}
          <div className="p-5 grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
            {/* Left: section cards */}
            <div className="flex flex-col gap-3.5">
              {SECTIONS.map((s, i) => (
                <div
                  key={i}
                  className="bg-surface border border-line rounded-[12px] overflow-hidden"
                >
                  <div className="px-4 py-3 border-b border-line flex items-center gap-2.5 relative">
                    <span
                      className="absolute left-0 top-[10px] bottom-[10px] w-[3px]"
                      style={{ background: ACCENT[s.tone] }}
                    />
                    <SkLine w={140} h={14} />
                    <SkBox w={24} h={18} />
                  </div>
                  {Array.from({ length: s.rows }).map((_, j) => (
                    <SkRow key={j} big={s.big} last={j === s.rows - 1} />
                  ))}
                </div>
              ))}
            </div>

            {/* Right: sidebar panel */}
            <div>
              <div className="bg-surface border border-line rounded-[12px] p-3.5 mb-3">
                <SkLine w={120} h={14} />
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex gap-2.5 mt-3">
                    <SkBox w={22} h={22} circle />
                    <div className="flex-1">
                      <SkLine w="80%" h={11} />
                      <SkLine w="60%" h={10} className="mt-1.5" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <p className="mt-4 text-[12px] text-ink-3">
          The skeleton matches the live queue layout so there's no jarring re-flow when data arrives.
          Shimmer is a single linear-gradient sliding across each block.
        </p>
      </div>
    </div>
  );
}
