import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ProductCard } from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/product/ProductSkeleton';
import { PageShell } from '../components/layout/PageShell';
import type { MlProducts } from '../types/product';

export function Favorites() {
  const [favorites, setFavorites] = useState<MlProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

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
  }, [isAuthenticated, navigate, refreshKey]);

  const handleFavoriteChange = (_productId: string, isFavorited: boolean) => {
    if (!isFavorited) {
      setRefreshKey((prev) => prev + 1);
    }
  };

  return (
    <PageShell>
      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        {/* Loading State */}
        {isLoading && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
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
        )}

        {/* Empty State */}
        {!isLoading && !error && favorites.length === 0 && (
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
              className="text-brand hover:underline font-semibold cursor-pointer"
            >
              Ver ofertas
            </button>
          </div>
        )}

        {/* Favorites Grid */}
        {!isLoading && !error && favorites.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favorites.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onFavoriteChange={handleFavoriteChange}
              />
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
