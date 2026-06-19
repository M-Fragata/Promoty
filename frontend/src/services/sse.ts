import type { MlProducts } from '../types/product';
import { MlProductsSchema } from '../types/product';
import type { LiveSearchEvent } from '../types/api';

type LiveSearchCallbacks = {
  onProduct?: (product: MlProducts) => void;
  onProgress?: (progress: { current: number; total: number; store: string }) => void;
  onComplete?: (products: MlProducts[]) => void;
  onError?: (error: Error) => void;
};

export function connectLiveSearch(
  query: string,
  callbacks: LiveSearchCallbacks
): () => void {
  const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3333'}/api/live-search?q=${encodeURIComponent(query)}`;

  const eventSource = new EventSource(url);
  let accumulatedProducts: MlProducts[] = [];

  eventSource.onopen = () => {
    console.log('[SSE] Conectado para busca:', query);
  };

  eventSource.addEventListener('product', (event) => {
    try {
      const data = JSON.parse(event.data) as LiveSearchEvent;
      if (data.data) {
        const product = MlProductsSchema.parse(data.data);
        accumulatedProducts.push(product);
        callbacks.onProduct?.(product);
      }
    } catch (err) {
      console.warn('[SSE] Produto inválido ignorado:', err);
    }
  });

  eventSource.addEventListener('progress', (event) => {
    try {
      const data = JSON.parse(event.data) as LiveSearchEvent;
      if (data.progress) {
        callbacks.onProgress?.(data.progress);
      }
    } catch (err) {
      console.warn('[SSE] Progresso inválido:', err);
    }
  });

  eventSource.addEventListener('complete', (event) => {
    try {
      const data = JSON.parse(event.data) as LiveSearchEvent;
      if (data.products) {
        const products = data.products.map((p) => MlProductsSchema.parse(p));
        accumulatedProducts = products;
        callbacks.onComplete?.(products);
      } else {
        callbacks.onComplete?.(accumulatedProducts);
      }
      eventSource.close();
    } catch (err) {
      console.warn('[SSE] Complete inválido:', err);
      callbacks.onComplete?.(accumulatedProducts);
      eventSource.close();
    }
  });

  eventSource.addEventListener('error', (event) => {
    try {
      const data = JSON.parse((event as MessageEvent).data) as LiveSearchEvent;
      callbacks.onError?.(new Error(data.message || 'Erro no stream SSE'));
    } catch {
      callbacks.onError?.(new Error('Erro de conexão SSE'));
    }
    eventSource.close();
  });

  eventSource.onerror = () => {
    callbacks.onError?.(new Error('Conexão SSE perdida'));
    eventSource.close();
  };

  return () => {
    eventSource.close();
    console.log('[SSE] Desconectado');
  };
}