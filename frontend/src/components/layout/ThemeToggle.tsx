import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative p-2 rounded-md bg-surface-container text-text-secondary hover:bg-surface-container-high hover:text-text-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-app-bg"
      aria-label={theme === 'light' ? 'Alternar para modo escuro' : 'Alternar para modo claro'}
      title={theme === 'light' ? 'Modo escuro' : 'Modo claro'}
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5" aria-hidden="true" />
      ) : (
        <Sun className="w-5 h-5" aria-hidden="true" />
      )}
      <span className="sr-only">
        {theme === 'light' ? 'Ativar modo escuro' : 'Ativar modo claro'}
      </span>
    </button>
  );
}
