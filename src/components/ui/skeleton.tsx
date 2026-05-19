import { Card } from './card';
import { Pill } from './pill';
import { cn } from '@/lib/utils';

export function SkeletonLine({
  w,
  h = 12,
  className,
}: {
  w: number | string;
  h?: number;
  className?: string;
}) {
  return (
    <div
      className={cn('qf-shimmer rounded-[4px]', className)}
      style={{ width: w, height: h }}
    />
  );
}

export function SkeletonBox({
  w,
  h,
  circle,
  className,
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

function SkeletonRow({ big, last }: { big?: boolean; last?: boolean }) {
  return (
    <div
      className={cn(
        'grid items-center gap-3',
        big ? 'p-4' : 'px-4 py-3',
        !last && 'border-b border-line',
      )}
      style={{ gridTemplateColumns: big ? 'auto 1fr auto' : 'auto 1fr auto auto' }}
    >
      <SkeletonBox w={big ? 48 : 30} h={big ? 48 : 30} circle />
      <div>
        <SkeletonLine w={big ? 180 : 130} h={big ? 18 : 14} />
        <SkeletonLine w={big ? 260 : 180} h={11} className="mt-1.5 max-w-full" />
      </div>
      {!big && <SkeletonLine w={70} h={13} />}
      <SkeletonBox w={big ? 124 : 36} h={big ? 64 : 24} />
    </div>
  );
}

type Section = { tone: string; rows: number; big?: boolean };

const SECTIONS: Section[] = [
  { tone: 'amber', rows: 2 },
  { tone: 'blue', rows: 1, big: true },
  { tone: 'teal', rows: 3 },
  { tone: 'neutral', rows: 3 },
];

const ACCENT: Record<string, string> = {
  amber: 'var(--amber)',
  blue: 'var(--blue)',
  teal: 'var(--teal)',
  neutral: 'var(--line-2)',
};

function QueueSkeletonPanel() {
  return (
    <Card padding={0} className="overflow-hidden">
      <div className="px-6 py-3.5 border-b border-line flex items-center gap-4">
        <div className="flex-1 min-w-0">
          <SkeletonLine w={160} h={16} />
          <SkeletonLine w={240} h={11} className="mt-1.5 max-w-full" />
        </div>
        <SkeletonBox w={140} h={32} className="hidden sm:block" />
        <SkeletonBox w={92} h={32} className="hidden sm:block" />
      </div>

      <div className="p-5 grid gap-5 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-3.5 min-w-0">
          {SECTIONS.map((section, i) => (
            <div
              key={i}
              className="bg-surface border border-line rounded-[12px] overflow-hidden"
            >
              <div className="px-4 py-3 border-b border-line flex items-center gap-2.5 relative">
                <span
                  className="absolute left-0 top-[10px] bottom-[10px] w-[3px]"
                  style={{ background: ACCENT[section.tone] }}
                />
                <SkeletonLine w={140} h={14} />
                <SkeletonBox w={24} h={18} />
              </div>
              {Array.from({ length: section.rows }).map((_, j) => (
                <SkeletonRow key={j} big={section.big} last={j === section.rows - 1} />
              ))}
            </div>
          ))}
        </div>

        <div className="hidden lg:block">
          <div className="bg-surface border border-line rounded-[12px] p-3.5 mb-3">
            <SkeletonLine w={120} h={14} />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-2.5 mt-3">
                <SkeletonBox w={22} h={22} circle />
                <div className="flex-1">
                  <SkeletonLine w="80%" h={11} />
                  <SkeletonLine w="60%" h={10} className="mt-1.5" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

function WorkspaceRouteSkeleton() {
  return (
    <div className="min-h-screen bg-bg flex overflow-hidden">
      <aside className="hidden md:flex w-[232px] flex-none bg-surface border-r border-line flex-col h-screen">
        <div className="p-4 pb-3">
          <SkeletonLine w={108} h={20} />
          <div className="mt-[10px] px-[10px] py-2 bg-surface-2 rounded-lg flex items-center gap-2 border border-line">
            <SkeletonBox w={22} h={22} />
            <div className="flex-1 min-w-0">
              <SkeletonLine w="80%" h={12} />
              <SkeletonLine w={58} h={10} className="mt-1.5" />
            </div>
          </div>
        </div>
        <nav className="flex-1 px-2 py-1 flex flex-col gap-1">
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} className="flex items-center gap-[10px] px-[10px] py-[8px]">
              <SkeletonBox w={15} h={15} />
              <SkeletonLine w={i === 3 ? 142 : 98} h={12} />
            </div>
          ))}
        </nav>
      </aside>

      <main className="flex-1 min-w-0">
        <QueueLoadingSkeleton compact />
      </main>
    </div>
  );
}

