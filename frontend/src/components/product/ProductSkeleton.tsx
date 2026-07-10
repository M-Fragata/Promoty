import { clsx } from 'clsx';

interface ProductSkeletonProps {
  className?: string;
}

export function ProductSkeleton({ className }: ProductSkeletonProps) {
  return (
    <div
      className={clsx(
        'flex flex-col gap-3 rounded-lg bg-card-bg border border-card-border p-3',
        className
      )}
    >
      {/* Image */}
      <div className="aspect-square rounded-lg bg-surface-container animate-pulse" />

      {/* Title */}
      <div className="flex flex-col gap-1.5">
        <div className="h-4 w-full rounded bg-surface-container animate-pulse" />
        <div className="h-4 w-3/4 rounded bg-surface-container animate-pulse" />
      </div>

      {/* Store tag */}
      <div className="flex gap-2">
        <div className="h-5 w-20 rounded-full bg-surface-container animate-pulse" />
      </div>

      {/* Price */}
      <div className="flex flex-col gap-1">
        <div className="h-5 w-24 rounded bg-surface-container animate-pulse" />
        <div className="h-3 w-16 rounded bg-surface-container animate-pulse" />
      </div>

      {/* Button */}
      <div className="h-8 w-full rounded-md bg-surface-container animate-pulse" />
    </div>
  );
}
