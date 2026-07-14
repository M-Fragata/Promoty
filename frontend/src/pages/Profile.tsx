import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LogOut, Heart, MousePointerClick } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { MobileNav } from '../components/layout/MobileNav';

export function Profile() {
  const [favoritesCount, setFavoritesCount] = useState(0);

  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Carregar contagem de favoritos
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/perfil' } });
      return;
    }

    api.getFavorites()
      .then((data) => {
        setFavoritesCount(data.length);
      })
      .catch(() => {
        // Ignorar erros
      });
  }, [isAuthenticated, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-app-bg">
      {/* Mobile Header */}
      <header className="fixed top-0 w-full z-40 flex items-center justify-between px-container-padding-mobile py-base bg-surface/95 backdrop-blur-md border-b border-outline-variant/30 lg:hidden">
        <button
          type="button"
          onClick={handleBack}
          className="w-10 h-10 flex items-center justify-center rounded-full active:bg-surface-container-high transition-colors text-primary"
          aria-label="Voltar"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 text-center font-label-bold text-label-bold text-text-primary truncate px-4">
          Meu Perfil
        </div>
        <div className="w-10" />
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-40 h-16 bg-app-bg/95 backdrop-blur supports-[backdrop-filter]:bg-app-bg/80 border-b border-card-border">
        <div className="mx-auto h-full px-4 sm:px-6 lg:px-8 lg:ml-64 w-full max-w-7xl flex items-center">
          <h1 className="font-headline-md text-headline-md text-text-primary">
            Meu Perfil
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:mt-5 pt-16 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-3xl lg:ml-64 px-4 md:px-6">
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
                <span className="text-body-md text-text-secondary">Data não disponível</span>
              </div>
            </div>
          </section>

          {/* Activity Section */}
          <section className="flex flex-col gap-3 mb-6">
            <h2 className="text-label-bold text-text-secondary uppercase tracking-widest pl-2">Atividade</h2>
            <div className="grid grid-cols-2 gap-4">
              {/* Links Clicked Card */}
              <div className="bg-card-bg hover:bg-card-bg/80 transition-colors border border-card-border rounded-xl p-5 flex flex-col items-start gap-2 cursor-pointer group shadow-sm hover:shadow-md">
                <div className="p-3 bg-surface-container-lowest rounded-full shadow-sm text-text-primary mb-2 group-hover:scale-110 transition-transform">
                  <MousePointerClick className="w-5 h-5" />
                </div>
                <span className="text-headline-lg-mobile text-text-primary">0</span>
                <span className="text-body-md text-text-secondary font-medium">Links Clicados</span>
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
