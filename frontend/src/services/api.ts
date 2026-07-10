import type { MlProducts } from '../types/product';
import { MlProductsArraySchema } from '../types/product';
import type { DealsResponse, SearchResponse, PaginationInfo } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3333';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

interface PaginatedResult {
  products: MlProducts[];
  pagination: PaginationInfo;
}

export const api = {
  async getDeals(page: number = 1): Promise<PaginatedResult> {
    const response = await fetchJson<DealsResponse>(`/api/deals?page=${page}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha ao buscar ofertas');
    }
    const products = MlProductsArraySchema.parse(response.data);
    const pagination = response.pagination ?? { page: 1, pageSize: 12, total: 0, totalPages: 0 };
    return { products, pagination };
  },

  async search(query: string, page: number = 1): Promise<PaginatedResult> {
    const response = await fetchJson<SearchResponse>(
      `/api/search?q=${encodeURIComponent(query)}&page=${page}`
    );
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha na busca');
    }
    const products = MlProductsArraySchema.parse(response.data);
    const pagination = response.pagination ?? { page: 1, pageSize: 12, total: 0, totalPages: 0 };
    return { products, pagination };
  },
};

export { API_BASE_URL };
