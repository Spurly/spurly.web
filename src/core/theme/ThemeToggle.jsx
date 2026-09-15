import { Moon, Sun, MonitorSmartphone } from 'lucide-react';
import { useTheme } from './useTheme.js';

const VIEW = {
  light:  { Icon: Sun,               label: 'Light',  next: 'Switch to dark' },
  dark:   { Icon: Moon,              label: 'Dark',   next: 'Switch to system' },
  system: { Icon: MonitorSmartphone, label: 'System', next: 'Switch to light' },
};

/**
 * Cycles light -> dark -> system.
 *
 * Three states, not two, because "follow my OS" is a real preference
 * and a two-way switch silently takes it away the first time you
 * touch it. The icon reports the CHOICE, not the resolved theme —
 * a user on 'system' at night wants to see that they are on system,
 * not be told they picked dark.
 */
export function ThemeToggle({ expanded = true, className = '' }) {
  const { theme, toggle } = useTheme();
  const view = VIEW[theme] ?? VIEW.system;
  const { Icon } = view;

  return (
    <button
      type="button"
      onClick={toggle}
      title={view.next}
      aria-label={`Theme: ${view.label}. ${view.next}.`}
      className={[
        'flex items-center gap-2 h-7 rounded-[var(--ui-radius-sm)]',
        'text-[var(--ui-t-label)] text-[var(--ui-text-tertiary)]',
        'hover:bg-[var(--ui-surface-rail-hover)] hover:text-[var(--ui-text-primary)]',
        'transition-colors duration-[var(--ui-dur-fast)]',
        'focus:outline-none focus-visible:shadow-[var(--ui-focus-ring)]',
        expanded ? 'px-2' : 'w-7 justify-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <Icon size={14} className="shrink-0" aria-hidden="true" />
      {expanded && <span>{view.label}</span>}
    </button>
  );
}
