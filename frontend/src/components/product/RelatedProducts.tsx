import { useNavigate } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { clsx } from 'clsx';
import { formatPrice, calculateDiscount } from '../../utils/format';
import { StoreTag } from '../ui/StoreTag';
import type { MlProducts } from '../../types/product';

interface RelatedProductsProps {
  products: MlProducts[];
  className?: string;
}

export function RelatedProducts({ products, className }: RelatedProductsProps) {
  if (products.length === 0) return null;

  return (
    <section className={clsx('py-stack-lg', className)}>
      <div className="px-container-padding-mobile sm:px-container-padding-desktop mb-stack-md flex items-center justify-between">
        <h2 className="font-headline-md text-headline-md text-text-primary">
          Você também pode gostar
        </h2>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div
        className={clsx(
          'flex gap-4 overflow-x-auto px-container-padding-mobile sm:px-container-padding-desktop',
          'no-scrollbar pb-4 snap-x snap-mandatory',
          'lg:grid lg:grid-cols-5 lg:overflow-x-visible lg:snap-none'
        )}
      >
        {products.map((product) => (
          <ProductCardHorizontal
            key={product.id}
            product={product}
          />
        ))}
      </div>
    </section>
  );
}

interface ProductCardHorizontalProps {
  product: MlProducts;
}

function ProductCardHorizontal({ product }: ProductCardHorizontalProps) {
  const navigate = useNavigate();
  const discount = calculateDiscount(product.originalPrice, product.price);

  return (
    <article
      onClick={() => navigate(`/produto/${product.id}`)}
      className={clsx(
        'min-w-[170px] w-[170px] lg:min-w-0 lg:w-full',
        'bg-card-bg rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)]',
        'border border-card-border flex flex-col',
        'snap-start shrink-0 overflow-hidden',
        'transition-shadow hover:shadow-md cursor-pointer'
      )}
    >
      {/* Image */}
      <div className="relative h-32 bg-surface-container-low p-2 flex items-center justify-center">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            loading="lazy"
            className="w-full h-full object-contain"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary text-label-sm">
            Sem imagem
          </div>
        )}

        {/* Store badge */}
        <div className="absolute -top-1 left-0 z-10">
          <StoreTag store={product.store} />
        </div>
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-1 grow">
        <h3 className="font-label-sm text-label-sm text-text-primary line-clamp-2 leading-tight">
          {product.title}
        </h3>

        <div className="mt-auto pt-2 flex flex-col">
          <div className="flex gap-1 items-center">
            {product.originalPrice && (
              <span className="text-sm text-text-secondary line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            {discount > 0 && (
              <span className="inline-flex items-center bg-discount-bg text-discount-text rounded-full px-2 py-0.5 text-sm font-semibold w-fit mb-1">
                -{discount}% OFF
              </span>
            )}
          </div>
          <span className="font-bold text-bold text-accent-green">
            <strong>{formatPrice(product.price)}</strong>
          </span>
        </div>

        {/* Buy button */}
        <a
          href={product.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="mt-2 w-full py-2 bg-text-primary text-card-bg font-label-bold text-label-bold rounded-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-1 active:scale-[0.98]"
        >
          Comprar
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </article>
  );
}
