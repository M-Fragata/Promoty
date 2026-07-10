import { useState, useEffect, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import { Search, X, Loader2 } from 'lucide-react';
import { clsx } from 'clsx';
import { SearchSuggestions } from './SearchSuggestions';
import type { MlProducts } from '../../types/product';

interface SearchBarProps {
  onSearch: (query: string) => void;
  suggestions?: MlProducts[];
  isSearching?: boolean;
  className?: string;
}

export function SearchBar({
  onSearch,
  suggestions = [],
  isSearching = false,
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounce — emit search after 2 seconds of no typing
  useEffect(() => {
    if (!query.trim()) {
      onSearch('');
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(() => {
      onSearch(query.trim());
      setIsOpen(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [query, onSearch]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
  }

  function handleClear() {
    setQuery('');
    setIsOpen(false);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  }

  function handleSelectSuggestion(title: string) {
    setQuery(title);
    setIsOpen(false);
    onSearch(title);
  }

  return (
    <div ref={containerRef} className={clsx('relative', className)}>
      <div className="relative flex items-center">
        <Search
          className="absolute left-3 w-4 h-4 text-text-secondary pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Buscar ofertas..."
          className={clsx(
            'w-full h-10 pl-9 pr-9 rounded-md',
            'bg-surface-container text-text-primary text-body-md placeholder:text-text-secondary',
            'border border-outline-variant',
            'focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand',
            'transition-colors duration-150'
          )}
          aria-label="Buscar ofertas"
          aria-autocomplete="list"
          aria-expanded={isOpen && suggestions.length > 0}
        />

        {/* Loading indicator or clear button */}
        <div className="absolute right-3">
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-text-secondary animate-spin" aria-hidden="true" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full text-text-secondary hover:text-text-primary hover:bg-surface-container-high transition-colors duration-150"
              aria-label="Limpar busca"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <SearchSuggestions
          results={suggestions}
          onSelect={handleSelectSuggestion}
        />
      )}
    </div>
  );
}
