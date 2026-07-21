import { MessageCircle } from 'lucide-react';
import { clsx } from 'clsx';
import { FilterChip } from '../ui/FilterChip';
import { SortSelect } from '../ui/SortSelect';
import { CATEGORIES, STORES, getStoreInfo, WHATSAPP_GROUPS, type SortOption } from '../../utils/constants';

interface SidebarProps {
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
  selectedStores: string[];
  onStoresChange: (stores: string[]) => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  resultCount: number;
  className?: string;
}

export function Sidebar({
  selectedCategories,
  onCategoriesChange,
  selectedStores,
  onStoresChange,
  sortBy,
  onSortChange,
  resultCount,
  className,
}: SidebarProps) {
  const toggleCategory = (cat: string) => {
    if (cat === 'Todos') {
      onCategoriesChange(['Todos']);
      return;
    }
    const next = selectedCategories.filter((c) => c !== 'Todos');
    onCategoriesChange(
      next.includes(cat)
        ? next.filter((c) => c !== cat)
        : [...next, cat]
    );
  };

  const toggleStore = (store: string) => {
    onStoresChange(
      selectedStores.includes(store)
        ? selectedStores.filter((s) => s !== store)
        : [...selectedStores, store]
    );
  };

  return (
    <div className={clsx('flex flex-col gap-6', className)}>
      {/* Result count */}
      <div>
        <p className="text-label-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{resultCount}</span>{' '}
          {resultCount === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      {/* Categories */}
      <div>
        <h2 className="text-label-bold text-text-primary mb-3">Categorias</h2>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((cat) => (
            <FilterChip
              key={cat}
              label={cat}
              selected={selectedCategories.includes(cat)}
              onClick={() => toggleCategory(cat)}
            />
          ))}
        </div>
      </div>

      {/* Stores */}
      <div>
        <h2 className="text-label-bold text-text-primary mb-3">Lojas</h2>
        <div className="flex flex-wrap gap-2">
          {STORES.map((store) => {
            const info = getStoreInfo(store);
            return (
              <FilterChip
                key={store}
                label={info.label}
                selected={selectedStores.includes(store)}
                onClick={() => toggleStore(store)}
              />
            );
          })}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h2 className="text-label-bold text-text-primary mb-3">Ordenar</h2>
        <SortSelect value={sortBy} onChange={onSortChange} />
      </div>

      {/* WhatsApp Groups */}
      {WHATSAPP_GROUPS.length > 0 && (
        <div>
          <h2 className="text-label-bold text-text-primary mb-3">Nossos Grupos</h2>
          <div className="flex flex-col gap-2">
            {WHATSAPP_GROUPS.map((group) => (
              <a
                key={group.name}
                href={group.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-label-sm text-brand hover:underline transition-colors"
              >
                <MessageCircle className="w-4 h-4 shrink-0" />
                {group.name}
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
