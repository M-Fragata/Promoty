import { useState, useCallback, useMemo } from 'react';
import { Search as SearchIcon } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { SearchBar } from '../components/search/SearchBar';
import { SearchFilters } from '../components/search/SearchFilters';
import { ProductCard } from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/product/ProductSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { useLiveSearch } from '../hooks/useLiveSearch';
import { calculateDiscount } from '../utils/format';

export function Search() {
  const [searchQuery, setSearchQuery] = useState('');
  const [minDiscount, setMinDiscount] = useState(0);
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(0);

  const { results, isSearching, progress, error } = useLiveSearch(searchQuery);

  const filteredResults = useMemo(() => {
    return results.filter((product) => {
      const discount = calculateDiscount(product.originalPrice, product.price);
      if (discount < minDiscount) return false;
      if (minPrice > 0 && product.price < minPrice) return false;
      if (maxPrice > 0 && product.price > maxPrice) return false;
      return true;
    });
  }, [results, minDiscount, minPrice, maxPrice]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleClearFilters = useCallback(() => {
    setMinDiscount(0);
    setMinPrice(0);
    setMaxPrice(0);
  }, []);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto">
        {/* Search Bar */}
        <div className="mb-6">
          <SearchBar
            onSearch={handleSearch}
            className="w-full max-w-md"
          />
        </div>

        {/* Progress indicator */}
        {isSearching && progress && (
          <div className="mb-4 p-3 rounded-md bg-surface-container text-text-secondary text-label-sm">
            Buscando em {progress.store}... ({progress.current}/{progress.total})
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 rounded-md bg-error-container text-on-error-container text-label-bold">
            {error}
          </div>
        )}

        {/* Content: Search prompts or Results */}
        {!searchQuery.trim() ? (
          <EmptyState
            icon={SearchIcon}
            message="Busque por produtos em tempo real"
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Filters */}
            <SearchFilters
              minDiscount={minDiscount}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinDiscountChange={setMinDiscount}
              onMinPriceChange={setMinPrice}
              onMaxPriceChange={setMaxPrice}
              onClear={handleClearFilters}
              resultCount={filteredResults.length}
            />

            {/* Results */}
            <div className="flex-1 min-w-0">
              {isSearching && results.length === 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <ProductSkeleton key={i} />
                  ))}
                </div>
              ) : filteredResults.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredResults.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : (
                <EmptyState message="Nenhum produto encontrado com os filtros selecionados." />
              )}
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
