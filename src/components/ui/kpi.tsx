import { Card } from './card';
import { cn } from '@/lib/utils';

type KpiTone = 'neutral' | 'teal' | 'coral' | 'amber';

interface KpiProps {
  label: string;
  value: string | number;
  sub?: string;
  hint?: string;
  tone?: KpiTone;
  className?: string;
}

const toneColor: Record<KpiTone, string> = {
  neutral: 'text-ink',
  teal:    'text-teal',
  coral:   'text-coral-2',
  amber:   'text-amber',
};

export function Kpi({ label, value, sub, hint, tone = 'neutral', className }: KpiProps) {
  return (
    <Card className={className} padding={14}>
      <div className="flex justify-between items-baseline">
        <div className="text-xs text-ink-3 font-medium">{label}</div>
        {hint && <div className="text-[11px] text-ink-4">{hint}</div>}
      </div>
      <div className="flex items-baseline gap-1.5 mt-1.5">
        <span className={cn('tnum text-2xl font-medium tracking-[-0.02em]', toneColor[tone])}>
          {value}
        </span>
        {sub && <span className="text-xs text-ink-3">{sub}</span>}
      </div>
    </Card>
  );
}
