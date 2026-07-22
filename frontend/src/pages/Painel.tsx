import { useState } from 'react';
import { PageShell } from '../components/layout/PageShell';
import { ProductAdminCard } from '../components/product/ProductAdminCard';
import { ProductSkeleton } from '../components/product/ProductSkeleton';
import { Pagination } from '../components/ui/Pagination';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { AlertCircle } from 'lucide-react';
import { STORES } from '../utils/constants';

const CATEGORIES = ['Todos', 'Eletrônicos', 'Casa', 'Moda', 'Beleza', 'Sem Nicho'];

export function Painel() {
  const [searchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStore, setSelectedStore] = useState('');

  const {
    products,
    isLoading,
    error,
    pagination,
    currentPage,
    goToPage,
    deleteProduct,
    updateCategory,
  } = useAdminProducts(searchQuery, selectedCategory, selectedStore);

  return (
    <PageShell>
      <div className="mb-6">
        <h1 className="text-headline-lg-mobile lg:text-headline-lg font-bold text-text-primary mb-1">
          Painel Administrativo
        </h1>
        <p className="text-body-md text-text-secondary">
          {pagination.total} {pagination.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3">
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat === 'Todos' ? '' : cat)}
              className={`px-3 py-1.5 rounded-full text-label-sm font-medium transition-colors ${
                (cat === 'Todos' && !selectedCategory) || selectedCategory === cat
                  ? 'bg-text-primary text-card-bg'
                  : 'bg-surface-container-low text-text-secondary hover:bg-surface-container'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="h-6 w-px bg-card-border hidden sm:block" />

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStore('')}
            className={`px-3 py-1.5 rounded-full text-label-sm font-medium transition-colors ${
              !selectedStore
                ? 'bg-text-primary text-card-bg'
                : 'bg-surface-container-low text-text-secondary hover:bg-surface-container'
            }`}
          >
            Todas
          </button>
          {STORES.map((store) => (
            <button
              key={store}
              onClick={() => setSelectedStore(store === selectedStore ? '' : store)}
              className={`px-3 py-1.5 rounded-full text-label-sm font-medium transition-colors ${
                selectedStore === store
                  ? 'bg-text-primary text-card-bg'
                  : 'bg-surface-container-low text-text-secondary hover:bg-surface-container'
              }`}
            >
              {store}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-error-container text-on-error-container text-label-bold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductAdminCard
              key={product.id}
              product={product}
              onDelete={deleteProduct}
              onUpdateCategory={updateCategory}
            />
          ))}
        </div>
      ) : (
        <p className="text-body-lg text-text-secondary text-center py-12">
          Nenhum produto encontrado.
        </p>
      )}

      {!isLoading && pagination.totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={pagination.totalPages}
          onPageChange={goToPage}
          className="mt-8"
        />
      )}
    </PageShell>
  );
}
