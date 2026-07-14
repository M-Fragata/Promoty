import { useCallback } from 'react';
import { Share2 } from 'lucide-react';
import { clsx } from 'clsx';

interface ShareButtonProps {
  productTitle: string;
  productLink: string;
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

export function ShareButton({
  productTitle,
  productLink,
  className,
  size = 'md',
}: ShareButtonProps) {
  const handleShare = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (navigator.share) {
        try {
          await navigator.share({
            title: productTitle,
            url: productLink,
          });
        } catch (err) {
          if ((err as Error).name !== 'AbortError') {
            console.error('Error sharing:', err);
          }
        }
      } else {
        await navigator.clipboard.writeText(productLink);
        // TODO: Show toast notification
        console.log('Link copiado para a área de transferência!');
      }
    },
    [productTitle, productLink]
  );

  return (
    <button
      type="button"
      onClick={handleShare}
      className={clsx(
        'cursor-pointer flex items-center justify-center rounded-lg border border-card-border transition-all duration-200',
        'active:scale-90 bg-surface-container-lowest/80 backdrop-blur-sm text-text-secondary hover:text-text-primary',
        sizeStyles[size],
        className
      )}
      aria-label="Compartilhar produto"
    >
      <Share2 className={iconSizes[size]} />
    </button>
  );
}
