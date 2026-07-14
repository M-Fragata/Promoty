import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme } = useTheme();

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    if (theme === 'system') {
      return <Monitor className="w-5 h-5" aria-hidden="true" />;
    }
    return resolvedTheme === 'light' ? (
      <Moon className="w-5 h-5" aria-hidden="true" />
    ) : (
      <Sun className="w-5 h-5" aria-hidden="true" />
    );
  };

  const getLabel = () => {
    if (theme === 'system') return 'Tema padrão';
    return resolvedTheme === 'light' ? 'Modo escuro' : 'Modo claro';
  };

  return (
    <button
      onClick={cycleTheme}
      className="relative p-2 rounded-md bg-surface-container text-text-secondary hover:bg-surface-container-high hover:text-text-primary transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:ring-offset-2 focus:ring-offset-app-bg"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
      <span className="sr-only">{getLabel()}</span>
    </button>
  );
}
