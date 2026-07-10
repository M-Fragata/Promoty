import { clsx } from 'clsx';
import { Badge } from '../ui/Badge';

interface ProductCardInfoProps {
  title: string;
  infoBadges?: string[];
  coupon?: string | null;
  className?: string;
}

export function ProductCardInfo({
  title,
  infoBadges = [],
  coupon,
  className,
}: ProductCardInfoProps) {
  const hasBadges = infoBadges.length > 0 || coupon;

  return (
    <div className={clsx('flex flex-col gap-1.5', className)}>
      <h3 className="text-label-bold text-text-primary line-clamp-2 leading-snug">
        {title}
      </h3>

      {hasBadges && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {infoBadges.map((badge) => (
            <Badge key={badge} variant="urgency">{badge}</Badge>
          ))}
          {coupon && (
            <Badge variant="coupon">{coupon}</Badge>
          )}
        </div>
      )}
    </div>
  );
}
