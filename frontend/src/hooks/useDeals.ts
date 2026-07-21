import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../services/api';
import type { MlProducts } from '../types/product';
import type { PaginationInfo } from '../types/api';

interface UseDealsReturn {
  products: MlProducts[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo;
  currentPage: number;
  goToPage: (page: number) => void;
}

const DEFAULT_PAGINATION: PaginationInfo = {
  page: 1,
  pageSize: 12,
  total: 0,
  totalPages: 0,
};

export function useDeals(
  searchQuery: string = '',
  categories: string[] = [],
  stores: string[] = []
): UseDealsReturn {
  const [products, setProducts] = useState<MlProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);

  const prevQueryRef = useRef(searchQuery);
  const prevCategoriesRef = useRef(categories);
  const prevStoresRef = useRef(stores);

  useEffect(() => {
    const queryChanged = prevQueryRef.current !== searchQuery;
    const categoriesChanged = JSON.stringify(prevCategoriesRef.current) !== JSON.stringify(categories);
    const storesChanged = JSON.stringify(prevStoresRef.current) !== JSON.stringify(stores);
    prevQueryRef.current = searchQuery;
    prevCategoriesRef.current = categories;
    prevStoresRef.current = stores;
    if (queryChanged || categoriesChanged || storesChanged) {
      setCurrentPage(1);
    }
  }, [searchQuery, categories, stores]);

  const fetchData = useCallback(async (page: number, query: string, cats: string[], str: string[]) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = query.trim()
        ? await api.search(query, page, cats, str)
        : await api.getDeals(page, cats, str);
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar ofertas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage, searchQuery, categories, stores);
  }, [currentPage, searchQuery, categories, stores, fetchData]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return { products, isLoading, error, pagination, currentPage, goToPage };
}
