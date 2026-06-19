import type { MlProducts } from './product';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DealsResponse extends ApiResponse<MlProducts[]> {}

export interface SearchResponse extends ApiResponse<MlProducts[]> {}

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