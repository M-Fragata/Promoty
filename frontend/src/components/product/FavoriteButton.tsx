import { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import { clsx } from 'clsx';

interface FavoriteButtonProps {
  productId: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
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
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(false);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsFavorited((prev) => !prev);
      // TODO: Integrate with backend to persist favorite
      console.log(`Product ${productId} favorite toggled: ${!isFavorited}`);
    },
    [productId, isFavorited]
  );

  return (
    <button
      type="button"
      onClick={handleToggle}
      className={clsx(
        'cursor-pointer flex items-center justify-center rounded-lg border border-card-border transition-all duration-200',
        'bg-surface-container-lowest/80 backdrop-blur-sm active:scale-90',
        sizeStyles[size],
        isFavorited
          ? 'text-accent-orange-light'
          : 'text-text-secondary hover:text-accent-orange-light',
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
