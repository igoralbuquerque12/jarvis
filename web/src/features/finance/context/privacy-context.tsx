import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { PrivacyContext } from './privacy-store';

const STORAGE_KEY = 'jarvis.privacy.hidden';

function readStored(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * "Hide amounts" switch shared by every screen that shows money.
 * Mounted once in the app shell so the choice follows the user across pages.
 */
export function PrivacyProvider({ children }: { children: ReactNode }) {
  const [hidden, setHidden] = useState(readStored);
  const toggle = useCallback(() => setHidden((current) => !current), []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, hidden ? '1' : '0');
    } catch {
      // storage unavailable — keep in-memory state only
    }
  }, [hidden]);

  const value = useMemo(() => ({ hidden, toggle }), [hidden, toggle]);

  return (
    <PrivacyContext.Provider value={value}>{children}</PrivacyContext.Provider>
  );
}
