import { clsx } from 'clsx';

interface CategoryChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryChip({
  label,
  active = false,
  onClick,
  className,
}: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'cursor-pointer inline-flex items-center rounded-full px-3 py-1 text-label-bold transition-colors duration-150 whitespace-nowrap',
        active
          ? 'bg-brand text-brand-on'
          : 'bg-surface-container text-text-secondary hover:bg-surface-container-high hover:text-text-primary',
        className
      )}
    >
      {label}
    </button>
  );
}
