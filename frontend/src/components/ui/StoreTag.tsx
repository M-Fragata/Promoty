import { clsx } from 'clsx';
import { getStoreInfo } from '../../utils/constants';

interface StoreTagProps {
  store: string;
  className?: string;
}

export function StoreTag({ store, className }: StoreTagProps) {
  const info = getStoreInfo(store);

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-label-sm font-semibold shadow-md border border-white/20',
        info.color,
        className
      )}
    >
      <span aria-hidden="true">{info.icon}</span>
      {info.label}
    </span>
  );
}
