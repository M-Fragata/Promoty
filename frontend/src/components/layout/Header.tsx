import { ShoppingBag } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-app-bg/95 backdrop-blur supports-[backdrop-filter]:bg-app-bg/80 border-b border-app-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-brand-color" aria-hidden="true" />
            <h1 className="text-xl font-bold text-brand-color">Promoty</h1>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}