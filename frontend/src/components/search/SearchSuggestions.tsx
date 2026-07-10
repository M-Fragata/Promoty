import { formatPrice } from '../../utils/format';
import { StoreTag } from '../ui/StoreTag';
import { Badge } from '../ui/Badge';
import { calculateDiscount } from '../../utils/format';
import type { MlProducts } from '../../types/product';

interface SearchSuggestionsProps {
  results: MlProducts[];
  onSelect: (title: string) => void;
}

export function SearchSuggestions({ results, onSelect }: SearchSuggestionsProps) {
  return (
    <ul
      className="absolute top-full left-0 right-0 mt-1 z-50 bg-card-bg border border-card-border rounded-lg shadow-lg overflow-hidden max-h-80 overflow-y-auto"
      role="listbox"
    >
      {results.slice(0, 8).map((product) => {
        const discount = calculateDiscount(product.originalPrice, product.price);

        return (
          <li key={product.id}>
            <button
              type="button"
              onClick={() => onSelect(product.title)}
              className="flex items-center gap-3 w-full px-3 py-2.5 text-left hover:bg-surface-container transition-colors duration-150"
              role="option"
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-surface-container">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-text-secondary text-label-sm">
                    —
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <span className="text-label-bold text-text-primary truncate">
                  {product.title}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-accent-green font-semibold text-label-sm">
                    {formatPrice(product.price)}
                  </span>
                  {discount > 0 && (
                    <Badge variant="discount">{discount}% OFF</Badge>
                  )}
                </div>
              </div>

              {/* Store */}
              <StoreTag store={product.store} className="flex-shrink-0" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
