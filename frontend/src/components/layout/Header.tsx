
import { ThemeToggle } from './ThemeToggle';

import logo from "../../assets/fragatalogo.png"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-app-bg/95 backdrop-blur supports-[backdrop-filter]:bg-app-bg/80 border-b border-card-border">
      <div className="mx-auto h-full px-4 sm:px-6 lg:px-8 lg:ml-64">
        <div className="flex h-full items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <img className='w-6 h-6 rounded-xl transition: all 0.5s ease hover:scale-105 cursor-pointer' src={logo} alt="" />
            <h1 className="text-headline-md font-bold text-brand tracking-tight">
              Fragata
            </h1>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
