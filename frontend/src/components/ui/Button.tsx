import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { clsx } from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  children: ReactNode;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-brand text-brand-on hover:bg-brand-container active:bg-primary shadow-sm',
  secondary:
    'bg-transparent border border-outline-variant text-text-primary hover:bg-surface-container active:bg-surface-container-high',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-container hover:text-text-primary active:bg-surface-container-high',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-label-sm gap-1.5',
  md: 'h-10 px-4 text-label-bold gap-2',
  lg: 'h-12 px-6 text-body-md gap-2',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-semibold transition-colors duration-150',
        'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-app-bg',
        'disabled:opacity-50 disabled:pointer-events-none',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
