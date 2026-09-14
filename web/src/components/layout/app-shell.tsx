import type { ReactNode } from 'react';
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { PrivacyProvider } from '../../features/finance/context/privacy-context';
import { authClient } from '../../lib/auth-client';
import {
  IconGrid,
  IconLayers,
  IconLogout,
  IconSettings,
  IconUser,
  IconWallet,
} from '../ui/icons';
import { Wordmark } from '../ui/wordmark';

function navLinkClass({ isActive }: { isActive: boolean }) {
  return isActive ? 'sidebar__link sidebar__link--active' : 'sidebar__link';
}

export function AppShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
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
    <PrivacyProvider>
      <div className="shell">
        <aside className="sidebar">
          <div className="sidebar__brand">
            <Wordmark />
          </div>
          <nav className="sidebar__nav" aria-label="Navegação principal">
            <NavLink to="/dashboard" className={navLinkClass}>
              <IconGrid />
              <span>Painel</span>
            </NavLink>
            <NavLink to="/financas" className={navLinkClass}>
              <IconWallet />
              <span>Finanças</span>
            </NavLink>
            <NavLink to="/planos" className={navLinkClass}>
              <IconLayers />
              <span>Planos</span>
            </NavLink>
            <div className="sidebar__section">Conta</div>
            <NavLink to="/perfil" className={navLinkClass}>
              <IconUser />
              <span>Perfil</span>
            </NavLink>
            <NavLink to="/configuracoes" className={navLinkClass}>
              <IconSettings />
              <span>Configurações</span>
            </NavLink>
          </nav>
          <div className="sidebar__footer">
            {session?.user ? (
              <div className="sidebar__user">
                <span className="sidebar__user-name">{session.user.name}</span>
                <span className="sidebar__user-mail">{session.user.email}</span>
              </div>
            ) : null}
            <button
              type="button"
              className="icon-btn"
              onClick={() => void handleSignOut()}
              disabled={signingOut}
              title="Sair"
              aria-label="Sair"
            >
              <IconLogout />
            </button>
          </div>
        </aside>
        <div className="shell__main">
          <main className="shell__content">{children}</main>
          <footer className="shell__footer">
            <span>Jarvis — assistente pessoal por WhatsApp</span>
            <span>Lembretes, finanças e metas na sua conversa.</span>
          </footer>
        </div>
      </div>
    </PrivacyProvider>
  );
}
