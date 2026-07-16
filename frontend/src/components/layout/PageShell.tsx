import { useState } from 'react';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';
import { Header } from './Header';
import { MobileNav } from './MobileNav';
import { WhatsAppDrawer } from '../ui/WhatsAppFloat';

interface PageShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function PageShell({ children, sidebar }: PageShellProps) {
  const [isWhatsAppOpen, setIsWhatsAppOpen] = useState(false);

  return (
    <div className="min-h-screen bg-app-bg text-text-primary transition-colors duration-300">
      <Header onToggleWhatsApp={() => setIsWhatsAppOpen(true)} />

      <div className="flex overflow-hidden">
        {/* Sidebar — desktop only */}
        {sidebar && (
          <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:top-16 lg:bottom-0 lg:border-r lg:border-card-border lg:bg-card-bg lg:p-4 lg:overflow-y-auto">
            {sidebar}
          </aside>
        )}

        {/* Main content */}
        <main
          className={clsx(
            'flex-1 min-w-0 pt-16 pb-20 lg:pb-8',
            sidebar ? 'lg:ml-64' : ''
          )}
        >
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
              {children}
            </div>
          </div>
        </main>
      </div>

      {/* Mobile bottom nav */}
      <MobileNav />

      {/* WhatsApp Drawer */}
      <WhatsAppDrawer isOpen={isWhatsAppOpen} onClose={() => setIsWhatsAppOpen(false)} />
    </div>
  );
}
