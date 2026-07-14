import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Heart, User, Menu, X } from 'lucide-react';
import { clsx } from 'clsx';
import { ThemeToggle } from './ThemeToggle';
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
              <img
                className="w-6 h-6 rounded-xl transition: all 0.5s ease hover:scale-105 cursor-pointer"
                src={logo}
                alt=""
              />
              <h1 className="text-headline-md font-bold text-brand tracking-tight">
                Fragata
              </h1>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Mobile: ThemeToggle */}
              <div className="lg:hidden">
                <ThemeToggle />
              </div>

              {/* Desktop: Hamburger Menu */}
              <button
                type="button"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="hidden lg:flex p-2 rounded-lg hover:bg-surface-container-high transition-colors text-text-primary"
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
                      'flex items-center gap-3 px-4 py-3 transition-colors duration-150 w-full text-left',
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
            </nav>
          </div>
        </>
      )}
    </>
  );
}
