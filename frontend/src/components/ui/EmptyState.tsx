import { type LucideIcon, PackageSearch } from 'lucide-react';
import { clsx } from 'clsx';

interface EmptyStateProps {
  message?: string;
  icon?: LucideIcon;
  className?: string;
}

export function EmptyState({
  message = 'Nenhum resultado encontrado',
  icon: Icon = PackageSearch,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center gap-3 py-16 text-text-secondary max-w-full px-4',
        className
      )}
    >
      <Icon className="w-12 h-12 text-outline-variant" aria-hidden="true" />
      <p className="text-body-md text-center">{message}</p>
    </div>
  );
}
