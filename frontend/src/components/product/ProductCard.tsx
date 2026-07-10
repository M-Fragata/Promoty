import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { ProductCardImage } from './ProductCardImage';
import { ProductCardInfo } from './ProductCardInfo';
import { PriceDisplay } from '../ui/PriceDisplay';
import { parseBadge } from '../../utils/badge';
import type { MlProducts } from '../../types/product';

interface ProductCardProps {
  product: MlProducts;
}

export function ProductCard({ product }: ProductCardProps) {
  const { discount, info } = parseBadge(product.badge);

  return (
    <article className="flex flex-col gap-3 rounded-lg bg-card-bg border border-card-border p-3 shadow-sm transition-shadow hover:shadow-md">
      <ProductCardImage
        imageUrl={product.imageUrl}
        title={product.title}
        store={product.store}
      />

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

      <a
        href={product.link}
        target="_blank"
        rel="noopener noreferrer"
        className={clsx(
          'mt-auto inline-flex items-center justify-center gap-2 w-full h-10 rounded-md text-label-bold font-semibold transition-colors duration-150',
          'bg-text-primary text-card-bg hover:opacity-90 active:opacity-80 shadow-sm',
          'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-app-bg'
        )}
      >
        Comprar
        <ExternalLink className="w-4 h-4" aria-hidden="true" />
      </a>
    </article>
  );
}
