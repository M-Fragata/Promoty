import { clsx } from 'clsx';
import { PageShell } from '../layout/PageShell';

export function ProductDetailSkeleton() {
  return (
    <PageShell>
      {/* Back button skeleton */}
      <div className="flex items-center gap-2 mb-6">
        <div className="h-4 w-12 rounded bg-surface-container animate-pulse" />
        <div className="h-4 w-1 rounded bg-surface-container animate-pulse" />
        <div className="h-3 w-24 rounded bg-surface-container animate-pulse" />
      </div>

      {/* Hero Section skeleton */}
      <section className="flex flex-col md:flex-row gap-stack-lg bg-card-bg rounded-xl p-4 md:p-6 shadow-[0_4px_12px_rgba(0,0,0,0.04)] mb-stack-lg">
        {/* Product Image skeleton */}
        <div className="w-full md:w-1/2 lg:w-2/5 aspect-square rounded-lg bg-surface-container animate-pulse" />

        {/* Product Details skeleton */}
        <div className="w-full md:w-1/2 lg:w-3/5 flex flex-col">
          {/* Title */}
          <div className="mb-4 flex flex-col gap-2">
            <div className="h-6 w-full rounded bg-surface-container animate-pulse" />
            <div className="h-6 w-3/4 rounded bg-surface-container animate-pulse" />
          </div>

          {/* Price Block */}
          <div className="bg-surface-container-lowest p-5 rounded-lg border border-card-border mb-6">
            <div className="flex flex-col gap-2">
              <div className="h-4 w-20 rounded bg-surface-container animate-pulse" />
              <div className="h-10 w-32 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-24 rounded bg-surface-container animate-pulse" />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-auto pt-4 border-t border-card-border flex gap-3">
            <div className="flex-1 h-12 rounded-lg bg-surface-container animate-pulse" />
            <div className="h-12 w-12 rounded-lg bg-surface-container animate-pulse" />
          </div>
        </div>
      </section>

      {/* Related Products skeleton */}
      <div className="py-stack-lg">
        <div className="mb-stack-md flex items-center justify-between">
          <div className="h-5 w-40 rounded bg-surface-container animate-pulse" />
        </div>
        <div
          className={clsx(
            'flex gap-4 overflow-x-auto no-scrollbar pb-4 snap-x snap-mandatory',
            'lg:grid lg:grid-cols-5 lg:overflow-x-visible lg:snap-none'
          )}
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={clsx(
                'min-w-[170px] w-[170px] lg:min-w-0 lg:w-full',
                'flex-shrink-0 snap-start',
                'bg-card-bg rounded-xl border border-card-border flex flex-col overflow-hidden'
              )}
            >
              {/* Image */}
              <div className="relative h-32 bg-surface-container animate-pulse" />

              {/* Info */}
              <div className="p-3 flex flex-col gap-1 grow">
                <div className="flex flex-col gap-1">
                  <div className="h-3 w-full rounded bg-surface-container animate-pulse" />
                  <div className="h-3 w-3/4 rounded bg-surface-container animate-pulse" />
                </div>

                <div className="mt-auto pt-2 flex flex-col gap-1">
                  <div className="h-3 w-16 rounded bg-surface-container animate-pulse" />
                  <div className="h-4 w-20 rounded bg-surface-container animate-pulse" />
                </div>

                <div className="mt-2 h-8 w-full rounded-lg bg-surface-container animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
