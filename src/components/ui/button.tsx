import { type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Icon } from './icon';
import type { ButtonVariant, ButtonSize, IconName } from '@/types';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  iconRight?: IconName;
  full?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:       'bg-teal text-white border-teal hover:bg-teal-2 hover:border-teal-2',
  secondary:     'bg-surface text-ink border-line-2 hover:bg-surface-2',
  ghost:         'bg-transparent text-ink-2 border-transparent hover:bg-surface-2',
  danger:        'bg-coral text-white border-coral hover:bg-coral-2 hover:border-coral-2',
  'danger-ghost':'bg-transparent text-coral-2 border-transparent hover:bg-coral-tint',
  outline:       'bg-transparent text-ink border-line-2 hover:bg-surface-2',
  'teal-tint':   'bg-teal-tint text-teal-ink border-transparent hover:brightness-95',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-[10px] py-[6px] text-[12.5px]',
  md: 'px-[14px] py-[9px] text-[13.5px]',
  lg: 'px-[18px] py-[12px] text-[15px]',
};

const iconSize: Record<ButtonSize, number> = { sm: 12.5, md: 13.5, lg: 15 };

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  iconRight,
  full,
  children,
  className,
  disabled,
  ...rest
}: ButtonProps) {
  const sz = iconSize[size];
  return (
    <button
      {...rest}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 border rounded-[8px]',
        'font-medium leading-none cursor-pointer whitespace-nowrap',
        'transition-[background,border-color,color] duration-150',
        'tracking-[-0.005em]',
        variantStyles[variant],
        sizeStyles[size],
        full && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className,
      )}
    >
      {icon && <Icon name={icon} size={sz} stroke={1.75} />}
      {children}
      {iconRight && <Icon name={iconRight} size={sz} stroke={1.75} />}
    </button>
  );
}
