import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductCardImage } from './ProductCardImage';
import { ProductCardInfo } from './ProductCardInfo';
import { PriceDisplay } from '../ui/PriceDisplay';
import { FavoriteButton } from './FavoriteButton';
import { ShareButton } from './ShareButton';
import { parseBadge } from '../../utils/badge';
import type { MlProducts } from '../../types/product';

interface ProductCardProps {
  product: MlProducts;
}

export function ProductCard({ product }: ProductCardProps) {
  const navigate = useNavigate();
  const { discount, info } = parseBadge(product.badge);

  const handleCardClick = () => {
    navigate(`/produto/${product.id}`);
  };

  return (
    <article
      className="flex flex-col gap-3 rounded-lg bg-card-bg border border-card-border p-3 shadow-sm transition-shadow hover:shadow-md"
    >
      <div
        onClick={handleCardClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Ver detalhes de ${product.title}`}
        className="cursor-pointer"
      >
        <ProductCardImage
          imageUrl={product.imageUrl}
          title={product.title}
          store={product.store}
        >
          <FavoriteButton productId={product.id} size="sm" />
        </ProductCardImage>
      </div>

      <ProductCardInfo
        title={product.title}
        infoBadges={info}
        coupon={product.coupon}
      />

      <PriceDisplay
        price={product.price}
        originalPrice={product.originalPrice}
        installments={product.installments}
        discountLabel={discount}
      />

      <div className="mt-auto flex gap-2">
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className={clsx(
            'flex-1 inline-flex items-center justify-center gap-2 h-10 rounded-md text-label-bold font-semibold transition-colors duration-150',
            'bg-text-primary text-card-bg hover:opacity-90 active:opacity-80 shadow-sm',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-app-bg'
          )}
        >
          Comprar
          <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
        <ShareButton
          productTitle={product.title}
          productLink={product.link}
          size="md"
        />
      </div>
    </article>
  );
}
