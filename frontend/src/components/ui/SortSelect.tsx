import { clsx } from 'clsx';
import { SORT_OPTIONS, type SortOption } from '../../utils/constants';

interface SortSelectProps {
  value: SortOption;
  onChange: (value: SortOption) => void;
  className?: string;
}

export function SortSelect({ value, onChange, className }: SortSelectProps) {
  return (
    <div className={clsx('flex items-center gap-2 text-sm text-text-secondary', className)}>
      <span className="whitespace-nowrap">Ordenar por:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="px-2 py-1 bg-card-bg border border-card-border rounded-md text-text-primary text-label-bold focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-1 focus:ring-offset-app-bg cursor-pointer"
      >
        {SORT_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
