import { useCallback } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { Sidebar } from '../components/layout/Sidebar';
import { SearchBar } from '../components/search/SearchBar';
import { ProductCard } from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/product/ProductSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { CategoryChip } from '../components/ui/CategoryChip';
import { SortSelect } from '../components/ui/SortSelect';
import { Pagination } from '../components/ui/Pagination';
import { useDeals } from '../hooks/useDeals';
import { useLiveSearch } from '../hooks/useLiveSearch';
import { useFilters } from '../hooks/useFilters';

const CATEGORIES = [
  'Todos',
  'Eletrônicos',
  'Casa',
  'Moda',
  'Esportes',
  'Beleza',
  'Infantil',
] as const;

export function Home() {
  const {
    products,
    isLoading,
    error,
    pagination,
    currentPage,
    goToPage,
  } = useDeals();

  const { category, sortBy, filteredProducts, setCategory, setSortBy } =
    useFilters(products);

  const handlePageChange = useCallback(
    (page: number) => {
      goToPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [goToPage]
  );

  const handleSearch = useCallback(() => {
    // SearchBar handles debounce internally
  }, []);

  const { results: searchResults, isSearching } = useLiveSearch('');

  const sidebarContent = (
    <Sidebar
      category={category}
      onCategoryChange={setCategory}
      sortBy={sortBy}
      onSortChange={setSortBy}
      resultCount={pagination.total}
    />
  );

  return (
    <PageShell sidebar={sidebarContent}>
      {/* Header area */}
      <div className="mb-6">
        <h2 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-4">
          Ofertas do Dia
        </h2>

        {/* Search + Sort */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            onSearch={handleSearch}
            suggestions={searchResults}
            isSearching={isSearching}
            className="w-full sm:max-w-md"
          />

          {/* Mobile sort */}
          <div className="lg:hidden">
            <SortSelect value={sortBy} onChange={setSortBy} />
          </div>
        </div>

        {/* Mobile categories */}
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 lg:hidden">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => setCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-error-container text-on-error-container text-label-bold">
          {error}
        </div>
      )}

      {/* Product grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <EmptyState message="Nenhuma oferta encontrada para os filtros selecionados." />
      )}

      {/* Pagination */}
      {!isLoading && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
          className="mt-8"
        />
      )}
    </PageShell>
  );
}
