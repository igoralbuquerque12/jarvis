import { useTheme } from '../../lib/theme';
import { IconButton } from './button';
import { IconMoon, IconSun } from './icons';

/** Switches between the black and the cream theme; the choice is remembered. */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro';

  return (
    <IconButton label={label} onClick={toggle} className={className}>
      {theme === 'dark' ? <IconSun /> : <IconMoon />}
    </IconButton>
  );
}
