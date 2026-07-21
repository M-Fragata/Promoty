import { clsx } from 'clsx';

interface FilterChipProps {
  label: string;
  selected: boolean;
  onClick: () => void;
  className?: string;
}

export function FilterChip({ label, selected, onClick, className }: FilterChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'px-3 py-1.5 rounded-full text-label-sm font-medium transition-all duration-200',
        'border',
        selected
          ? 'bg-text-primary text-app-bg border-text-primary'
          : 'bg-transparent text-text-secondary border-card-border hover:border-text-secondary',
        className
      )}
    >
      {label}
    </button>
  );
}
