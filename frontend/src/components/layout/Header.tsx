import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, Menu, X, Bell, BellOff } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import logo from '../../assets/fragatalogo.png';

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

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();

  const handleNavClick = (path: string, requiresAuth?: boolean) => {
    setIsMenuOpen(false);
    if (requiresAuth && !isAuthenticated) {
      navigate('/login', { state: { from: path } });
    } else {
      navigate(path);
    }
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-app-bg/95 backdrop-blur supports-[backdrop-filter]:bg-app-bg/80 border-b border-card-border">
        <div className="mx-auto h-full px-4 sm:px-6 lg:px-8 lg:ml-64">
          <div className="flex h-full items-center justify-between">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <a href="/">
                <img
                  className="w-6 h-6 rounded-xl transition: all 0.5s ease hover:scale-105 cursor-pointer"
                  src={logo}
                  alt="Logo Fragata Store"
                />
              </a>
              <h1 className="text-headline-md font-bold text-brand tracking-tight">
                Fragata
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Mobile: Notification Bell */}
              <div className="lg:hidden">
                <button
                  type="button"
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="p-2 rounded-md bg-surface-container text-text-secondary hover:bg-surface-container-high hover:text-text-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-app-bg"
                  aria-label="Notificações"
                  title="Notificações"
                >
                  <Bell className="w-5 h-5" />
                  <span className="sr-only">Notificações</span>
                </button>
              </div>

              {/* Desktop: Hamburger Menu */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="cursor-pointer hidden lg:flex p-2 rounded-lg hover:bg-surface-container-high transition-colors text-text-primary"
                aria-label="Menu"
              >
                {isMenuOpen ? (
                  <X className="w-5 h-5" />
                ) : (
                  <Menu className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Desktop Dropdown Menu */}
      {isMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm hidden lg:block"
            onClick={() => setIsMenuOpen(false)}
          />

          {/* Menu */}
          <div className="fixed top-16 right-4 z-50 w-56 bg-card-bg border border-card-border rounded-xl shadow-lg overflow-hidden hidden lg:block">
            <nav className="flex flex-col py-2">
              {NAV_ITEMS.map(({ icon: Icon, label, path, requiresAuth }) => {
                const isActive = location.pathname === path;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => handleNavClick(path, requiresAuth)}
                    className={clsx(
                      'cursor-pointer flex items-center gap-3 px-4 py-3 transition-colors duration-150 w-full text-left',
                      isActive
                        ? 'text-brand bg-surface-container-low'
                        : 'text-text-primary hover:bg-surface-container-low'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-label-bold text-label-bold">{label}</span>
                  </button>
                );
              })}

              {/* Notification item */}
              <button
                type="button"
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate('/notificacoes');
                }}
                className={clsx(
                  'cursor-pointer flex items-center gap-3 px-4 py-3 transition-colors duration-150 w-full text-left',
                  location.pathname === '/notificacoes'
                    ? 'text-brand bg-surface-container-low'
                    : 'text-text-primary hover:bg-surface-container-low'
                )}
              >
                <Bell className="w-5 h-5" />
                <span className="font-label-bold text-label-bold">Notificações</span>
              </button>
            </nav>
          </div>
        </>
      )}

      {/* Mobile Notification Dropdown */}
      {isNotificationOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
            onClick={() => setIsNotificationOpen(false)}
          />

          {/* Notification Panel */}
          <div className="fixed top-16 right-4 z-50 w-72 bg-card-bg border border-card-border rounded-xl shadow-lg overflow-hidden lg:hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-card-border">
              <h2 className="font-label-bold text-label-bold text-text-primary">Notificações</h2>
              <button
                type="button"
                onClick={() => setIsNotificationOpen(false)}
                className="cursor-pointer p-1 rounded-md hover:bg-surface-container-high transition-colors text-text-secondary"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Empty State */}
            <div className="flex flex-col items-center justify-center py-8 px-4">
              <BellOff className="w-10 h-10 text-text-secondary mb-3" />
              <p className="text-body-md text-text-secondary text-center">
                Nenhuma notificação no momento
              </p>
            </div>

            {/* Footer */}
            <div className="border-t border-card-border">
              <button
                type="button"
                onClick={() => {
                  setIsNotificationOpen(false);
                  navigate('/notificacoes');
                }}
                className="cursor-pointer w-full px-4 py-3 text-center text-brand font-medium hover:bg-surface-container-low transition-colors"
              >
                Ver todas as notificações
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
