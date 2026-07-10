import { useState, useEffect, useCallback } from 'react';
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

export function useDeals(): UseDealsReturn {
  const [products, setProducts] = useState<MlProducts[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>(DEFAULT_PAGINATION);

  const fetchDeals = useCallback(async (page: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await api.getDeals(page);
      setProducts(result.products);
      setPagination(result.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao buscar ofertas');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDeals(currentPage);
  }, [currentPage, fetchDeals]);

  const goToPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  return { products, isLoading, error, pagination, currentPage, goToPage };
}
