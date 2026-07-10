import { type ReactNode } from 'react';
import { clsx } from 'clsx';

type BadgeVariant = 'discount' | 'urgency' | 'store' | 'coupon';

interface BadgeProps {
  variant: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
  discount: 'bg-discount-bg text-discount-text',
  urgency: 'bg-urgency-bg text-urgency-text',
  store: 'bg-brand-container text-brand-on-container',
  coupon: 'bg-accent-orange-light text-white',
};

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-label-sm font-semibold leading-5',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
