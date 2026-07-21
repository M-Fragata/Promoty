import { useState, useCallback } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { PageShell } from '../components/layout/PageShell';
import { Sidebar } from '../components/layout/Sidebar';
import { SearchBar } from '../components/search/SearchBar';
import { ProductCard } from '../components/product/ProductCard';
import { ProductSkeleton } from '../components/product/ProductSkeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { SortSelect } from '../components/ui/SortSelect';
import { FilterDrawer } from '../components/ui/FilterDrawer';
import { Pagination } from '../components/ui/Pagination';
import { useDeals } from '../hooks/useDeals';
import { useFilters } from '../hooks/useFilters';

export function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStores, setSelectedStores] = useState<string[]>([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const {
    products,
    isLoading,
    error,
    pagination,
    currentPage,
    goToPage,
  } = useDeals(searchQuery, selectedCategories, selectedStores);

  const { sortBy, filteredProducts, setSortBy } =
    useFilters(products);

  const handlePageChange = useCallback(
    (page: number) => {
      goToPage(page);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [goToPage]
  );

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleApplyFilters = useCallback((categories: string[], stores: string[]) => {
    setSelectedCategories(categories);
    setSelectedStores(stores);
  }, []);

  const sidebarContent = (
    <Sidebar
      selectedCategories={selectedCategories}
      onCategoriesChange={setSelectedCategories}
      selectedStores={selectedStores}
      onStoresChange={setSelectedStores}
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
          {searchQuery ? `Resultados para "${searchQuery}"` : 'Ofertas do Dia'}
        </h2>

        {/* Search + Sort + Filter button */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <SearchBar
            onSearch={handleSearch}
            className="w-full sm:max-w-md"
          />

          <div className="flex items-center gap-2">
            {/* Mobile filter button */}
            <button
              type="button"
              onClick={() => setIsFilterOpen(true)}
              className="lg:hidden flex items-center gap-2 px-3 py-2 rounded-xl border border-card-border text-text-secondary hover:bg-surface-container-low transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span className="text-label-sm">Filtros</span>
              {(selectedCategories.length > 0 || selectedStores.length > 0) && (
                <span className="w-2 h-2 rounded-full bg-text-primary" />
              )}
            </button>

            {/* Mobile sort */}
            <div className="lg:hidden">
              <SortSelect value={sortBy} onChange={setSortBy} />
            </div>
          </div>
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

      {/* Filter Drawer (mobile) */}
      <FilterDrawer
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        selectedCategories={selectedCategories}
        selectedStores={selectedStores}
        onApply={handleApplyFilters}
      />
    </PageShell>
  );
}
