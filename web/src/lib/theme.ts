import { useSyncExternalStore } from 'react';

export type Theme = 'light' | 'dark';

/** Same key the pre-paint script in index.html reads. */
const STORAGE_KEY = 'jarvis-theme';

const darkQuery =
  typeof window !== 'undefined'
    ? window.matchMedia('(prefers-color-scheme: dark)')
    : null;

function readStored(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null;
  }
}

/** The theme on screen: the stored choice, else the OS preference. */
function resolveTheme(): Theme {
  return readStored() ?? (darkQuery?.matches ? 'dark' : 'light');
}

const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  darkQuery?.addEventListener('change', listener);
  return () => {
    listeners.delete(listener);
    darkQuery?.removeEventListener('change', listener);
  };
}

/** Pins the theme: stored, applied as `data-theme` on <html>. */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // private mode / blocked storage: still apply for this visit
  }
  const apply = () => {
    document.documentElement.dataset.theme = theme;
    emit();
  };

  // Crossfade the whole page where supported; reduced motion swaps instantly.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && typeof document.startViewTransition === 'function') {
    document.startViewTransition(apply);
  } else {
    apply();
  }
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, resolveTheme, () => 'light' as Theme);
  return {
    theme,
    toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
  };
}
