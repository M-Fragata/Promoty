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

export function useDeals(searchQuery: string = ''): UseDealsReturn {
  const [products, setProducts] = useState<MlProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);

  // Reset to page 1 when search query changes
  const prevQueryRef = useRef(searchQuery);
  useEffect(() => {
    if (prevQueryRef.current !== searchQuery) {
      prevQueryRef.current = searchQuery;
      setCurrentPage(1);
    }
  }, [searchQuery]);

  const fetchData = useCallback(async (page: number, query: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = query.trim()
        ? await api.search(query, page)
        : await api.getDeals(page);
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar ofertas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(currentPage, searchQuery);
  }, [currentPage, searchQuery, fetchData]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return { products, isLoading, error, pagination, currentPage, goToPage };
}
