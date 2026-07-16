import { PageShell } from '../layout/PageShell';

export function ProfileSkeleton() {
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        {/* Avatar skeleton */}
        <section className="flex flex-col items-center justify-center py-6 gap-4 mb-6">
          <div className="w-32 h-32 rounded-full bg-surface-container animate-pulse ring-4 ring-surface-container-lowest shadow-sm" />
        </section>

        {/* User Info Card skeleton */}
        <section className="bg-card-bg rounded-xl shadow-sm border border-card-border overflow-hidden flex flex-col mb-6">
          <div className="flex items-center justify-between p-4">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-12 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-32 rounded bg-surface-container animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-card-border">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-12 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-48 rounded bg-surface-container animate-pulse" />
            </div>
          </div>
          <div className="flex items-center justify-between p-4 bg-surface-container-low/30 border-t border-card-border">
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-28 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-36 rounded bg-surface-container animate-pulse" />
            </div>
          </div>
        </section>

        {/* Activity Section skeleton */}
        <section className="flex flex-col gap-3 mb-6">
          <div className="h-4 w-20 rounded bg-surface-container animate-pulse ml-2" />
          <div className="grid grid-cols-2 gap-4">
            {/* Links Card */}
            <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col items-start gap-2 shadow-sm">
              <div className="p-3 bg-surface-container-lowest rounded-full shadow-sm mb-2">
                <div className="w-5 h-5 rounded bg-surface-container animate-pulse" />
              </div>
              <div className="h-6 w-12 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-24 rounded bg-surface-container animate-pulse" />
            </div>

            {/* Favorites Card */}
            <div className="bg-card-bg border border-card-border rounded-xl p-5 flex flex-col items-start gap-2 shadow-sm">
              <div className="p-3 bg-surface-container-lowest rounded-full shadow-sm mb-2">
                <div className="w-5 h-5 rounded bg-surface-container animate-pulse" />
              </div>
              <div className="h-6 w-12 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-20 rounded bg-surface-container animate-pulse" />
            </div>
          </div>
        </section>

        {/* Settings Section skeleton */}
        <section className="flex flex-col gap-3 mb-6">
          <div className="h-4 w-28 rounded bg-surface-container animate-pulse ml-2" />
          <div className="bg-card-bg rounded-xl shadow-sm border border-card-border overflow-hidden flex flex-col">
            {/* Theme skeleton */}
            <div className="p-4 border-b border-card-border">
              <div className="h-3 w-12 rounded bg-surface-container animate-pulse mb-3" />
              <div className="grid grid-cols-3 gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-card-border"
                  >
                    <div className="w-5 h-5 rounded bg-surface-container animate-pulse" />
                    <div className="h-3 w-12 rounded bg-surface-container animate-pulse" />
                  </div>
                ))}
              </div>
            </div>

            {/* Logout skeleton */}
            <div className="flex items-center gap-4 p-4">
              <div className="w-5 h-5 rounded bg-surface-container animate-pulse" />
              <div className="h-4 w-8 rounded bg-surface-container animate-pulse" />
            </div>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
