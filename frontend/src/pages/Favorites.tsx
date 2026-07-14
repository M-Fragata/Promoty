import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/product/ProductSkeleton';
import { MobileNav } from '../components/layout/MobileNav';
import type { MlProducts } from '../types/product';

export function Favorites() {
  const [favorites, setFavorites] = useState<MlProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Carregar favoritos
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: '/favoritos' } });
      return;
    }

    setIsLoading(true);
    setError(null);

    api.getFavorites()
      .then((data) => {
        setFavorites(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Erro ao carregar favoritos');
        setIsLoading(false);
      });
  }, [isAuthenticated, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

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
          Meus Favoritos
        </div>
        <div className="w-10" />
      </header>

      {/* Desktop Header */}
      <header className="hidden lg:flex fixed top-0 left-0 right-0 z-40 h-16 bg-app-bg/95 backdrop-blur supports-[backdrop-filter]:bg-app-bg/80 border-b border-card-border">
        <div className="mx-auto h-full px-4 sm:px-6 lg:px-8 lg:ml-64 w-full max-w-7xl flex items-center">
          <h1 className="font-headline-md text-headline-md text-text-primary">
            Meus Favoritos
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="md:mt-5 pt-16 lg:pt-16 pb-24 lg:pb-8">
        <div className="mx-auto max-w-7xl lg:ml-64">
          {/* Loading State */}
          {isLoading && (
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <ProductSkeleton key={i} />
                ))}
              </div>
            </div>
          )}

          {/* Error State */}
          {error && !isLoading && (
            <div className="p-4 md:p-6">
              <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
                <p className="text-text-secondary mb-4">{error}</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="text-brand hover:underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !error && favorites.length === 0 && (
            <div className="p-4 md:p-6">
              <div className="bg-card-bg border border-card-border rounded-xl p-8 text-center">
                <Heart className="w-12 h-12 text-text-secondary mx-auto mb-4" />
                <h2 className="text-headline-sm text-text-primary font-headline-sm mb-2">
                  Nenhum favorito ainda
                </h2>
                <p className="text-body-md text-text-secondary mb-4">
                  Explore as ofertas e favorite os produtos que você mais gosta!
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="text-brand hover:underline font-semibold"
                >
                  Ver ofertas
                </button>
              </div>
            </div>
          )}

          {/* Favorites Grid */}
          {!isLoading && !error && favorites.length > 0 && (
            <div className="p-4 md:p-6">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {favorites.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <MobileNav />
    </div>
  );
}
