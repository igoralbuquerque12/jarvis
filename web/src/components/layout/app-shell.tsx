import type { ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { authClient } from '../../lib/auth-client';
import { Wordmark } from '../ui/wordmark';

function GridIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

function LayersIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l9 5-9 5-9-5 9-5z" />
      <path d="M3 13l9 5 9-5" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c1.5-3.5 4.5-5 8-5s6.5 1.5 8 5" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M9 4H5a1 1 0 00-1 1v14a1 1 0 001 1h4" />
      <path d="M15 8l4 4-4 4" />
      <path d="M19 12H9" />
    </svg>
  );
}

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive
    ? 'sidebar__link sidebar__link--active'
    : 'sidebar__link';
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      navigate('/login', { replace: true });
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sidebar__brand">
          <Wordmark />
        </div>
        <nav className="sidebar__nav" aria-label="Navegação principal">
          <NavLink to="/dashboard" className={navLinkClass}>
            <GridIcon />
            <span>Painel</span>
          </NavLink>
          <NavLink to="/planos" className={navLinkClass}>
            <LayersIcon />
            <span>Planos</span>
          </NavLink>
          <NavLink to="/perfil" className={navLinkClass}>
            <UserIcon />
            <span>Perfil</span>
          </NavLink>
        </nav>
        <div className="sidebar__footer">
          <button
            type="button"
            className="sidebar__link sidebar__link--muted"
            onClick={() => void handleSignOut()}
            disabled={signingOut}
          >
            <LogoutIcon />
            <span>{signingOut ? 'Saindo…' : 'Sair'}</span>
          </button>
        </div>
      </aside>
      <div className="shell__main">
        <main className="shell__content">{children}</main>
        <footer className="shell__footer">
          Jarvis — assistente pessoal por WhatsApp
        </footer>
      </div>
    </div>
  );
}
