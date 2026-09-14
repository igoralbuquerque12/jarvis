import type { ReactNode } from 'react';
import { SettingsNav } from './components/settings-nav';

export function SettingsShell({ children }: { children: ReactNode }) {
  return (
    <>
      <SettingsNav />
      {children}
    </>
  );
}
