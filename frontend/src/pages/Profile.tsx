import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Heart, Link2, Sun, Moon, Monitor } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { api } from '../services/api';
import { MobileNav } from '../components/layout/MobileNav';
import { Header } from '../components/layout/Header';
import { ProfileSkeleton } from '../components/profile/ProfileSkeleton';
import { clsx } from 'clsx';

export function Profile() {
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [linksCount, setLinksCount] = useState(0);
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { user, isAuthenticated, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();

  // Carregar dados do usuário, favoritos e links
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/perfil' } });
      return;
    }

    Promise.all([
      api.getMe().then((data) => setCreatedAt(data.createdAt)).catch(() => {}),
      api.getFavorites().then((data) => setFavoritesCount(data.length)).catch(() => {}),
      api.getLinks().then((data) => setLinksCount(data.length)).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [isAuthenticated, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (loading || !user) {
    return <ProfileSkeleton />;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <main className="md:mt-5 pt-16 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl px-4 md:px-6">
          {/* Profile Hero Section */}
          <section className="flex flex-col items-center justify-center py-6 gap-4 mb-6">
            <div className="relative group cursor-pointer">
              <div className="w-32 h-32 rounded-full bg-surface-container-high flex items-center justify-center overflow-hidden ring-4 ring-surface-container-lowest shadow-sm">
                {user.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold text-text-secondary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <span className="text-on-primary text-xl">✏️</span>
              </div>
            </div>
          </section>

          {/* User Info Card */}
          <section className="bg-card-bg rounded-xl shadow-sm border border-card-border overflow-hidden flex flex-col mb-6">
            <div className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary uppercase tracking-wider mb-1">Nome</span>
                <span className="text-body-md font-medium text-text-primary">{user.name}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors border-t border-card-border">
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary uppercase tracking-wider mb-1">Email</span>
                <span className="text-body-md font-medium text-text-primary">{user.email}</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 bg-surface-container-low/30 border-t border-card-border">
              <div className="flex flex-col">
                <span className="text-xs text-text-secondary uppercase tracking-wider mb-1">Conta criada em</span>
                <span className="text-body-md text-text-secondary">
                  {createdAt
                    ? new Date(createdAt).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric'
                      })
                    : 'Data não disponível'
                  }
                </span>
              </div>
            </div>
          </section>

          {/* Activity Section */}
          <section className="flex flex-col gap-3 mb-6">
            <h2 className="text-label-bold text-text-secondary uppercase tracking-widest pl-2">Atividade</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Links Created Card */}
              <div
                onClick={() => navigate('/links-criados')}
                className="bg-card-bg hover:bg-card-bg/80 transition-colors border border-card-border rounded-xl p-5 flex flex-col items-start gap-2 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="p-3 bg-surface-container-lowest rounded-full shadow-sm text-text-primary mb-2 group-hover:scale-110 transition-transform">
                  <Link2 className="w-5 h-5" />
                </div>
                <span className="text-headline-lg-mobile text-text-primary">{linksCount}</span>
                <span className="text-body-md text-text-secondary font-medium">Links Criados</span>
              </div>

              {/* Favorites Card */}
              <div
                onClick={() => navigate('/favoritos')}
                className="bg-card-bg hover:bg-card-bg/80 transition-colors border border-card-border rounded-xl p-5 flex flex-col items-start gap-2 cursor-pointer group shadow-sm hover:shadow-md"
              >
                <div className="p-3 bg-surface-container-lowest rounded-full shadow-sm text-accent-orange-light mb-2 group-hover:scale-110 transition-transform">
                  <Heart className="w-5 h-5" fill="currentColor" />
                </div>
                <span className="text-headline-lg-mobile text-text-primary">{favoritesCount}</span>
                <span className="text-body-md text-text-secondary font-medium">Favoritos</span>
              </div>
            </div>
          </section>

          {/* Settings Section */}
          <section className="flex flex-col gap-3 mb-6">
            <h2 className="text-label-bold text-text-secondary uppercase tracking-widest pl-2">Configurações</h2>
            <div className="bg-card-bg rounded-xl shadow-sm border border-card-border overflow-hidden flex flex-col">
              {/* Theme Settings */}
              <div className="p-4 border-b border-card-border">
                <span className="text-xs text-text-secondary uppercase tracking-wider mb-3 block">Tema</span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={clsx(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      theme === 'light'
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-card-border hover:bg-surface-container-low text-text-secondary'
                    )}
                  >
                    <Sun className="w-5 h-5" />
                    <span className="text-xs font-medium">Claro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={clsx(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      theme === 'dark'
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-card-border hover:bg-surface-container-low text-text-secondary'
                    )}
                  >
                    <Moon className="w-5 h-5" />
                    <span className="text-xs font-medium">Escuro</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('system')}
                    className={clsx(
                      'flex flex-col items-center gap-2 p-3 rounded-lg border transition-all',
                      theme === 'system'
                        ? 'border-brand bg-brand/10 text-brand'
                        : 'border-card-border hover:bg-surface-container-low text-text-secondary'
                    )}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs font-medium">Padrão</span>
                  </button>
                </div>
              </div>

              {/* Logout */}
              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center gap-4 p-4 hover:bg-red-500/10 transition-colors w-full text-left group"
              >
                <LogOut className="w-5 h-5 text-red-500" />
                <span className="text-body-md flex-1 text-red-500 font-medium">Sair</span>
              </button>
            </div>
          </section>
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
