import { type HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './icon';
import type { Tone, IconName } from '@/types';

interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  icon?: IconName;
  dot?: boolean;
}

const toneStyles: Record<Tone, string> = {
  neutral: 'bg-surface-2 text-ink-2 border-line',
  teal:    'bg-teal-tint text-teal-ink border-transparent',
  amber:   'bg-amber-tint text-amber border-transparent',
  blue:    'bg-blue-tint text-blue border-transparent',
  coral:   'bg-coral-tint text-coral-2 border-transparent',
  success: 'bg-success-tint text-success border-transparent',
};

export function Pill({ tone = 'neutral', icon, dot, children, className, ...rest }: PillProps) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-[5px] border rounded-full',
        'px-2 py-[2px] text-[11.5px] font-medium leading-[1.5]',
        'tracking-[-0.003em]',
        toneStyles[tone],
        className,
      )}
    >
      {dot && (
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-85" />
      )}
      {icon && <Icon name={icon} size={11} />}
      {children}
    </span>
  );
}
