import type { MlProducts } from '../types/product';
import { MlProductsArraySchema } from '../types/product';
import type { DealsResponse, SearchResponse } from '../types/api';

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

export const api = {
  async getDeals(): Promise<MlProducts[]> {
    const response = await fetchJson<DealsResponse>('/api/deals');
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha ao buscar ofertas');
    }
    return MlProductsArraySchema.parse(response.data);
  },

  async search(query: string): Promise<MlProducts[]> {
    const response = await fetchJson<SearchResponse>(`/api/search?q=${encodeURIComponent(query)}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Falha na busca');
    }
    return MlProductsArraySchema.parse(response.data);
  },
};

export { API_BASE_URL };