import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';

interface NavItem {
  icon: typeof Home;
  label: string;
  path: string;
  requiresAuth?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Search, label: 'Buscar', path: '/buscar' },
  { icon: Heart, label: 'Favoritos', path: '/favoritos', requiresAuth: true },
  { icon: User, label: 'Perfil', path: '/perfil', requiresAuth: true },
];

export function MobileNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const handleNavClick = (path: string, requiresAuth?: boolean) => {
    if (requiresAuth && !isAuthenticated) {
      // Redirecionar para login com a rota de retorno
      navigate('/login', { state: { from: path } });
    } else {
      navigate(path);
    }
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card-bg border-t border-card-border safe-area-bottom">
      <div className="flex items-center justify-around h-16">
        {NAV_ITEMS.map(({ icon: Icon, label, path, requiresAuth }) => {
          const isActive = location.pathname === path;

          return (
            <button
              key={label}
              type="button"
              onClick={() => handleNavClick(path, requiresAuth)}
              className={clsx(
                'flex flex-col items-center gap-0.5 px-3 py-1 transition-colors duration-150',
                isActive
                  ? 'text-brand'
                  : 'text-text-secondary hover:text-text-primary'
              )}
              aria-label={label}
            >
              <Icon className="w-5 h-5" aria-hidden="true" />
              <span className="text-label-sm font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
