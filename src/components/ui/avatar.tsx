import { hashStr } from '@/lib/time';
import { cn } from '@/lib/utils';

interface AvatarProps {
  name?: string;
  size?: number;
  active?: boolean;
  className?: string;
}

const HUES = [25, 200, 160, 320, 50, 280, 130];

export function Avatar({ name = '?', size = 28, active, className }: AvatarProps) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const hue = HUES[hashStr(name) % HUES.length];
  const bg = `oklch(0.88 0.04 ${hue})`;
  const fg = `oklch(0.32 0.05 ${hue})`;
  const dotSize = Math.max(8, size * 0.28);

  return (
    <span className={cn('relative inline-flex flex-none', className)}>
      <span
        className="inline-flex items-center justify-center rounded-full font-semibold select-none"
        style={{
          width: size,
          height: size,
          background: bg,
          color: fg,
          fontSize: Math.max(10, size * 0.38),
          letterSpacing: '-0.01em',
          boxShadow: 'inset 0 0 0 1px rgba(20,18,12,.04)',
        }}
      >
        {initials || '?'}
      </span>
      {active !== undefined && (
        <span
          className="absolute -right-px -bottom-px rounded-full border-2 border-surface"
          style={{
            width: dotSize,
            height: dotSize,
            background: active ? 'var(--success)' : 'var(--ink-4)',
          }}
        />
      )}
    </span>
  );
}
