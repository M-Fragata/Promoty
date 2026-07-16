import { ChevronLeft, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

function getDesktopPages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  pages.push(1);

  if (current > 3) {
    pages.push('ellipsis');
  }

  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (current < total - 2) {
    pages.push('ellipsis');
  }

  pages.push(total);

  return pages;
}

function getMobilePages(current: number, total: number): (number | 'ellipsis')[] {
  if (total <= 3) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | 'ellipsis')[] = [];

  // Always first
  pages.push(1);

  // Current if not first or last
  if (current !== 1 && current !== total) {
    if (current > 2) {
      pages.push('ellipsis');
    }
    pages.push(current);
    if (current < total - 1) {
      pages.push('ellipsis');
    }
  } else if (current === 1 && total > 3) {
    pages.push('ellipsis');
  } else if (current === total && total > 3) {
    pages.push('ellipsis');
  }

  // Always last
  pages.push(total);

  return pages;
}

const arrowBtn = clsx(
  'inline-flex items-center justify-center w-10 h-10 rounded-lg text-label-bold transition-colors duration-150'
);

const arrowDisabled = clsx(
  arrowBtn,
  'bg-surface-container border border-card-border text-text-secondary opacity-50 cursor-not-allowed'
);

const arrowEnabled = clsx(
  arrowBtn,
  'bg-card-bg border border-card-border text-text-primary hover:bg-surface-container active:bg-surface-container-high'
);

const pageBtn = clsx(
  'inline-flex items-center justify-center w-10 h-10 rounded-lg text-label-bold transition-colors duration-150'
);

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const desktopPages = getDesktopPages(currentPage, totalPages);
  const mobilePages = getMobilePages(currentPage, totalPages);
  const isFirst = currentPage === 1;
  const isLast = currentPage === totalPages;

  return (
    <nav
      className={clsx('flex items-center justify-center gap-2 overflow-x-auto', className)}
      aria-label="Paginação"
    >
      {/* Desktop */}
      <div className="hidden sm:flex items-center justify-center gap-2">
        {/* Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          className={clsx(
            'cursor-pointer inline-flex items-center gap-1 px-3 py-2 rounded-lg text-label-bold transition-colors duration-150',
            isFirst
              ? 'bg-surface-container text-text-secondary opacity-50 cursor-not-allowed'
              : 'bg-card-bg border border-card-border text-text-primary hover:bg-surface-container active:bg-surface-container-high'
          )}
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          Anterior
        </button>

        {/* Page numbers */}
        {desktopPages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-2 py-2 text-text-secondary"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={clsx('cursor-pointer',
                pageBtn,
                page === currentPage
                  ? 'bg-brand text-brand-on'
                  : 'bg-card-bg border border-card-border text-text-primary hover:bg-surface-container active:bg-surface-container-high'
              )}
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Próximo */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          className={clsx(
            'cursor-pointer inline-flex items-center gap-1 px-3 py-2 rounded-lg text-label-bold transition-colors duration-150',
            isLast
              ? 'bg-surface-container text-text-secondary opacity-50 cursor-not-allowed'
              : 'bg-card-bg border border-card-border text-text-primary hover:bg-surface-container active:bg-surface-container-high'
          )}
        >
          Próximo
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>

      {/* Mobile */}
      <div className="flex sm:hidden items-center justify-center gap-2">
        {/* Anterior */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={isFirst}
          className={isFirst ? arrowDisabled : arrowEnabled}
          aria-label="Página anterior"
        >
          <ChevronLeft className="w-4 h-4" aria-hidden="true" />
        </button>

        {/* Page numbers */}
        {mobilePages.map((page, index) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1 py-2 text-text-secondary"
              aria-hidden="true"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={clsx(
                pageBtn,
                page === currentPage
                  ? 'bg-brand text-brand-on'
                  : 'bg-card-bg border border-card-border text-text-primary hover:bg-surface-container active:bg-surface-container-high'
              )}
              aria-label={`Página ${page}`}
              aria-current={page === currentPage ? 'page' : undefined}
            >
              {page}
            </button>
          )
        )}

        {/* Próximo */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={isLast}
          className={isLast ? arrowDisabled : arrowEnabled}
          aria-label="Próxima página"
        >
          <ChevronRight className="w-4 h-4" aria-hidden="true" />
        </button>
      </div>
    </nav>
  );
}
