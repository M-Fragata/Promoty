import { useState, useMemo } from 'react';
import { calculateDiscount } from '../utils/format';
import type { MlProducts } from '../types/product';
import type { SortOption } from '../utils/constants';

interface UseFiltersReturn {
  category: string;
  query: string;
  sortBy: SortOption;
  filteredProducts: MlProducts[];
  setCategory: (category: string) => void;
  setQuery: (query: string) => void;
  setSortBy: (sortBy: SortOption) => void;
}

export function useFilters(products: MlProducts[]): UseFiltersReturn {
  const [category, setCategory] = useState('Todos');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('discount');

  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Filter by category
    if (category !== 'Todos') {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(category.toLowerCase())
      );
    }

    // Filter by search query
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.store.toLowerCase().includes(q)
      );
    }

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
  }, [products, category, query, sortBy]);

  return {
    category,
    query,
    sortBy,
    filteredProducts,
    setCategory,
    setQuery,
    setSortBy,
  };
}
