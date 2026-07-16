import { useState, useMemo } from 'react';
import { calculateDiscount } from '../utils/format';
import type { MlProducts } from '../types/product';
import type { SortOption } from '../utils/constants';

interface UseFiltersReturn {
  sortBy: SortOption;
  filteredProducts: MlProducts[];
  setSortBy: (sortBy: SortOption) => void;
}

export function useFilters(products: MlProducts[]): UseFiltersReturn {
  const [sortBy, setSortBy] = useState<SortOption>('discount');

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Sort
    switch (sortBy) {
      case 'discount':
        result.sort(
          (a, b) =>
            calculateDiscount(b.originalPrice, b.price) -
            calculateDiscount(a.originalPrice, a.price)
        );
        break;
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        // Keep original order (API default)
        break;
    }

    return result;
  }, [products, sortBy]);

  return {
    sortBy,
    filteredProducts,
    setSortBy,
  };
}
