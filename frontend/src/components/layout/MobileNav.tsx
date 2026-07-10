import { Home, Search, Heart, User } from 'lucide-react';
import { clsx } from 'clsx';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', active: true },
  { icon: Search, label: 'Buscar', active: false },
  { icon: Heart, label: 'Favoritos', active: false },
  { icon: User, label: 'Perfil', active: false },
] as const;

export function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card-bg border-t border-card-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ icon: Icon, label, active }) => (
          <button
            key={label}
            type="button"
            className={clsx(
              'flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-150',
              active
                ? 'text-brand'
                : 'text-text-secondary hover:text-text-primary'
            )}
            aria-label={label}
          >
            <Icon className="w-5 h-5" aria-hidden="true" />
            <span className="text-label-sm font-medium">{label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
