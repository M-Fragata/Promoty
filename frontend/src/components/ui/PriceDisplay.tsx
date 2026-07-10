import { clsx } from 'clsx';
import { formatPrice, calculateDiscount } from '../../utils/format';
import { Badge } from './Badge';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number | null;
  installments?: string | null;
  discountLabel?: string | null;
  className?: string;
}

export function PriceDisplay({
  price,
  originalPrice,
  installments,
  discountLabel,
  className,
}: PriceDisplayProps) {
  const discount = calculateDiscount(originalPrice ?? null, price);
  const showDiscountBadge = discount > 0 && discountLabel;

  return (
    <div className={clsx('flex flex-col gap-3', className)}>
      {/* Original price + discount badge */}
      {discount > 0 && originalPrice && (
        <div className="flex items-center gap-2">
          <span className="text-label-sm text-text-secondary line-through">
            {formatPrice(originalPrice)}
          </span>
          {showDiscountBadge && (
            <Badge variant="discount">{discountLabel}</Badge>
          )}
        </div>
      )}

      {/* Current price */}
      <span className="price-display">{formatPrice(price)}</span>

      {/* Installments */}
      {installments && (
        <span className="text-label-sm text-text-secondary">{installments}</span>
      )}
    </div>
  );
}
