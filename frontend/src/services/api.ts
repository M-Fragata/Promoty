import type { MlProducts } from '../types/product';
import { MlProductsArraySchema, MlProductsSchema } from '../types/product';
import type { DealsResponse, SearchResponse, PaginationInfo, ApiResponse } from '../types/api';
import { getToken } from '../utils/auth';

const API_BASE_URL = import.meta.env.VITE_API_URL;

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  // Obter token do localStorage
  const token = getToken();

  // Headers padrão
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };

  // Adicionar Authorization se tiver token
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...options,
    headers,
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
  // ============================================
  // DEALS (produtos)
  // ============================================

  async getProductById(id: string): Promise<MlProducts> {
    const response = await fetchJson<ApiResponse<MlProducts>>(`/api/deals/${id}`);
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Produto não encontrado');
    }
    return MlProductsSchema.parse(response.data);
  },

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

  // ============================================
  // AUTH (autenticação)
  // ============================================

  async register(data: { email: string; name: string; password: string }) {
    const response = await fetchJson<{ token: string; user: { id: string; email: string; name: string; avatar: string | null; provider: string } }>(
      '/api/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response;
  },

  async login(data: { email: string; password: string }) {
    const response = await fetchJson<{ token: string; user: { id: string; email: string; name: string; avatar: string | null; provider: string } }>(
      '/api/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
    return response;
  },

  async getMe() {
    const response = await fetchJson<{ user: { id: string; email: string; name: string; avatar: string | null; provider: string; createdAt: string } }>(
      '/api/auth/me'
    );
    return response.user;
  },

  // ============================================
  // FAVORITES (favoritos)
  // ============================================

  async getFavorites(): Promise<MlProducts[]> {
    const response = await fetchJson<{ favorites: MlProducts[] }>('/api/favorites');
    return response.favorites;
  },

  async addFavorite(productId: string) {
    const response = await fetchJson<{ message: string }>(
      `/api/favorites/${productId}`,
      { method: 'POST' }
    );
    return response;
  },

  async removeFavorite(productId: string) {
    const response = await fetchJson<{ message: string }>(
      `/api/favorites/${productId}`,
      { method: 'DELETE' }
    );
    return response;
  },

  async checkFavorite(productId: string): Promise<boolean> {
    const response = await fetchJson<{ isFavorite: boolean }>(
      `/api/favorites/check/${productId}`
    );
    return response.isFavorite;
  },
};

export { API_BASE_URL };
