import type { MlProducts } from './product';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface DealsResponse extends ApiResponse<MlProducts[]> {
  pagination?: PaginationInfo;
}

export interface SearchResponse extends ApiResponse<MlProducts[]> {
  pagination?: PaginationInfo;
}

export interface LiveSearchEvent {
  type: 'product' | 'progress' | 'complete' | 'error';
  data?: MlProducts;
  products?: MlProducts[];
  message?: string;
  progress?: {
    current: number;
    total: number;
    store: string;
  };
}