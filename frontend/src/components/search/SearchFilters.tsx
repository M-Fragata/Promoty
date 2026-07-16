import { useState } from 'react';
import { ChevronDown, X, SlidersHorizontal } from 'lucide-react';
import { clsx } from 'clsx';

const DISCOUNT_OPTIONS = [
  { value: 0, label: 'Qualquer desconto' },
  { value: 10, label: 'Mínimo 10%' },
  { value: 20, label: 'Mínimo 20%' },
  { value: 30, label: 'Mínimo 30%' },
  { value: 40, label: 'Mínimo 40%' },
  { value: 50, label: 'Mínimo 50%' },
];

interface SearchFiltersProps {
  minDiscount: number;
  minPrice: number;
  maxPrice: number;
  onMinDiscountChange: (value: number) => void;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  onClear: () => void;
  resultCount: number;
}

export function SearchFilters({
  minDiscount,
  minPrice,
  maxPrice,
  onMinDiscountChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
  resultCount,
}: SearchFiltersProps) {
  const [isAccordionOpen, setIsAccordionOpen] = useState(false);

  const hasActiveFilters = minDiscount > 0 || minPrice > 0 || maxPrice > 0;

  const activeFilterCount = [minDiscount > 0, minPrice > 0, maxPrice > 0].filter(Boolean).length;

  return (
    <>
      {/* Desktop: Sidebar */}
      <div className="hidden lg:flex lg:flex-col lg:gap-6">
        <FilterContent
          minDiscount={minDiscount}
          minPrice={minPrice}
          maxPrice={maxPrice}
          onMinDiscountChange={onMinDiscountChange}
          onMinPriceChange={onMinPriceChange}
          onMaxPriceChange={onMaxPriceChange}
          onClear={onClear}
          resultCount={resultCount}
          hasActiveFilters={hasActiveFilters}
        />
      </div>

      {/* Mobile: Accordion */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          className={clsx(
            'cursor-pointer flex items-center justify-between w-full px-4 py-3 rounded-xl border transition-colors',
            isAccordionOpen || hasActiveFilters
              ? 'bg-surface-container-low border-brand/30 text-brand'
              : 'bg-card-bg border-card-border text-text-primary'
          )}
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4" />
            <span className="font-medium text-label-bold">Filtros</span>
            {activeFilterCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-brand text-brand-on text-xs font-bold">
                {activeFilterCount}
              </span>
            )}
          </div>
          <ChevronDown
            className={clsx(
              'w-4 h-4 transition-transform duration-200',
              isAccordionOpen && 'rotate-180'
            )}
          />
        </button>

        {isAccordionOpen && (
          <div className="mt-2 p-4 bg-card-bg border border-card-border rounded-xl">
            <FilterContent
              minDiscount={minDiscount}
              minPrice={minPrice}
              maxPrice={maxPrice}
              onMinDiscountChange={onMinDiscountChange}
              onMinPriceChange={onMinPriceChange}
              onMaxPriceChange={onMaxPriceChange}
              onClear={onClear}
              resultCount={resultCount}
              hasActiveFilters={hasActiveFilters}
            />
          </div>
        )}
      </div>
    </>
  );
}

interface FilterContentProps {
  minDiscount: number;
  minPrice: number;
  maxPrice: number;
  onMinDiscountChange: (value: number) => void;
  onMinPriceChange: (value: number) => void;
  onMaxPriceChange: (value: number) => void;
  onClear: () => void;
  resultCount: number;
  hasActiveFilters: boolean;
}

function FilterContent({
  minDiscount,
  minPrice,
  maxPrice,
  onMinDiscountChange,
  onMinPriceChange,
  onMaxPriceChange,
  onClear,
  resultCount,
  hasActiveFilters,
}: FilterContentProps) {
  return (
    <div className="flex flex-col gap-4">
      {/* Result count */}
      <div>
        <p className="text-label-sm text-text-secondary">
          <span className="font-semibold text-text-primary">{resultCount}</span>{' '}
          {resultCount === 1 ? 'resultado' : 'resultados'}
        </p>
      </div>

      {/* Discount filter */}
      <div>
        <label className="text-label-bold text-text-primary mb-2 block">
          Desconto mínimo
        </label>
        <select
          value={minDiscount}
          onChange={(e) => onMinDiscountChange(Number(e.target.value))}
          className="w-full px-3 py-2 bg-card-bg border border-card-border rounded-lg text-text-primary text-body-md focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand cursor-pointer"
        >
          {DISCOUNT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Price filters */}
      <div>
        <label className="text-label-bold text-text-primary mb-2 block">
          Faixa de preço
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
              R$
            </span>
            <input
              type="number"
              value={minPrice || ''}
              onChange={(e) => onMinPriceChange(Number(e.target.value))}
              placeholder="Mín"
              min={0}
              className="w-full h-10 pl-8 pr-3 rounded-lg bg-card-bg border border-card-border text-text-primary text-body-md placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>
          <span className="text-text-secondary">—</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
              R$
            </span>
            <input
              type="number"
              value={maxPrice || ''}
              onChange={(e) => onMaxPriceChange(Number(e.target.value))}
              placeholder="Máx"
              min={0}
              className="w-full h-10 pl-8 pr-3 rounded-lg bg-card-bg border border-card-border text-text-primary text-body-md placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
            />
          </div>
        </div>
      </div>

      {/* Clear button */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={onClear}
          className={clsx(
            'cursor-pointer flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors',
            'text-brand hover:bg-brand/10'
          )}
        >
          <X className="w-4 h-4" />
          Limpar filtros
        </button>
      )}
    </div>
  );
}
