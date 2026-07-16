import { useState, useCallback, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  onFavoriteChange?: (isFavorited: boolean) => void;
}

const sizeStyles = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

const iconSizes = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function FavoriteButton({
  productId,
  className,
  size = 'md',
  onFavoriteChange,
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated } = useAuth();

  // Verificar se o produto já é favorito ao montar
  useEffect(() => {
    if (isAuthenticated) {
      api.checkFavorite(productId)
        .then((result) => setIsFavorited(result))
        .catch(() => {
          // Ignorar erros na verificação inicial
        });
    }
  }, [productId, isAuthenticated]);

  const handleToggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Se não estiver logado, não fazer nada (pode redirecionar depois)
      if (!isAuthenticated) {
        // Por enquanto, apenas retorna
        // TODO: Redirecionar para login
        return;
      }

      if (isLoading) return;

      setIsLoading(true);

      try {
        if (isFavorited) {
          await api.removeFavorite(productId);
          setIsFavorited(false);
          onFavoriteChange?.(false);
        } else {
          await api.addFavorite(productId);
          setIsFavorited(true);
          onFavoriteChange?.(true);
        }
      } catch (error) {
        console.error('Erro ao atualizar favorito:', error);
      } finally {
        setIsLoading(false);
      }
    },
    [productId, isFavorited, isAuthenticated, isLoading, onFavoriteChange]
  );

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isLoading}
      className={clsx(
        'cursor-pointer flex items-center justify-center rounded-lg border border-card-border transition-all duration-200',
        'bg-surface-container-lowest/80 backdrop-blur-sm active:scale-90',
        sizeStyles[size],
        isFavorited
          ? 'text-accent-orange-light'
          : 'text-text-secondary hover:text-accent-orange-light',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
    >
      <Heart
        className={iconSizes[size]}
        fill={isFavorited ? 'currentColor' : 'none'}
        strokeWidth={isFavorited ? 0 : 2}
      />
    </button>
  );
}