function ClientRouteSkeleton() {
  return (
    <div className="min-h-screen bg-bg px-5 py-8 flex items-center justify-center">
      <div className="w-full max-w-[390px] bg-surface border border-line rounded-[28px] shadow-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <SkeletonLine w={96} h={16} />
          <SkeletonBox w={34} h={34} circle />
        </div>
        <div className="p-5">
          <SkeletonLine w={180} h={22} />
          <SkeletonLine w="88%" h={12} className="mt-2" />
          <SkeletonLine w="64%" h={12} className="mt-1.5" />
          <div className="mt-6 space-y-3">
            <SkeletonBox w="100%" h={46} />
            <SkeletonBox w="100%" h={46} />
            <SkeletonBox w="72%" h={46} />
          </div>
          <div className="mt-7 grid grid-cols-3 gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonBox key={i} w="100%" h={64} />
            ))}
          </div>
          <SkeletonBox w="100%" h={44} className="mt-7" />
        </div>
      </div>
    </div>
  );
}

function GuestRouteSkeleton() {
  return (
    <div className="min-h-screen bg-bg px-6 py-6">
      <div className="max-w-[1180px] mx-auto">
        <header className="flex items-center justify-between py-2">
          <SkeletonLine w={112} h={22} />
          <div className="hidden sm:flex gap-2">
            <SkeletonBox w={86} h={34} />
            <SkeletonBox w={108} h={34} />
          </div>
        </header>
        <div className="grid lg:grid-cols-[1fr_420px] gap-10 items-center min-h-[calc(100vh-120px)]">
          <div>
            <SkeletonLine w={126} h={16} />
            <SkeletonLine w="90%" h={54} className="mt-5 max-w-[620px]" />
            <SkeletonLine w="72%" h={54} className="mt-2 max-w-[540px]" />
            <SkeletonLine w="82%" h={14} className="mt-6 max-w-[560px]" />
            <SkeletonLine w="64%" h={14} className="mt-2 max-w-[460px]" />
            <div className="mt-8 flex gap-3">
              <SkeletonBox w={142} h={44} />
              <SkeletonBox w={118} h={44} />
            </div>
          </div>
          <div className="hidden lg:block">
            <QueueSkeletonPanel />
          </div>
        </div>
      </div>
    </div>
  );
}

export function QueueLoadingSkeleton({ compact = false }: { compact?: boolean }) {
  return (
    <div className={cn('bg-bg', compact ? 'min-h-screen' : 'min-h-screen p-6')}>
      <div className={cn(!compact && 'max-w-[1280px] mx-auto')}>
        {!compact && (
          <div className="flex items-center gap-2.5 mb-6">
            <h1 className="m-0 text-[22px] font-medium tracking-[-0.02em]">Loading skeleton</h1>
            <Pill tone="neutral">Org user queue - first paint</Pill>
          </div>
        )}

        {compact ? (
          <div className="h-screen flex flex-col">
            <div className="px-6 py-[14px] border-b border-line bg-surface flex items-center gap-4">
              <div className="flex-1">
                <SkeletonLine w={140} h={16} />
                <SkeletonLine w={220} h={11} className="mt-1.5 max-w-full" />
              </div>
              <SkeletonBox w={88} h={32} className="hidden sm:block" />
              <SkeletonBox w={120} h={32} className="hidden sm:block" />
            </div>
            <div className="flex-1 overflow-hidden p-5">
              <QueueSkeletonPanel />
            </div>
          </div>
        ) : (
          <>
            <QueueSkeletonPanel />
            <p className="mt-4 text-[12px] text-ink-3">
              The skeleton matches the live queue layout so there is no jarring re-flow when data arrives.
              Shimmer is a single linear-gradient sliding across each block.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export function RouteLoadingSkeleton() {
  const pathname = window.location.pathname;

  if (pathname === '/' || pathname === '/signup' || pathname === '/login' || pathname === '/accept-invite') {
    return <GuestRouteSkeleton />;
  }

  if (pathname.startsWith('/client')) {
    return <ClientRouteSkeleton />;
  }

  return <WorkspaceRouteSkeleton />;
}
