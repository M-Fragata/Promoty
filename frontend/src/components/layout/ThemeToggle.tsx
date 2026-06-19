import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-lg bg-card-bg border border-app-border text-text-primary hover:bg-app-border transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-brand-color focus:ring-offset-2 focus:ring-offset-app-bg"
      aria-label={theme === 'light' ? 'Alternar para modo escuro' : 'Alternar para modo claro'}
      title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-brand-color" aria-hidden="true" />
      ) : (
        <Sun className="w-5 h-5 text-brand-color" aria-hidden="true" />
      )}
      <span className="sr-only">
        {theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      </span>
    </button>
  );
}