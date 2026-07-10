import { useState, useEffect, useRef } from 'react';
import { connectLiveSearch } from '../services/sse';
import type { MlProducts } from '../types/product';

interface UseLiveSearchReturn {
  results: MlProducts[];
  isSearching: boolean;
  progress: { current: number; total: number; store: string } | null;
  error: string | null;
}

export function useLiveSearch(query: string): UseLiveSearchReturn {
  const [results, setResults] = useState<MlProducts[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number; store: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Cleanup previous connection
    cleanupRef.current?.();
    cleanupRef.current = null;

    if (!query.trim()) {
      setResults([]);
      setIsSearching(false);
      setProgress(null);
      setError(null);
      return;
    }

    setIsSearching(true);
    setResults([]);
    setProgress(null);
    setError(null);

    const cleanup = connectLiveSearch(query, {
      onProduct: (product) => {
        setResults((prev) => [...prev, product]);
      },
      onProgress: (p) => {
        setProgress(p);
      },
      onComplete: (products) => {
        setResults(products);
        setIsSearching(false);
        setProgress(null);
      },
      onError: (err) => {
        setError(err.message);
        setIsSearching(false);
        setProgress(null);
      },
    });

    cleanupRef.current = cleanup;

    return () => {
      cleanup();
      cleanupRef.current = null;
    };
  }, [query]);

  return { results, isSearching, progress, error };
}
