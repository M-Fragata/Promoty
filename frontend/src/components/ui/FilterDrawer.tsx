import { useState, useEffect } from 'react';
import { X, SlidersHorizontal } from 'lucide-react';
import { FilterChip } from './FilterChip';
import { CATEGORIES, STORES, getStoreInfo } from '../../utils/constants';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCategories: string[];
  selectedStores: string[];
  onApply: (categories: string[], stores: string[]) => void;
}

export function FilterDrawer({
  isOpen,
  onClose,
  selectedCategories,
  selectedStores,
  onApply,
}: FilterDrawerProps) {
  const [tempCategories, setTempCategories] = useState<string[]>(selectedCategories);
  const [tempStores, setTempStores] = useState<string[]>(selectedStores);

  useEffect(() => {
    if (isOpen) {
      setTempCategories(selectedCategories);
      setTempStores(selectedStores);
    }
  }, [isOpen, selectedCategories, selectedStores]);

  const toggleCategory = (cat: string) => {
    if (cat === 'Todos') {
      setTempCategories(['Todos']);
      return;
    }
    setTempCategories((prev) => {
      const next = prev.filter((c) => c !== 'Todos');
      return next.includes(cat)
        ? next.filter((c) => c !== cat)
        : [...next, cat];
    });
  };

  const toggleStore = (store: string) => {
    setTempStores((prev) =>
      prev.includes(store) ? prev.filter((s) => s !== store) : [...prev, store]
    );
  };

  const handleClear = () => {
    setTempCategories([]);
    setTempStores([]);
  };

  const handleApply = () => {
    onApply(tempCategories, tempStores);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm lg:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed top-0 left-0 bottom-0 z-[60] w-[300px] bg-card-bg shadow-[4px_0_20px_rgba(0,0,0,0.15)] animate-slide-in-left lg:hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-card-border">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-5 h-5 text-text-primary" />
            <h2 className="font-label-bold text-label-bold text-text-primary">
              Filtros
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md hover:bg-surface-container-high transition-colors text-text-secondary"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {/* Categories */}
          <div className="mb-6">
            <h3 className="text-label-bold text-text-primary mb-3">Categorias</h3>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((cat) => (
                <FilterChip
                  key={cat}
                  label={cat}
                  selected={tempCategories.includes(cat)}
                  onClick={() => toggleCategory(cat)}
                />
              ))}
            </div>
          </div>

          {/* Stores */}
          <div>
            <h3 className="text-label-bold text-text-primary mb-3">Lojas</h3>
            <div className="flex flex-wrap gap-2">
              {STORES.map((store) => {
                const info = getStoreInfo(store);
                return (
                  <FilterChip
                    key={store}
                    label={info.label}
                    selected={tempStores.includes(store)}
                    onClick={() => toggleStore(store)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-card-border flex gap-3">
          <button
            type="button"
            onClick={handleClear}
            className="flex-1 py-2.5 rounded-xl text-label-bold text-text-secondary border border-card-border hover:bg-surface-container-low transition-colors"
          >
            Limpar
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 py-2.5 rounded-xl text-label-bold text-on-primary bg-text-primary hover:opacity-90 transition-opacity"
          >
            Filtrar
          </button>
        </div>
      </div>
    </>
  );
}
