import { clsx } from 'clsx';
import { CategoryChip } from '../ui/CategoryChip';
import { SortSelect } from '../ui/SortSelect';
import { CATEGORIES, type CategoryOption, type SortOption } from '../../utils/constants';

interface SidebarProps {
  category: CategoryOption;
  onCategoryChange: (category: CategoryOption) => void;
  sortBy: SortOption;
  onSortChange: (sortBy: SortOption) => void;
  resultCount: number;
  className?: string;
}

export function Sidebar({
  category,
  onCategoryChange,
  sortBy,
  onSortChange,
  resultCount,
  className,
}: SidebarProps) {
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
        <div className="flex flex-col gap-1.5">
          {CATEGORIES.map((cat) => (
            <CategoryChip
              key={cat}
              label={cat}
              active={category === cat}
              onClick={() => onCategoryChange(cat)}
            />
          ))}
        </div>
      </div>

      {/* Sort */}
      <div>
        <h2 className="text-label-bold text-text-primary mb-3">Ordenar</h2>
        <SortSelect value={sortBy} onChange={onSortChange} />
      </div>
    </div>
  );
}
