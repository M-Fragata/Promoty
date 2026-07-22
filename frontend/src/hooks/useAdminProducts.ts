import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../services/api';
import type { MlProducts } from '../types/product';
import type { PaginationInfo } from '../types/api';

interface UseAdminProductsReturn {
  products: MlProducts[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  currentPage: number;
  goToPage: (page: number) => void;
  deleteProduct: (id: string) => Promise<void>;
  updateCategory: (id: string, category: string) => Promise<void>;
  refresh: () => void;
}

export function useAdminProducts(
  searchQuery: string = '',
  selectedCategory: string = '',
  selectedStore: string = ''
): UseAdminProductsReturn {
  const [products, setProducts] = useState<MlProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    pageSize: 15,
    total: 0,
    totalPages: 0,
  });

  const prevQueryRef = useRef({ searchQuery, selectedCategory, selectedStore });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const prev = prevQueryRef.current;
    if (
      prev.searchQuery !== searchQuery ||
      prev.selectedCategory !== selectedCategory ||
      prev.selectedStore !== selectedStore
    ) {
      setCurrentPage(1);
      prevQueryRef.current = { searchQuery, selectedCategory, selectedStore };
    }
  }, [searchQuery, selectedCategory, selectedStore]);

  useEffect(() => {
    let cancelled = false;

    async function fetchProducts() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await api.admin.getProducts(
          currentPage,
          searchQuery,
          selectedCategory,
          selectedStore
        );

        if (!cancelled) {
          setProducts(result.products);
          setPagination(result.pagination);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.message || 'Erro ao buscar produtos');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [currentPage, searchQuery, selectedCategory, selectedStore, refreshKey]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  const deleteProduct = useCallback(async (id: string) => {
    await api.admin.deleteProduct(id);
    setRefreshKey(k => k + 1);
  }, []);

  const updateCategory = useCallback(async (id: string, category: string) => {
    await api.admin.updateCategory(id, category);
    setRefreshKey(k => k + 1);
  }, []);

  const refresh = useCallback(() => {
    setRefreshKey(k => k + 1);
  }, []);

  return {
    products,
    isLoading,
    error,
    pagination,
    currentPage,
    goToPage,
    deleteProduct,
    updateCategory,
    refresh,
  };
}
